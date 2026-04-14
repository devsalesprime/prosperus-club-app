// components/roi/RoiDashboard.tsx
// Dashboard de ROI de crescimento do sócio (Versão C-Level Sharp Luxury)
// Design atualizado com glassmorphism, gradientes e TailwindCSS

import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { roiService, type RoiData, type RegistroFaturamento } from '../../services/roiService'
import { TrendingUp, DollarSign, Calendar, Plus, BarChart3, Target, Info } from 'lucide-react'

interface Props {
  socioId: string
  valorPago: number | null
  onRegistrar: (tipo?: 'onboarding' | 'manual' | 'trimestral') => void
}

export function RoiDashboard({ socioId, valorPago, onRegistrar }: Props) {
  const [roiData, setRoiData] = useState<RoiData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      const registros = await roiService.getRegistrosFaturamento(socioId)
      const { data: profile } = await supabase
        .from('profiles')
        .select('valor_pago_mentoria, is_roi_approved')
        .eq('id', socioId)
        .single()

      setRoiData(roiService.calcularRoi(
        registros,
        profile?.valor_pago_mentoria || null,
        profile?.is_roi_approved || false
      ))
      setLoading(false)
    }
    carregarDados()
  }, [socioId])

  if (loading) return <LoadingState />
  if (!roiData) return null

  // Estado: sem faturamento base
  if (roiData.status === 'sem_base') {
    return (
      <div className="bg-[#031726]/80 backdrop-blur-md border border-[#052B48] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BarChart3 size={100} />
        </div>
        <div className="relative z-10">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Target className="text-yellow-500" size={20} />
            Calcule seu Ponto de Partida
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-md leading-relaxed">
            Para medir sua eficiência e o múltiplo exato gerado, precisamos registrar como estava seu negócio antes de entrar no Prosperus Club.
          </p>
          <button
            onClick={() => onRegistrar('onboarding')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-[#031A2B] text-sm font-bold shadow-lg shadow-yellow-900/20 transition-all flex items-center justify-center gap-2"
          >
            Registrar Faturamento Inicial <TrendingUp size={16} />
          </button>
        </div>
      </div>
    )
  }

  // Estado: sem valor pago
  if (roiData.status === 'sem_valor_pago') {
    return (
      <div className="bg-[#031A2B]/50 border border-dashed border-[#052B48] rounded-2xl p-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 bg-[#052B48]/50 rounded-full flex items-center justify-center mb-3">
          <Info className="text-slate-500" size={24} />
        </div>
        <p className="text-sm text-slate-400 font-medium">Aguardando confirmação do valor investido pelo Admin</p>
        <p className="text-xs text-slate-500 mt-1">O cálculo do múltiplo será liberado em breve.</p>
      </div>
    )
  }

  const isPositivo = (roiData.roi ?? 0) >= 0;
  const gradientColor = isPositivo ? 'from-emerald-400 to-emerald-600' : 'from-red-400 to-red-600';
  const shadowColor = isPositivo ? 'shadow-emerald-900/20' : 'shadow-red-900/20';
  const borderColor = isPositivo ? 'border-emerald-500/30' : 'border-red-500/30';

  return (
    <div className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-500">
      {/* Card principal — Retorno em destaque */}
      <div className="relative bg-gradient-to-br from-[#041E32] to-[#031525] border border-[#052B48] rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
              Eficiência do Investimento
            </p>
            <div className="flex items-end gap-3 mb-6">
              <span className={`text-6xl sm:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${gradientColor} drop-shadow-sm`}>
                {roiData.roiFormatado}
              </span>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Múltiplo de<br />Crescimento
              </span>
            </div>

            <div className={`flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border-l-4 ${borderColor}`}>
              <TrendingUp className={isPositivo ? 'text-emerald-500' : 'text-red-500'} size={20} />
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {roiData.fraseConcetual}
              </p>
            </div>
          </div>

          {/* Sub-métricas Direita */}
          <div className="w-full sm:w-[240px] flex flex-col gap-3">
            <MetricCard
              icon={<DollarSign size={14} />}
              label="Faturamento Atual"
              value={formatCurrency(roiData.faturamentoAtual)}
              highlight
            />
            <MetricCard
              icon={<Calendar size={14} />}
              label="Faturamento Inicial"
              value={formatCurrency(roiData.faturamentoBase)}
            />
            <MetricCard
              icon={<Target size={14} />}
              label="Custo da Mentoria"
              value={formatCurrency(roiData.valorPago)}
              isInvestment
            />
          </div>
        </div>
      </div>

      {/* Gráfico de evolução Premium */}
      {roiData.registros.length > 1 && (
        <EvolucaoChart
          registros={roiData.registros}
          base={roiData.faturamentoBase ?? 0}
        />
      )}

      {/* Histórico Moderno */}
      <HistoricoRegistros
        registros={roiData.registros}
        onAtualizar={() => onRegistrar('manual')}
        currentRevenue={roiData.faturamentoAtual}
      />
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, highlight, isInvestment }: { icon: React.ReactNode, label: string; value: string; highlight?: boolean, isInvestment?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border transition-colors ${highlight
        ? 'bg-gradient-to-br from-[#082846] to-[#041E32] border-yellow-500/30 shadow-lg shadow-yellow-900/10'
        : isInvestment
          ? 'bg-slate-900/50 border-slate-700/50'
          : 'bg-[#031A2B]/60 border-[#052B48]'
      }`}>
      <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 ${highlight ? 'text-yellow-500' : isInvestment ? 'text-slate-500' : 'text-slate-400'}`}>
        {icon} {label}
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-white' : isInvestment ? 'text-slate-300' : 'text-slate-200'}`}>
        {value}
      </p>
    </div>
  )
}

