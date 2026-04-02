-- =====================================================
-- Migration 033: Prosperus Tools Hub
-- =====================================================
-- Description: Infrastructure for the 3-pillar Prosperus Tools system:
--   1. Aulas (existing Academy videos)
--   2. Soluções (external tools/links)
--   3. Meu Progresso (individual member reports)
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- Table: tools_solutions
-- Purpose: Manage external tools and solutions (links, integrations)
CREATE TABLE IF NOT EXISTS tools_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    external_url TEXT NOT NULL,
    icon_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: member_progress_files
-- Purpose: Store individual reports/files for members (PDFs, Excel, etc.)
CREATE TABLE IF NOT EXISTS member_progress_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'excel', 'doc', etc.
    file_size INTEGER, -- in bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) -- Admin who uploaded
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tools_solutions_active 
    ON tools_solutions(is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_member_progress_files_member 
    ON member_progress_files(member_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE tools_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_progress_files ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: tools_solutions
-- =====================================================

-- Policy: Authenticated users can view active solutions
CREATE POLICY "Authenticated users can view active solutions"
    ON tools_solutions
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Policy: Admins can view all solutions (active or inactive)
CREATE POLICY "Admins can view all solutions"
    ON tools_solutions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Policy: Admins can insert solutions
CREATE POLICY "Admins can insert solutions"
    ON tools_solutions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Policy: Admins can update solutions
CREATE POLICY "Admins can update solutions"
    ON tools_solutions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Policy: Admins can delete solutions
CREATE POLICY "Admins can delete solutions"
    ON tools_solutions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- =====================================================
-- RLS POLICIES: member_progress_files
-- =====================================================

-- Policy: Members can view ONLY their own files
CREATE POLICY "Members can view own progress files"
    ON member_progress_files
    FOR SELECT
    TO authenticated
    USING (member_id = auth.uid());

-- Policy: Admins can view all progress files
CREATE POLICY "Admins can view all progress files"
    ON member_progress_files
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Policy: Admins can insert progress files
CREATE POLICY "Admins can insert progress files"
    ON member_progress_files
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- Policy: Admins can delete progress files
CREATE POLICY "Admins can delete progress files"
    ON member_progress_files
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'ADMIN'
        )
    );

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Note: Storage buckets must be created via Supabase Dashboard or API
-- Bucket: tools-assets (public)
--   - Purpose: Store solution banners and icons
--   - Access: Public read, Admin write

-- Bucket: member-reports (private)
--   - Purpose: Store individual member reports
--   - Access: RLS-protected (members see only their own)

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update updated_at on tools_solutions
CREATE OR REPLACE FUNCTION update_tools_solutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tools_solutions_updated_at
    BEFORE UPDATE ON tools_solutions
    FOR EACH ROW
    EXECUTE FUNCTION update_tools_solutions_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE tools_solutions IS 'External tools and solutions available to members';
COMMENT ON TABLE member_progress_files IS 'Individual reports and files for member progress tracking';
COMMENT ON COLUMN member_progress_files.member_id IS 'FK to profiles - the member who owns this file';
COMMENT ON COLUMN member_progress_files.created_by IS 'FK to profiles - the admin who uploaded this file';
