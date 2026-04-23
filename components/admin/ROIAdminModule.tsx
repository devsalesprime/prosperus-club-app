// components/admin/ROIAdminModule.tsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { notificationTriggers } from '../../services/notificationTriggers';
import { AdminPageHeader, AdminLoadingState, AdminTable, AdminActionButton, AdminModal } from './shared';
import DeleteConfirmSheet from '../ui/DeleteConfirmSheet';
import { roiService } from '../../services/roiService';
import { RefreshCw, Bell, Edit, Check, Trash2, Search, X, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface RoiSocio {
    socio_id: string;
    name: string;
    valor_pago_mentoria: number | null;
    faturamento_base: number | null;
    faturamento_atual: number | null;
    roi: number | null;
    delta_acumulado: number | null;
    ultima_atualizacao: string | null;
    is_roi_approved: boolean; // NOVO: Flag de aprovação
}

const maskBRL = (value: string | number) => {
    let v = typeof value === 'number' ? value.toFixed(2).replace('.', '') : value.replace(/\D/g, '');
    if (!v) return '';
    const num = (parseInt(v, 10) / 100).toFixed(2);
    return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseBRL = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, '').replace(',', '.'));
};

interface RegistroFaturamento {
    id: string;
    socio_id: string;
    valor: number;
    periodo_referencia: string;
    tipo: string;
    data_registro: string;
}

