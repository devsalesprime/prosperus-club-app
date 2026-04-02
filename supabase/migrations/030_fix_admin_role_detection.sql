-- ============================================
-- FIX: Admin Role Detection - Case Insensitive
-- ============================================

-- Atualizar função para ser case-insensitive
CREATE OR REPLACE FUNCTION public.user_has_admin_role()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
        AND UPPER(role::TEXT) IN ('ADMIN', 'TEAM')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Testar novamente
SELECT 
    '✅ Testing admin role function (case insensitive)' as status,
    user_has_admin_role() as is_admin,
    (SELECT role FROM profiles WHERE id = auth.uid()) as current_role;
