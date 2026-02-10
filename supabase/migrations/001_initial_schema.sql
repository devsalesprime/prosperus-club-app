-- Prosperus Club App v2.0 - Initial Database Schema
-- Migration 001: Core tables and policies

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (Matching Types)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'TEAM', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('MEMBER', 'TEAM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_category AS ENUM ('PRESENTIAL', 'ONLINE', 'RECORDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE banner_placement AS ENUM ('HOME', 'ACADEMY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE link_type AS ENUM ('INTERNAL', 'EXTERNAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE article_status AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES / MEMBERS TABLE (Sync with Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'MEMBER',
    company TEXT,
    job_title TEXT,
    image_url TEXT,
    bio TEXT,
    socials JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    exclusive_benefit JSONB DEFAULT NULL,
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    type event_type NOT NULL DEFAULT 'MEMBER',
    category event_category NOT NULL DEFAULT 'PRESENTIAL',
    location TEXT,
    map_link TEXT,
    meeting_link TEXT,
    meeting_password TEXT,
    video_url TEXT,
    cover_image TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VIDEOS (ACADEMY) TABLE
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    video_url TEXT,
    duration TEXT,
    category TEXT,
    series_id UUID,
    series_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VIDEO COMMENTS
CREATE TABLE IF NOT EXISTS public.video_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VIDEO PROGRESS (User Specific)
CREATE TABLE IF NOT EXISTS public.video_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    last_watched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- 8. ARTICLES (NEWS)
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    author TEXT,
    published_date TIMESTAMPTZ,
    image_url TEXT,
    excerpt TEXT,
    content TEXT,
    category_name TEXT,
    status article_status DEFAULT 'DRAFT',
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BANNERS (HOME/ACADEMY)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT,
    link_type link_type DEFAULT 'INTERNAL',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    placement banner_placement DEFAULT 'HOME',
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS (PUSH)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_url TEXT,
    segment TEXT DEFAULT 'ALL',
    status TEXT DEFAULT 'SENT',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. USER NOTIFICATIONS (Inbox)
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. GALLERY CONFIG
CREATE TABLE IF NOT EXISTS public.gallery_config (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    main_gallery_url TEXT,
    latest_album_url TEXT,
    provider TEXT DEFAULT 'EXTERNAL',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- SECURITY (RLS) ---

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Events viewable by authenticated users" ON public.events;
DROP POLICY IF EXISTS "Videos viewable by authenticated users" ON public.videos;
DROP POLICY IF EXISTS "Banners viewable by authenticated users" ON public.banners;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Events viewable by authenticated users" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Videos viewable by authenticated users" ON public.videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Banners viewable by authenticated users" ON public.banners FOR SELECT TO authenticated USING (true);

-- Helper Trigger for Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Membro'), 'MEMBER')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