const HistoricoInput = ({ registro, onSave }: { registro: RegistroFaturamento, onSave: (id: string, val: number) => void }) => {
    const [val, setVal] = useState(maskBRL(registro.valor));
    return (
        <input 
            type="text"
            inputMode="numeric"
            value={val}
            onChange={(e) => setVal(maskBRL(e.target.value))}
            onBlur={() => {
                const parsed = parseBRL(val);
                if (parsed > 0 && parsed !== registro.valor) {
                    onSave(registro.id, parsed);
                }
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-emerald-400 font-bold tracking-wider focus:border-emerald-500 focus:outline-none transition-colors"
        />
    );
};

export const ROIAdminModule: React.FC = () => {
    const [socios, setSocios] = useState<RoiSocio[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingPush, setSendingPush] = useState(false);
    const [showCobrancaModal, setShowCobrancaModal] = useState(false);
    const [cobrancaTarget, setCobrancaTarget]       = useState<'all' | string>('all');
    const [cobrancaLoading, setCobrancaLoading]     = useState(false);
    const [cobrancaFeedback, setCobrancaFeedback]   = useState<'success' | 'error' | null>(null);
    
    // Filters and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    
    // Modal Edit
    const [editingSocio, setEditingSocio] = useState<RoiSocio | null>(null);
    const [valorPagoStr, setValorPagoStr] = useState('');
    const [historicoRegistros, setHistoricoRegistros] = useState<RegistroFaturamento[]>([]);
    const [registroToDelete, setRegistroToDelete] = useState<string | null>(null);

    const loadSocios = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('v_roi_socios')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            setSocios(data || []);
        } catch (err) {
            console.error('Erro ao carregar ROIs:', err);
            toast.error('Gatilho falhou ao carregar a view.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSocios(); }, []);

    const handleCobrarAtualizacao = (target: 'all' | string = 'all') => {
        setCobrancaTarget(target);
        setCobrancaFeedback(null);
        setShowCobrancaModal(true);
    };

    const handleConfirmarCobranca = async () => {
        setCobrancaLoading(true);
        try {
            if (cobrancaTarget === 'all') {
                await notificationTriggers.notifyColetaFaturamento();
            } else {
                await notificationTriggers.notifyColetaFaturamento(cobrancaTarget);
            }
            setCobrancaFeedback('success');
            setTimeout(() => {
                setShowCobrancaModal(false);
                setCobrancaFeedback(null);
                loadSocios();
            }, 2000);
        } catch (err) {
            console.error('[ROI Admin] erro ao cobrar:', err);
            setCobrancaFeedback('error');
        } finally {
            setCobrancaLoading(false);
        }
    };

    const handleOpenEdit = async (socio: RoiSocio) => {
        setEditingSocio(socio);
        setValorPagoStr(socio.valor_pago_mentoria ? maskBRL(socio.valor_pago_mentoria) : '');
        setHistoricoRegistros([]); // limpa estado logo ao abrir
        try {
            const { data, error } = await supabase
                .from('registros_faturamento')
                .select('*')
                .eq('socio_id', socio.socio_id)
                .order('data_registro', { ascending: false });
            if (error) throw error;
            setHistoricoRegistros(data || []);
        } catch (e) {
            toast.error('Erro ao carregar histórico de faturamentos');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingSocio) return;
        const numM = parseBRL(valorPagoStr);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    valor_pago_mentoria: isNaN(numM) ? null : numM,
                    is_roi_approved: true // Força a aprovação
                })
                .eq('id', editingSocio.socio_id);
            if (error) throw error;
            toast.success('Valor investido atualizado e aprovado com sucesso.');
            setEditingSocio(null);
            loadSocios();
        } catch (err) {
            toast.error('Falha ao salvar valor investido.');
        }
    };

    const handleFastApprove = async (socio: RoiSocio) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_roi_approved: true })
                .eq('id', socio.socio_id);
            if (error) throw error;
            toast.success('Sócio Aprovado com sucesso! Visível agora no painel dele.');
            loadSocios();
        } catch (err) {
            toast.error('Falha ao aprovar.');
        }
    };

    const handleUpdateRegistro = async (id: string, val: number) => {
        if (isNaN(val) || val <= 0) return toast.error('Valor numérico inválido');
        try {
            await roiService.atualizarRegistroFaturamento(id, val);
            toast.success('Linha de faturamento alterada com sucesso!');
            loadSocios();
            setHistoricoRegistros(prev => prev.map(r => r.id === id ? { ...r, valor: val } : r));
        } catch {
            toast.error('Erro ao editar histórico');
        }
    };

    const confirmDeleteRegistro = (id: string) => {
        setRegistroToDelete(id);
    };

    const execDeleteRegistro = async () => {
        if (!registroToDelete) return;
        try {
            await roiService.deletarRegistroFaturamento(registroToDelete);
            toast.success('Dado deletado com sucesso.');
            loadSocios();
            setHistoricoRegistros(prev => prev.filter(r => r.id !== registroToDelete));
        } catch {
            toast.error('Erro ao deletar histórico');
        } finally {
            setRegistroToDelete(null);
        }
    };

    const formatBRL = (val: number | null) => {
        if (val === null || val === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, pageSize]);

    const filteredSocios = socios.filter((s) => {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = !term || s.name.toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'ALL' 
            ? true 
            : statusFilter === 'APPROVED' 
                ? s.is_roi_approved 
                : !s.is_roi_approved;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredSocios.length / pageSize));
    const displaySocios = filteredSocios.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    if (loading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Crescimento (ROI)" subtitle="Auditoria do delta de faturamento do Clube" />
                <AdminLoadingState message="Carregando estatísticas (v_roi_socios)..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Crescimento (ROI)"
                subtitle="Auditoria do delta de faturamento"
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleCobrarAtualizacao('all')}
                            disabled={cobrancaLoading}
                            className="flex items-center gap-2 text-sm text-yellow-900 bg-yellow-500 hover:bg-yellow-400 px-4 py-2 font-bold rounded-lg transition"
                        >
                            <Bell size={16} />
                            {cobrancaLoading ? 'Notificando...' : 'Cobrar Atualização (Push)'}
                        </button>
                        <button
                            onClick={loadSocios}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 px-3 py-2 rounded-lg transition"
                        >
                            <RefreshCw size={16} />
                            Recarregar
                        </button>
                    </div>
                }
            />

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar sócio por nome..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-600/50 focus:ring-1 focus:ring-emerald-600/20 transition"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-500 hidden md:block" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'APPROVED' | 'PENDING')}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-600/50 transition w-full md:w-auto min-w-[140px]"
                    >
                        <option value="ALL">Status: Todos</option>
                        <option value="APPROVED">✅ Aprovados</option>
                        <option value="PENDING">⏳ Pendentes</option>
                    </select>
                </div>
            </div>

            <AdminTable>
                <table className="w-full min-w-[800px] text-left text-sm text-slate-400 whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Sócio</th>
                            <th className="px-6 py-4" title="Sincronizado via HubSpot Deal Amount">Investido (HubSpot)</th>
                            <th className="px-6 py-4">Faturamento Base</th>
                            <th className="px-6 py-4">Faturamento Atual</th>
                            <th className="px-6 py-4">Delta Crescimento</th>
                            <th className="px-6 py-4">Múltiplo (x)</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {displaySocios.map((s) => (
                            <tr key={s.socio_id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-white">{s.name}</td>
                                <td className="px-6 py-4">{formatBRL(s.valor_pago_mentoria)}</td>
                                <td className="px-6 py-4">{formatBRL(s.faturamento_base)}</td>
                                <td className="px-6 py-4 text-emerald-400">{formatBRL(s.faturamento_atual)}</td>
                                <td className="px-6 py-4">{formatBRL(s.delta_acumulado)}</td>
                                <td className="px-6 py-4">
                                    {s.roi !== null ? (
                                        <span className={`px-2 py-1 rounded inline-block font-bold ${s.roi >= 1 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-500'}`}>
                                            {s.roi.toFixed(2)}x
                                        </span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {!s.is_roi_approved ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleCobrarAtualizacao(s.socio_id)}
                                                className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500 font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-lg border border-yellow-600/30 uppercase tracking-wider"
                                                title="Enviar Push lembrete para este sócio"
                                            >
                                                Puxar
                                            </button>
                                            <button
                                                onClick={() => handleFastApprove(s)}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition shadow-lg shadow-emerald-900/20 uppercase tracking-wider"
                                                title="Aprovar com o valor atual"
                                            >
                                                Aprovar
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(s)}
                                                className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg transition"
                                                title="Revisar ou editar valor manualmente"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-3">
                                            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 bg-emerald-900/30 px-2 py-1 rounded">
                                                <Check size={14} /> APROVADO
                                            </span>
                                            <button
                                                onClick={() => handleOpenEdit(s)}
                                                className="text-slate-500 hover:text-white p-1 rounded transition"
                                                title="Editar Valor"
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {displaySocios.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-600">
                                    Nenhum membro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </AdminTable>

            {/* Pagination UI */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Mostrar</span>
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-600/50 transition"
                        >
                            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-xs text-slate-500">
                            Página {currentPage} de {totalPages} ({filteredSocios.length} total)
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm text-slate-400 px-3">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Edição */}
            {editingSocio && (
                <AdminModal title="Ajuste Administrativo" onClose={() => setEditingSocio(null)}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400">
                            Essa quantia reflete a propriedade <strong className="text-blue-400">Amount</strong> sincronizada pelo HubSpot. Modificar aqui forçará uma sobreposição manual e ditará o "Múltiplo de Crescimento" final exibido ao Sócio.
                        </p>
                        <div className="space-y-2">
                            <label className="text-slate-200 text-sm font-bold flex items-center gap-2">
                                Investimento Base (Custo da Mentoria)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-2 text-slate-500 font-bold">R$</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white font-bold tracking-wide focus:border-yellow-500 focus:outline-none transition-colors"
                                    placeholder="0,00"
                                    value={valorPagoStr}
                                    onChange={e => setValorPagoStr(maskBRL(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Histórico Editor */}
                        <div className="pt-6 mt-6 border-t border-slate-800">
                            <label className="text-slate-200 text-sm font-bold mb-3 block">Linha do Tempo (Faturamentos Inseridos)</label>
                            <p className="text-xs text-slate-400 mb-3">Edite os números e clique fora da caixinha para salvar. Ou clique na lixeira para excluir o registro por completo.</p>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {historicoRegistros.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 bg-slate-900 border border-slate-700/50 p-3 rounded-xl transition-all hover:border-slate-600">
                                        <div className="flex-1">
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                {r.periodo_referencia} <span className="text-slate-500 normal-case ml-1 font-bold">({r.tipo})</span>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-sm">R$</span>
                                                <HistoricoInput registro={r} onSave={handleUpdateRegistro} />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-[10px] text-slate-500 font-mono tracking-wider">{new Date(r.data_registro).toLocaleDateString('pt-BR')}</div>
                                            <button 
                                                onClick={() => confirmDeleteRegistro(r.id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-950/50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-900"
                                                title="Apagar permanentemente"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {historicoRegistros.length === 0 && (
                                    <p className="text-sm text-slate-500 text-center py-4 bg-slate-900 rounded-lg border border-dashed border-slate-700">Nenhum registro encontrado ainda.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-800">
                            <button
                                onClick={handleSaveEdit}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg transition"
                                disabled={!valorPagoStr}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </AdminModal>
            )}

            {/* Modal de Cobrança de Atualização */}
            {showCobrancaModal && (
                <div style={{
                    position:   'fixed',
                    inset:      0,
                    zIndex:     200,
                    background: 'rgba(0,0,0,0.65)',
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding:    '20px',
                }}>
                    <div style={{
                        background:   '#031726',
                        border:       '1px solid #052B48',
                        borderRadius: 20,
                        padding:      '28px 24px',
                        width:        '100%',
                        maxWidth:     400,
                        boxShadow:    '0 20px 60px rgba(0,0,0,0.5)',
                    }}>

                        {/* Ícone + título */}
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'linear-gradient(135deg, #042034, #04253E)',
                                border: '1px solid #052B48',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 14px', fontSize: 24,
                            }}>
                                📲
                            </div>
                            <p style={{ fontSize: 18, fontWeight: 700, color: '#FCF7F0', margin: '0 0 8px' }}>
                                Cobrar Atualização
                            </p>
                            <p style={{ fontSize: 14, color: '#95A4B4', margin: 0, lineHeight: 1.6 }}>
                                {cobrancaTarget === 'all'
                                    ? 'Enviar notificação push para todos os sócios que ainda não atualizaram o faturamento neste trimestre.'
                                    : 'Enviar notificação push para este sócio pedindo atualização do faturamento.'
                                }
                            </p>
                        </div>

                        {/* Feedback de sucesso */}
                        {cobrancaFeedback === 'success' && (
                            <div style={{
                                background: 'rgba(34,197,94,0.12)',
                                border: '1px solid rgba(34,197,94,0.3)',
                                borderRadius: 10, padding: '12px 16px',
                                textAlign: 'center', marginBottom: 16,
                            }}>
                                <p style={{ fontSize: 14, color: '#22C55E', fontWeight: 600, margin: 0 }}>
                                    ✅ Push enviado com sucesso!
                                </p>
                            </div>
                        )}

                        {/* Feedback de erro */}
                        {cobrancaFeedback === 'error' && (
                            <div style={{
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10, padding: '12px 16px',
                                textAlign: 'center', marginBottom: 16,
                            }}>
                                <p style={{ fontSize: 14, color: '#EF4444', fontWeight: 600, margin: 0 }}>
                                    ❌ Erro ao enviar. Tente novamente.
                                </p>
                            </div>
                        )}

                        {/* Botões */}
                        {!cobrancaFeedback && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <button
                                    onClick={handleConfirmarCobranca}
                                    disabled={cobrancaLoading}
                                    style={{
                                        padding: '14px', borderRadius: 12, border: 'none',
                                        background: cobrancaLoading
                                            ? '#052B48'
                                            : 'linear-gradient(135deg, #FFDA71, #CA9A43)',
                                        color: '#031A2B', fontSize: 15, fontWeight: 700,
                                        cursor: cobrancaLoading ? 'not-allowed' : 'pointer',
                                        opacity: cobrancaLoading ? 0.7 : 1,
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    {cobrancaLoading ? 'Enviando...' : '📲 Confirmar e Enviar Push'}
                                </button>
                                <button
                                    onClick={() => setShowCobrancaModal(false)}
                                    disabled={cobrancaLoading}
                                    style={{
                                        padding: '12px', borderRadius: 12,
                                        background: 'none',
                                        border: '1px solid #052B48',
                                        color: '#95A4B4', fontSize: 14, fontWeight: 500,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <DeleteConfirmSheet
                isOpen={!!registroToDelete}
                title="Excluir Faturamento"
                message="Tem certeza que deseja apagar este dado financeiro? O cálculo de ROI deste sócio será ajustado instantaneamente."
                confirmLabel="Sim, Excluir Dado"
                onConfirm={execDeleteRegistro}
                onCancel={() => setRegistroToDelete(null)}
            />
        </div>
    );
};

export default ROIAdminModule;
