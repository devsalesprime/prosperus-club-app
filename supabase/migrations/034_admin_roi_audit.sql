-- Migration 034: Admin ROI Audit System
-- Created: 2026-02-02
-- Description: Adds audit workflow for member deals with fraud detection and official rankings

-- ============================================
-- 1. SCHEMA UPDATES
-- ============================================

-- Add new values to deal_status ENUM
-- Note: PostgreSQL ENUMs require COMMIT before new values can be used
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'AUDITADO';
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'INVALIDADO';

-- COMMIT the transaction so new ENUM values are available
COMMIT;

-- Remove the old constraint (it's not needed with ENUM type)
ALTER TABLE member_deals DROP CONSTRAINT IF EXISTS member_deals_status_check;

-- Add audit tracking fields
ALTER TABLE member_deals 
ADD COLUMN IF NOT EXISTS audit_notes TEXT,
ADD COLUMN IF NOT EXISTS audited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS audited_by UUID REFERENCES auth.users(id);

-- Add indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_member_deals_status_amount 
ON member_deals(status, amount DESC);

CREATE INDEX IF NOT EXISTS idx_member_deals_audited_at 
ON member_deals(audited_at DESC) WHERE audited_at IS NOT NULL;

-- ============================================
-- 2. ADMIN VIEWS
-- ============================================

-- View: Contested deals (priority queue for admin)
CREATE OR REPLACE VIEW view_admin_contested_deals AS
SELECT 
    d.id,
    d.seller_id,
    d.buyer_id,
    d.amount,
    d.description,
    d.status,
    d.deal_date,
    d.created_at,
    d.updated_at,
    d.audit_notes,
    d.audited_at,
    seller.name as seller_name,
    seller.email as seller_email,
    seller.image_url as seller_image,
    buyer.name as buyer_name,
    buyer.email as buyer_email,
    buyer.image_url as buyer_image,
    auditor.name as auditor_name
FROM member_deals d
LEFT JOIN profiles seller ON d.seller_id = seller.id
LEFT JOIN profiles buyer ON d.buyer_id = buyer.id
LEFT JOIN profiles auditor ON d.audited_by = auditor.id
WHERE d.status = 'CONTESTED'
ORDER BY d.created_at ASC;

-- View: High-value deals requiring audit
CREATE OR REPLACE VIEW view_admin_high_value_deals AS
SELECT 
    d.id,
    d.seller_id,
    d.buyer_id,
    d.amount,
    d.description,
    d.status,
    d.deal_date,
    d.created_at,
    seller.name as seller_name,
    seller.email as seller_email,
    seller.image_url as seller_image,
    buyer.name as buyer_name,
    buyer.email as buyer_email,
    buyer.image_url as buyer_image
FROM member_deals d
LEFT JOIN profiles seller ON d.seller_id = seller.id
LEFT JOIN profiles buyer ON d.buyer_id = buyer.id
WHERE d.status = 'CONFIRMED' 
  AND d.amount >= 10000
  AND d.audited_at IS NULL
ORDER BY d.amount DESC;

-- View: Official rankings (audited deals only)
CREATE OR REPLACE VIEW view_admin_official_rankings AS
SELECT 
    d.seller_id,
    p.name,
    p.email,
    p.image_url,
    COUNT(*) as deals_count,
    SUM(d.amount) as total_sales,
    AVG(d.amount) as avg_ticket,
    MAX(d.deal_date) as last_deal_date
FROM member_deals d
JOIN profiles p ON d.seller_id = p.id
WHERE d.status = 'AUDITADO'
GROUP BY d.seller_id, p.name, p.email, p.image_url
ORDER BY total_sales DESC;

-- View: Suspicious deals (fraud detection)
CREATE OR REPLACE VIEW view_admin_suspicious_deals AS
WITH same_day_deals AS (
    SELECT 
        seller_id,
        buyer_id,
        DATE(created_at) as deal_day,
        COUNT(*) as deals_same_day
    FROM member_deals
    WHERE status IN ('PENDING', 'CONFIRMED')
    GROUP BY seller_id, buyer_id, DATE(created_at)
    HAVING COUNT(*) > 2
)
SELECT 
    d.id,
    d.seller_id,
    d.buyer_id,
    d.amount,
    d.description,
    d.status,
    d.created_at,
    seller.name as seller_name,
    buyer.name as buyer_name,
    'MULTIPLE_SAME_DAY' as suspicion_type,
    sdd.deals_same_day as suspicion_count
FROM member_deals d
JOIN same_day_deals sdd ON 
    d.seller_id = sdd.seller_id AND 
    d.buyer_id = sdd.buyer_id AND 
    DATE(d.created_at) = sdd.deal_day
LEFT JOIN profiles seller ON d.seller_id = seller.id
LEFT JOIN profiles buyer ON d.buyer_id = buyer.id
ORDER BY sdd.deals_same_day DESC, d.created_at DESC;

-- ============================================
-- 3. RPC FUNCTIONS
-- ============================================

-- Function: Audit a deal (approve or reject)
CREATE OR REPLACE FUNCTION admin_audit_deal(
    p_deal_id UUID,
    p_decision TEXT, -- 'APPROVE' or 'REJECT'
    p_notes TEXT
)
RETURNS VOID AS $$
DECLARE
    v_new_status deal_status;
    v_deal RECORD;
    v_notification_title TEXT;
    v_notification_message TEXT;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate decision
    IF p_decision NOT IN ('APPROVE', 'REJECT') THEN
        RAISE EXCEPTION 'Invalid decision: must be APPROVE or REJECT';
    END IF;

    -- Validate notes
    IF p_notes IS NULL OR TRIM(p_notes) = '' THEN
        RAISE EXCEPTION 'Audit notes are required';
    END IF;

    -- Get deal info
    SELECT * INTO v_deal FROM member_deals WHERE id = p_deal_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal not found';
    END IF;

    -- Determine new status
    IF p_decision = 'APPROVE' THEN
        v_new_status := 'AUDITADO';
        v_notification_title := '✅ Negócio Aprovado';
        v_notification_message := 'Seu negócio de R$ ' || 
            TO_CHAR(v_deal.amount, 'FM999G999G999D00') || 
            ' foi auditado e aprovado pela equipe!';
    ELSE
        v_new_status := 'INVALIDADO';
        v_notification_title := '❌ Negócio Invalidado';
        v_notification_message := 'Seu negócio de R$ ' || 
            TO_CHAR(v_deal.amount, 'FM999G999G999D00') || 
            ' foi invalidado. Motivo: ' || p_notes;
    END IF;

    -- Update deal
    UPDATE member_deals
    SET 
        status = v_new_status,
        audit_notes = p_notes,
        audited_at = NOW(),
        audited_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_deal_id;

    -- Notify seller
    INSERT INTO user_notifications (user_id, title, message, action_url)
    VALUES (
        v_deal.seller_id,
        v_notification_title,
        v_notification_message,
        '/deals'
    );

    -- If rejected, also notify buyer
    IF p_decision = 'REJECT' THEN
        INSERT INTO user_notifications (user_id, title, message, action_url)
        VALUES (
            v_deal.buyer_id,
            '🔔 Negócio Invalidado',
            'O negócio de R$ ' || TO_CHAR(v_deal.amount, 'FM999G999G999D00') || 
            ' foi invalidado pela administração.',
            '/deals'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get admin KPIs for a specific month
CREATE OR REPLACE FUNCTION get_admin_roi_kpis(
    p_month TEXT DEFAULT NULL -- Format: 'YYYY-MM', NULL for current month
)
RETURNS JSON AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_result JSON;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Calculate date range
    IF p_month IS NULL THEN
        v_start_date := DATE_TRUNC('month', CURRENT_DATE);
        v_end_date := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
    ELSE
        v_start_date := (p_month || '-01')::DATE;
        v_end_date := DATE_TRUNC('month', v_start_date) + INTERVAL '1 month' - INTERVAL '1 day';
    END IF;

    -- Calculate KPIs
    SELECT JSON_BUILD_OBJECT(
        'totalVolume', COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'AUDITADO') THEN amount ELSE 0 END), 0),
        'avgTicket', COALESCE(AVG(CASE WHEN status IN ('CONFIRMED', 'AUDITADO') THEN amount END), 0),
        'dealsCount', COUNT(*),
        'confirmedCount', COUNT(*) FILTER (WHERE status = 'CONFIRMED'),
        'auditedCount', COUNT(*) FILTER (WHERE status = 'AUDITADO'),
        'contestedCount', COUNT(*) FILTER (WHERE status = 'CONTESTED'),
        'invalidatedCount', COUNT(*) FILTER (WHERE status = 'INVALIDADO'),
        'pendingCount', COUNT(*) FILTER (WHERE status = 'PENDING'),
        'highValueCount', COUNT(*) FILTER (WHERE amount >= 10000 AND status = 'CONFIRMED' AND audited_at IS NULL)
    ) INTO v_result
    FROM member_deals
    WHERE deal_date >= v_start_date AND deal_date <= v_end_date;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Bulk audit deals
