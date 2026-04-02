-- VERIFICAÇÃO RÁPIDA: Galeria Prosperus Club
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gallery_albums'
) AS tabela_existe;

-- 2. Contar quantos álbuns existem
SELECT COUNT(*) AS total_albums FROM public.gallery_albums;

-- 3. Listar todos os álbuns (se existirem)
SELECT 
    id,
    title,
    description,
    "embedUrl",
    "createdAt"
FROM public.gallery_albums
ORDER BY "createdAt" DESC;

-- 4. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'gallery_albums';

-- 5. Inserir um álbum de teste (OPCIONAL - descomente se quiser testar)
/*
INSERT INTO public.gallery_albums (title, description, "embedUrl", "createdAt")
VALUES (
    'Álbum de Teste - ' || NOW()::TEXT,
    'Este é um álbum de teste criado via SQL',
    'https://example.com/gallery/test',
    NOW()
)
RETURNING *;
*/
