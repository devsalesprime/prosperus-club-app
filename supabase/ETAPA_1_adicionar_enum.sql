-- SCRIPT CORRIGIDO: Migração do Enum em Etapas Separadas
-- Execute cada bloco SEPARADAMENTE (um de cada vez)

-- ============================================
-- ETAPA 1: Adicionar novos valores ao enum
-- Execute este bloco PRIMEIRO
-- ============================================

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'TEAM';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MEMBER';

-- ⚠️ PARE AQUI! 
-- Clique em RUN para executar apenas este bloco
-- Aguarde a mensagem "Success"
-- Depois vá para a ETAPA 2 abaixo
