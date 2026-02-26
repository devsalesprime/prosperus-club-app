-- ============================================
-- Migration 045: Exclude ADMIN/TEAM from Rankings
-- ============================================
-- Rankings should only show MEMBERs, not ADMINs or TEAM.
-- Recreates both ranking views with role filter.
-- ============================================

-- 1. Ranking de Vendas — somente MEMBER
CREATE OR REPLACE VIEW public.view_ranking_sellers AS
SELECT 
    d.seller_id as user_id,
    p.name,
    p.image_url,
    COUNT(d.id) as deal_count,
    COALESCE(SUM(d.amount), 0) as total_amount
FROM public.member_deals d
JOIN public.profiles p ON d.seller_id = p.id
WHERE d.status = 'CONFIRMED'
  AND p.role = 'MEMBER'
GROUP BY d.seller_id, p.name, p.image_url
ORDER BY total_amount DESC;

-- 2. Ranking de Indicações — somente MEMBER
CREATE OR REPLACE VIEW public.view_ranking_referrers AS
SELECT 
    r.referrer_id as user_id,
    p.name,
    p.image_url,
    COUNT(r.id) as referral_count,
    SUM(CASE WHEN r.status = 'CONVERTED' THEN 1 ELSE 0 END) as converted_count,
    COALESCE(SUM(CASE WHEN r.status = 'CONVERTED' THEN r.converted_amount ELSE 0 END), 0) as total_converted_amount
FROM public.member_referrals r
JOIN public.profiles p ON r.referrer_id = p.id
WHERE p.role = 'MEMBER'
GROUP BY r.referrer_id, p.name, p.image_url
ORDER BY referral_count DESC;

SELECT '✅ Migration 045: ADMIN/TEAM excluídos dos rankings' as status;
