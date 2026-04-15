// services/roiService.ts
// Responsabilidade: cálculo do ROI de crescimento (delta acumulado)
// Documentação: handover_roi_socio.docx (Sales Prime, Abril 2026)

import { supabase } from '../lib/supabase'

export interface RegistroFaturamento {
  id:                 string
  socio_id:           string
  valor:              number
  periodo_referencia: string
  tipo:               'onboarding' | 'trimestral' | 'manual'
  data_registro:      string
  fonte:              string
}

export interface RoiData {
  roi:              number | null   // null = dados insuficientes
  roiFormatado:     string          // ex: "3,3x" ou "+233%"
  fraseConcetual:   string          // ex: "Para cada R$1 investido..."
  deltaAcumulado:   number
  faturamentoBase:  number | null
  faturamentoAtual: number | null
  valorPago:        number | null
  registros:        RegistroFaturamento[]
  status:           'ok' | 'sem_base' | 'sem_valor_pago' | 'negativo' | 'aguardando_atual'
}

class RoiService {
  // ─── Buscar todos os registros de um sócio ──────────────────────────────────
  async getRegistrosFaturamento(socioId: string): Promise<RegistroFaturamento[]> {
    const { data, error } = await supabase
      .from('registros_faturamento')
      .select('*')
      .eq('socio_id', socioId)
      .order('periodo_referencia', { ascending: true })
      .order('data_registro', { ascending: false })

    if (error) throw error
    return data || []
  }

  // ─── Calcular ROI delta acumulado ────────────────────────────────────────────
  calcularRoi(
    registros: RegistroFaturamento[],
    valorPago: number | null,
    isRoiApproved: boolean
  ): RoiData {
    // Sem registro de onboarding
    const registroBase = registros.find(r => r.tipo === 'onboarding')
    if (!registroBase) {
      return {
        roi: null, roiFormatado: '--', fraseConcetual: '',
        deltaAcumulado: 0, faturamentoBase: null, faturamentoAtual: null,
        valorPago, registros, status: 'sem_base'
      }
    }

    // Sem valor pago (denominador) ou sem aprovação do Admin
    if (!isRoiApproved || !valorPago || valorPago <= 0) {
      return {
        roi: null, roiFormatado: '--', fraseConcetual: '',
        deltaAcumulado: 0, faturamentoBase: registroBase.valor, faturamentoAtual: null,
        valorPago: null, registros, status: 'sem_valor_pago'
      }
    }

    const base = registroBase.valor

    // Deduplicar por período — usar o mais recente de cada período
    const porPeriodo = new Map<string, RegistroFaturamento>()
    registros
      .filter(r => r.tipo !== 'onboarding')
      .forEach(r => {
        const existente = porPeriodo.get(r.periodo_referencia)
        if (!existente || new Date(r.data_registro).getTime() > new Date(existente.data_registro).getTime()) {
          porPeriodo.set(r.periodo_referencia, r)
        }
      })

    const registrosDedupados = Array.from(porPeriodo.values())
      .sort((a, b) => a.periodo_referencia.localeCompare(b.periodo_referencia))

    // PASSO 1: Estado de Calibração (Cold Start / Falso Zero)
    if (registrosDedupados.length === 0) {
      return {
        roi: null,
        roiFormatado: '?,??x',
        fraseConcetual: 'Ponto de partida registrado com sucesso! Para revelarmos o seu Múltiplo de Crescimento, insira como está o faturamento da sua empresa hoje.',
        deltaAcumulado: 0,
        faturamentoBase: base,
        faturamentoAtual: null,
        valorPago,
        registros,
        status: 'aguardando_atual'
      }
    }

    // Calcular delta acumulado
    const deltaAcumulado = registrosDedupados.reduce(
      (soma, r) => soma + (r.valor - base), 0
    )

    // Calcular Múltiplo (ROAS / Delta)
    const multiplo = deltaAcumulado / valorPago

    const faturamentoAtual = registrosDedupados.length > 0
      ? registrosDedupados[registrosDedupados.length - 1].valor
      : base

    // Formatar Múltiplo
    const formatarMultiplicador = (n: number) => n.toFixed(2).replace('.', ',')

    let roiFormatado = `${formatarMultiplicador(multiplo)}x`

    // Frase contextual estratégica (C-Level)
    let fraseConcetual = ''
    if (multiplo > 1) {
      fraseConcetual = `Múltiplo validado: Para cada R$1 investido no Clube, sua empresa faturou R$${formatarMultiplicador(multiplo)} a mais.`
    } else if (multiplo === 1) {
      fraseConcetual = `Payback Atingido (Break-even): O faturamento extra gerado acabou de empatar com o valor investido.`
    } else if (multiplo > 0) {
      const porcentagemRecuperada = (multiplo * 100).toFixed(0)
      fraseConcetual = `Eficiência: Você já recuperou ${porcentagemRecuperada}% do valor investido na mentoria em novo faturamento.`
    } else if (deltaAcumulado === 0) {
      fraseConcetual = `Neste momento, você mantém o cenário neutro de entrada. Aplique as estratégias do Clube para escalar seus resultados.`
    } else {
      fraseConcetual = `Seu faturamento apresentou retração. O crescimento exige constância e realinhamento estratégico.`
    }

    return {
      roi: multiplo, 
      roiFormatado, fraseConcetual,
      deltaAcumulado, faturamentoBase: base,
      faturamentoAtual, valorPago, registros,
      status: multiplo < 0 ? 'negativo' : 'ok'
    }
  }

  // ─── Salvar novo registro ────────────────────────────────────────────────────
  async salvarRegistroFaturamento(
    socioId: string,
    valor:   number,
    tipo:    'onboarding' | 'trimestral' | 'manual',
    fonte:   'app' | 'admin' = 'app'
  ): Promise<RegistroFaturamento> {
    // Auto-heal: se for o primeiro registro do usuário, force como onboarding
    let tipoFinal = tipo;
    if (tipo !== 'onboarding') {
      const temBase = await this.temFaturamentoBase(socioId);
      if (!temBase) {
        tipoFinal = 'onboarding';
      }
    }

    // Gerar periodo_referencia automaticamente
    const now = new Date()
    const ano = now.getFullYear()
    const mes = now.getMonth() + 1
    const trimestre = Math.ceil(mes / 3)

    const periodoReferencia = tipoFinal === 'manual'
      ? `${ano}-${String(mes).padStart(2, '0')}`  // YYYY-MM
      : `${ano}-Q${trimestre}`                     // YYYY-QN

    const { data, error } = await supabase
      .from('registros_faturamento')
      .insert({
        socio_id:           socioId,
        valor,
        periodo_referencia: periodoReferencia,
        tipo:               tipoFinal,
        fonte,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ─── Verificar se sócio já registrou faturamento base ───────────────────────
  async temFaturamentoBase(socioId: string): Promise<boolean> {
    const { count } = await supabase
      .from('registros_faturamento')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId)
      .eq('tipo', 'onboarding')

    return (count ?? 0) > 0
  }
  // ─── Atualizar registro existente ─────────────────────────────────────────────
  async atualizarRegistroFaturamento(id: string, novoValor: number): Promise<void> {
    const { error } = await supabase
      .from('registros_faturamento')
      .update({ valor: novoValor })
      .eq('id', id)
    if (error) throw error
  }

  // ─── Deletar registro ────────────────────────────────────────────────────────
  async deletarRegistroFaturamento(id: string): Promise<void> {
    const { error } = await supabase
      .from('registros_faturamento')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const roiService = new RoiService();
