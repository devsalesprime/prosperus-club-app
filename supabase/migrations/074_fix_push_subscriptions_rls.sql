-- ============================================
-- FIX: push_subscriptions RLS — Comprehensive fix
-- ============================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can view own or admin can view all push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;

DROP POLICY IF EXISTS "push_sub_select" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_sub_insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_sub_update" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_sub_delete" ON public.push_subscriptions;

-- ─── SELECT: anyone can see (needed for endpoint conflict checks) ───
CREATE POLICY "push_sub_select"
    ON public.push_subscriptions FOR SELECT
    USING (true);

-- ─── INSERT: any authenticated user can insert their own ───
CREATE POLICY "push_sub_insert"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ─── UPDATE: own rows OR same endpoint (handles upsert re-registration) ───
CREATE POLICY "push_sub_update"
    ON public.push_subscriptions FOR UPDATE
    USING (true)
    WITH CHECK (auth.uid() = user_id);

-- ─── DELETE: own rows only ───
CREATE POLICY "push_sub_delete"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);