CREATE OR REPLACE FUNCTION admin_bulk_audit_deals(
    p_deal_ids UUID[],
    p_decision TEXT,
    p_notes TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_deal_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Process each deal
    FOREACH v_deal_id IN ARRAY p_deal_ids
    LOOP
        BEGIN
            PERFORM admin_audit_deal(v_deal_id, p_decision, p_notes);
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue with other deals
            RAISE NOTICE 'Failed to audit deal %: %', v_deal_id, SQLERRM;
        END;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. RLS POLICIES (Admin Access)
-- ============================================

-- Allow admins to view all deals (for audit purposes)
CREATE POLICY "Admins can view all deals"
ON member_deals FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM')
    )
);

-- ============================================
-- 5. COMMENTS
-- ============================================

COMMENT ON COLUMN member_deals.audit_notes IS 'Admin notes explaining audit decision';
COMMENT ON COLUMN member_deals.audited_at IS 'Timestamp when deal was audited';
COMMENT ON COLUMN member_deals.audited_by IS 'Admin user who performed the audit';

COMMENT ON VIEW view_admin_contested_deals IS 'Priority queue of contested deals for admin review';
COMMENT ON VIEW view_admin_high_value_deals IS 'High-value deals (>= R$ 10k) requiring audit';
COMMENT ON VIEW view_admin_official_rankings IS 'Official rankings based on audited deals only';
COMMENT ON VIEW view_admin_suspicious_deals IS 'Potentially fraudulent deals for admin investigation';

COMMENT ON FUNCTION admin_audit_deal IS 'Audit a deal (approve or reject) with admin notes';
COMMENT ON FUNCTION get_admin_roi_kpis IS 'Get admin KPIs for ROI dashboard';
COMMENT ON FUNCTION admin_bulk_audit_deals IS 'Bulk audit multiple deals at once';