function EvolucaoChart({ registros, base }: { registros: RegistroFaturamento[]; base: number }) {
  const pontos = [
    { periodo: 'Entrada', valor: base },
    ...registros
      .filter(r => r.tipo !== 'onboarding')
      .sort((a, b) => new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime())
      .map((r, i) => ({
        periodo: r.periodo_referencia.includes('-')
          ? `Tri ${i + 1}`  // Simplifica rótulo
          : r.periodo_referencia,
        valor: r.valor
      }))
  ]

  if (pontos.length < 2) return null

  const maxValor = Math.max(...pontos.map(p => p.valor)) * 1.05 // 5% padding topo
  const minValor = Math.min(...pontos.map(p => p.valor))
  // Se forem iguais, força um range artificial mínimo
  const range = (maxValor - minValor) === 0 ? maxValor * 0.1 : (maxValor - minValor)
  const realMin = maxValor === minValor ? minValor * 0.9 : minValor

  const W = 400, H = 140, PAD_X = 20, PAD_Y = 20

  const x = (i: number) => PAD_X + (i * (W - PAD_X * 2)) / (pontos.length - 1)
  const y = (v: number) => H - PAD_Y - ((v - realMin) / range) * (H - PAD_Y * 2)

  const pathD = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.valor)}`).join(' ')

  // Caminho fechado para o gradiente sob a linha
  const fillPath = `${pathD} L ${x(pontos.length - 1)} ${H} L ${x(0)} ${H} Z`

  return (
    <div className="bg-[#031726]/80 backdrop-blur-sm border border-[#052B48] rounded-3xl p-6 transition-all hover:border-[#083A60]">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-yellow-500" />
          Progressão Histórica
        </p>
      </div>

      <div className="relative w-full">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible drop-shadow-md">
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ca8a04" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ca8a04" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Eixo base X */}
          <line x1={PAD_X} y1={H - 5} x2={W - PAD_X} y2={H - 5} stroke="#1E293B" strokeWidth="1" />

          {/* Gradiente de área */}
          <path d={fillPath} fill="url(#fillGrad)" />

          {/* Linha principal */}
          <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Linha pontilhada referencial do Faturamento Base (Entrada) */}
          <line x1={PAD_X} y1={y(base)} x2={W - PAD_X} y2={y(base)} stroke="#EAB308" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="4 4" />

          {/* Pontos de Interseção */}
          {pontos.map((p, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(p.valor)} r="6" fill="#031726" stroke="#fde047" strokeWidth="2.5" className="transition-all hover:r-8 hover:fill-yellow-500 cursor-pointer" />
            </g>
          ))}
        </svg>

        {/* Labels do eixo X usando HTML (melhor font rendering) */}
        <div className="flex justify-between w-full text-[10px] sm:text-xs font-semibold text-slate-500 mt-3 px-[4px]">
          {pontos.map((p, i) => (
            <span key={i} className={i === 0 ? 'text-yellow-600/70' : 'text-slate-400'}>
              {p.periodo}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoricoRegistros({ registros, onAtualizar, currentRevenue }: { registros: RegistroFaturamento[]; onAtualizar: () => void, currentRevenue: number | null }) {
  const sortedRegistros = [...registros].sort((a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime())

  return (
    <div className="bg-[#031726]/80 backdrop-blur-sm border border-[#052B48] rounded-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} className="text-blue-400" />
          Histórico Oficial
        </p>
        <button
          onClick={onAtualizar}
          className="flex items-center gap-1.5 bg-[#052B48]/50 hover:bg-[#052B48] border border-[#0A3D69] text-blue-300 text-xs font-bold py-2 px-4 rounded-full transition-all"
        >
          <Plus size={14} strokeWidth={3} /> Atualizar Faturamento
        </button>
      </div>

      <div className="space-y-3">
        {sortedRegistros.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4 bg-slate-900/30 rounded-xl border border-dashed border-slate-700/50">
            Nenhum registro ativo
          </p>
        ) : (
          sortedRegistros.map((r, index) => {
            const isLatest = index === 0;
            return (
              <div key={r.id} className={`flex justify-between items-center p-4 rounded-2xl ${isLatest ? 'bg-gradient-to-r from-[#052B48]/30 to-transparent border border-blue-500/20' : 'bg-transparent border border-[#052B48]/50'}`}>
                <div className="flex flex-col">
                  <span className={`text-base font-bold ${isLatest ? 'text-white' : 'text-slate-300'}`}>
                    {formatCurrency(r.valor)}/mês
                    {isLatest && <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Atual</span>}
                  </span>
                  <span className="text-xs text-slate-500 mt-1 capitalize">
                    {r.tipo} · Ref: {r.periodo_referencia}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-slate-400">
                    {new Date(r.data_registro).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="w-full bg-[#031726]/50 rounded-3xl p-12 flex flex-col items-center justify-center border border-[#052B48] animate-pulse">
      <div className="w-12 h-12 border-4 border-[#052B48] border-t-yellow-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 text-sm font-medium animate-pulse">Carregando métricas financeiras...</p>
    </div>
  )
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (value >= 1_000) return `R$ ${(value / 1000).toFixed(0)}k`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
}
