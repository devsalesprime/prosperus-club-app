-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  page_url text,
  session_id text,
  device_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  author text,
  published_date timestamp with time zone,
  image_url text,
  excerpt text,
  content text,
  category_name text,
  status USER-DEFINED DEFAULT 'DRAFT'::article_status,
  views integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT articles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  link_type USER-DEFINED DEFAULT 'INTERNAL'::link_type,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  placement USER-DEFINED DEFAULT 'HOME'::banner_placement,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, user_id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  type USER-DEFINED NOT NULL DEFAULT 'MEMBER'::event_type,
  category USER-DEFINED NOT NULL DEFAULT 'PRESENTIAL'::event_category,
  location text,
  map_link text,
  meeting_link text,
  meeting_password text,
  video_url text,
  cover_image text,
  banner_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gallery_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT ''::text,
  embedUrl text NOT NULL,
  createdAt timestamp with time zone NOT NULL DEFAULT now(),
  coverImage text,
  CONSTRAINT gallery_albums_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gallery_config (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  main_gallery_url text,
  latest_album_url text,
  provider text DEFAULT 'EXTERNAL'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gallery_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  conversation_id uuid,
  sender_id uuid,
  content text NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  target_url text,
  segment text DEFAULT 'ALL'::text,
  status text DEFAULT 'SENT'::text,
  sent_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profile_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  changed_by uuid,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  change_type text DEFAULT 'UPDATE'::text CHECK (change_type = ANY (ARRAY['UPDATE'::text, 'CREATE'::text, 'DELETE'::text])),
  ip_address inet,
  user_agent text,
  requires_approval boolean DEFAULT false,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profile_history_pkey PRIMARY KEY (id),
  CONSTRAINT profile_history_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT profile_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id),
  CONSTRAINT profile_history_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role USER-DEFINED DEFAULT 'MEMBER'::user_role,
  company text,
  job_title text,
  image_url text,
  bio text,
  socials jsonb DEFAULT '{}'::jsonb,
  tags ARRAY DEFAULT '{}'::text[],
  is_featured boolean DEFAULT false,
  exclusive_benefit jsonb,
  has_completed_onboarding boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  phone text,
  is_blocked boolean DEFAULT false,
  blocked_at timestamp with time zone,
  blocked_reason text,
  blocked_by uuid,
  pitch_video_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_blocked_by_fkey FOREIGN KEY (blocked_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  action_url text,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.video_comments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  video_id uuid,
  author_id uuid,
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_comments_pkey PRIMARY KEY (id),
  CONSTRAINT video_comments_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id),
  CONSTRAINT video_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.video_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  video_id uuid,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_watched_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_progress_pkey PRIMARY KEY (id),
  CONSTRAINT video_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT video_progress_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id)
);
CREATE TABLE public.videos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  video_url text,
  duration text,
  category text,
  series_id text,
  series_order integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT videos_pkey PRIMARY KEY (id)
);