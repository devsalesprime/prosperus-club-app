-- ============================================
-- Migration: Add Benefit Rejection Reason
-- ============================================
-- Adiciona coluna rejection_reason à tabela profiles
-- para o feedback em loop (quando admin recusa benefício)

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;
