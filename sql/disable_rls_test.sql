-- ============================================
-- TESTE: Desabilitar RLS temporariamente
-- ============================================
-- ATENÇÃO: Execute isso SÓ PARA TESTAR!
-- Depois de testar, habilite novamente
-- ============================================

-- DESABILITAR RLS NAS TABELAS DE CHAT
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

SELECT 'RLS DESABILITADO - TESTE AGORA!' as status;

-- ============================================
-- DEPOIS DE TESTAR, EXECUTE ISSO PARA REABILITAR:
-- ============================================
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
