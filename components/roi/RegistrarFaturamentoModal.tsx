// components/roi/RegistrarFaturamentoModal.tsx
// Modal para registrar/atualizar faturamento mensal médio

import React, { useState } from 'react'
import { roiService } from '../../services/roiService'

interface Props {
  socioId: string
  tipo:    'onboarding' | 'trimestral' | 'manual'
  onClose:   () => void
  onSuccess: () => void
}

export function RegistrarFaturamentoModal({ socioId, tipo, onClose, onSuccess }: Props) {
  const [valor, setValor]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const titulo = {
    onboarding: 'Faturamento inicial',
    trimestral: 'Atualização trimestral',
    manual:     'Atualizar faturamento',
  }[tipo]

  const pergunta = {
    onboarding: 'Qual era seu faturamento mensal médio quando entrou no Prosperus Club?',
    trimestral: 'Qual é seu faturamento mensal médio nos últimos 3 meses?',
    manual:     'Qual é seu faturamento mensal médio atual?',
  }[tipo]

  const formatInputCurrency = (val: string): string => {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    const num = parseInt(digits, 10)
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  const parseCurrency = (val: string): number => {
    return parseFloat(val.replace(/\./g, '').replace(',', '.')) || 0
  }

  const handleSalvar = async () => {
    const valorNumerico = parseCurrency(valor)
    if (!valorNumerico || valorNumerico <= 0) {
      setError('Informe um valor válido maior que zero.')
      return
    }
    setLoading(true)
    try {
      await roiService.salvarRegistroFaturamento(socioId, valorNumerico, tipo)
      onSuccess()
      onClose()
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#031726', borderRadius: '20px 20px 0 0', padding: '8px 0 40px', width: '100%', maxWidth: 480 }}>

        <div style={{ width: 40, height: 4, background: '#052B48', borderRadius: 2, margin: '8px auto 24px' }} />

        <div style={{ padding: '0 24px' }}>
          <div className="flex justify-between items-center mb-4">
            <p style={{ fontSize: 18, fontWeight: 700, color: '#FCF7F0', margin: '0' }}>{titulo}</p>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#95A4B4', cursor: 'pointer', padding: 4 }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <p style={{ fontSize: 14, color: '#95A4B4', margin: '0 0 24px', lineHeight: 1.6 }}>{pergunta}</p>

          {/* Input com máscara de moeda */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#95A4B4', fontWeight: 600 }}>R$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={valor}
              onChange={e => {
                setValor(formatInputCurrency(e.target.value))
                setError('')
              }}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '16px 16px 16px 48px',
                background: '#031A2B', border: `1px solid ${error ? '#EF4444' : '#052B48'}`,
                borderRadius: 12, color: '#FCF7F0',
                fontSize: 22, fontWeight: 700,
                outline: 'none',
              }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 12px' }}>{error}</p>}

          <p style={{ fontSize: 12, color: '#95A4B4', margin: '0 0 24px', lineHeight: 1.5 }}>
            Informe o valor médio mensal. Seus dados são privados e usados apenas para calcular seu ROI.
          </p>

          <button
            onClick={handleSalvar}
            disabled={loading || !valor}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: loading ? '#052B48' : 'linear-gradient(135deg, #FFDA71, #CA9A43)',
              color: '#031A2B', fontSize: 16, fontWeight: 700,
              cursor: loading || !valor ? 'not-allowed' : 'pointer', opacity: loading || !valor ? 0.7 : 1,
            }}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
