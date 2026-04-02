-- ============================================
-- Migration 075: Add birth_date to profiles
-- ============================================
-- Source: HubSpot Deal property 'data_de_nascimento__socio_principal'
-- Synced via hubspot-webhook edge function on deal.propertyChange

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN profiles.birth_date IS 'Data de aniversário do sócio, importada automaticamente do HubSpot (Deal)';
