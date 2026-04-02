-- ============================================
-- Migration: user_devices (SIMPLIFIED)
-- Descrição: Tabela para armazenar dispositivos registrados para push notifications
-- Data: 02/02/2026
-- Versão: Simplificada para execução via Dashboard
-- ============================================

-- Criar tabela user_devices
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_json JSONB NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, subscription_json)
);

-- Comentários
COMMENT ON TABLE user_devices IS 'Dispositivos registrados para push notifications';
COMMENT ON COLUMN user_devices.subscription_json IS 'PushSubscription object do navegador (endpoint, keys)';
COMMENT ON COLUMN user_devices.device_name IS 'Nome amigável do dispositivo (opcional)';
COMMENT ON COLUMN user_devices.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN user_devices.is_active IS 'Se o dispositivo ainda está ativo (pode ser desativado se push falhar)';

-- Habilitar RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (para permitir re-execução)
DROP POLICY IF EXISTS "Users can manage their own devices" ON user_devices;
DROP POLICY IF EXISTS "Admins can view all devices" ON user_devices;

-- Policy: Usuários podem gerenciar seus próprios dispositivos
CREATE POLICY "Users can manage their own devices"
  ON user_devices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins podem ver todos os dispositivos
CREATE POLICY "Admins can view all devices"
  ON user_devices
  FOR SELECT
  USING (public.user_has_admin_role(auth.uid()));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_is_active ON user_devices(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_devices_last_used ON user_devices(last_used_at DESC);
