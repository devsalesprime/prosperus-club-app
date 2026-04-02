-- Migration: Add cover image to gallery albums
-- FASE 6 (ENHANCEMENT): Imagem de Destaque para Álbuns

-- Add coverImage column to gallery_albums table
ALTER TABLE public.gallery_albums
ADD COLUMN IF NOT EXISTS "coverImage" TEXT DEFAULT NULL;

-- Add comment to the new column
COMMENT ON COLUMN public.gallery_albums."coverImage" IS 'URL da imagem de destaque/banner do álbum (opcional)';
