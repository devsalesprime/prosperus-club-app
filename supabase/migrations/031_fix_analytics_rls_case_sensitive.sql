-- Migration: Fix case-sensitive analytics_events RLS policy
-- Problema: Policy usa profiles.role IN ('ADMIN', 'TEAM') que é case-sensitive
-- Solução: Usar UPPER(role::TEXT) para comparação case-insensitive

-- Drop existing policy
DROP POLICY IF EXISTS "Allow admins to read analytics" ON public.analytics_events;

-- Recreate with case-insensitive check
CREATE POLICY "Allow admins to read analytics"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND UPPER(profiles.role::TEXT) IN ('ADMIN', 'TEAM')
    )
);

-- Comentário
COMMENT ON POLICY "Allow admins to read analytics" ON public.analytics_events 
IS 'Allows ADMIN and TEAM users to read all analytics events (case-insensitive role check)';
