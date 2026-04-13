CREATE TABLE IF NOT EXISTS public.member_journey_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    revenue_amount NUMERIC(15,2) NOT NULL,
    milestone_title TEXT NOT NULL,
    achieved_at DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.member_journey_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own journey milestones"
    ON public.member_journey_milestones
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journey milestones"
    ON public.member_journey_milestones
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journey milestones"
    ON public.member_journey_milestones
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journey milestones"
    ON public.member_journey_milestones
    FOR DELETE
    USING (auth.uid() = user_id);
