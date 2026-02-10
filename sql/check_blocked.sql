-- VERIFICAR STATUS DE BLOQUEIO DO USUÁRIO
-- Execute no Supabase SQL Editor

-- Verificar usuário específico bloqueado
SELECT id, name, email, role, is_blocked, blocked_at, blocked_reason, blocked_by
FROM profiles
WHERE id = '41bb433f-9e76-4cc9-ae8e-47fc4a3e431f';

-- Listar TODOS os usuários bloqueados
SELECT id, name, email, is_blocked, blocked_reason
FROM profiles
WHERE is_blocked = true;
