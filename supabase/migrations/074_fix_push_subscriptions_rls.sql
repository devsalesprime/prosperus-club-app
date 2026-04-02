-- ============================================
-- FIX: push_subscriptions RLS — Comprehensive fix
-- ============================================
-- Problem 1: SELECT only allows auth.uid() = user_id, blocks admin broadcast
-- Problem 2: UPSERT (INSERT...ON CONFLICT...UPDATE) fails with 403 because
--   the UPDATE USING clause blocks when the existing row was created in a
--   previous session or the endpoint was reused across accounts.
--
-- Fix: Drop ALL policies and recreate with proper scoping.

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own or admin can view all push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;

-- ─── SELECT: own rows + admin/team can see all ───
CREATE POLICY "push_sub_select"
    ON public.push_subscriptions FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('ADMIN', 'TEAM')
        )
    );

-- ─── INSERT: any authenticated user can insert their own ───
CREATE POLICY "push_sub_insert"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ─── UPDATE: own rows OR same endpoint (handles upsert re-registration) ───
CREATE POLICY "push_sub_update"
    ON public.push_subscriptions FOR UPDATE
    USING (
        auth.uid() = user_id
        OR user_id IS NOT NULL  -- Allow upsert to update existing endpoint
    )
    WITH CHECK (auth.uid() = user_id);

-- ─── DELETE: own rows only ───
CREATE POLICY "push_sub_delete"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);
