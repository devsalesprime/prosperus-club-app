import React from 'react';
import { Edit, Trash2, X, Check, Clock, MapPin, Video as VideoIcon, Link as LinkIcon } from 'lucide-react';

export interface DataTableProps<T extends { id: string }> {
  columns: string[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (id: string) => void;
}

export function DataTable<T extends { id: string }>({ columns, data, onEdit, onDelete }: DataTableProps<T>) {
  const keyMap: { [key: string]: string } = {
    'título': 'title',
    'categoria': 'categoryName',
    'slug': 'slug',
    'nome': 'name',
    'duração': 'duration',
    'autor': 'author',
    'data': 'date',
    'status': 'status',
    'empresa': 'company',
    'role': 'role',
    'local': 'location',
    'tipo': 'type',
    'mensagem': 'message',
    'alvo': 'segment',
    'agendado': 'scheduledFor',
    'enviado em': 'sentAt'
  };

  // Semantic colors (emerald/purple/orange/amber/red) preservadas para status/categoria —
  // convenção UX universal. Apenas cores neutras (slate/yellow/white) viram tokens brand.
  return (
    <div className="bg-prosperus-bg-box rounded-xl border border-prosperus-stroke overflow-hidden">
      <div className="overflow-x-auto">
        <table className="font-sans w-full text-left text-sm text-prosperus-text-off whitespace-nowrap">
          <thead className="bg-prosperus-bg-primary text-prosperus-text uppercase font-medium">
            <tr>
              {columns.map((col: string, idx: number) => (
                <th key={idx} className="px-6 py-4">{col}</th>
              ))}
              {(onEdit || onDelete) && <th className="px-6 py-4 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-prosperus-stroke">
            {data.map((row) => {
              const r = row as Record<string, unknown>;
              return (
                <tr key={row.id} className="hover:bg-prosperus-stroke/50 transition-colors">
                  {columns.map((col: string, idx: number) => {
                    const headerLower = col.toLowerCase();
                    const key = keyMap[headerLower] || headerLower;
                    let val = r[key];

                    if (col === 'Data' && val) val = new Date(val as string | number | Date).toLocaleDateString();
                    if (col === 'Título' || col === 'Nome') val = <span className="font-medium text-prosperus-text">{val as React.ReactNode}</span>;
                    if (col === 'Categoria' && !val && r.category) val = r.category;

                    if (key === 'status' && r.segment) {
                      val = val === 'SENT' ? <span className="text-emerald-400 flex items-center gap-1"><Check size={12} /> Enviado</span> :
                        val === 'SCHEDULED' ? <span className="text-amber-400 flex items-center gap-1"><Clock size={12} /> Agendado</span> :
                          <span className="text-red-400">Falha</span>;
                    }

                    if (col === 'Categoria' && !r.segment) {
                      val = val === 'PRESENTIAL' ? <span className="text-purple-400 flex items-center gap-1"><MapPin size={12} /> Presencial</span> :
                        val === 'ONLINE' ? <span className="text-emerald-400 flex items-center gap-1"><VideoIcon size={12} /> Online</span> :
                        val === 'RECORDED' ? <span className="text-orange-400 flex items-center gap-1"><LinkIcon size={12} /> Gravada</span> :
                            <span className="text-prosperus-text bg-prosperus-bg-box px-2 py-0.5 rounded-full text-xs border border-prosperus-stroke">{val as React.ReactNode}</span>;
                    }

                    return <td key={idx} className="px-6 py-4">{(val as React.ReactNode) || '-'}</td>
                  })}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-right space-x-2">
                      {onEdit && <button onClick={() => onEdit(row)} className="text-prosperus-ouro-vivo hover:text-prosperus-ouro-claro p-1 inline-block"><Edit size={16} /></button>}
                      {onDelete && <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-300 p-1 inline-block"><Trash2 size={16} /></button>}
                    </td>
                  )}
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-8 text-center text-prosperus-text-off">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ title, onClose, children }: ModalProps) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-prosperus-preto-absoluto/80 backdrop-blur-sm p-4">
    <div className="bg-prosperus-bg-box rounded-xl border border-prosperus-stroke w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-prosperus-stroke">
        <h3 className="text-xl font-bold text-prosperus-text">{title}</h3>
        <button onClick={onClose} className="text-prosperus-text-off hover:text-prosperus-text"><X size={24} /></button>
      </div>
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
);

export interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
  error?: string;
  disabled?: boolean;
  min?: string | number;
}

export const FormInput = React.forwardRef<HTMLElement, FormInputProps>(({ label, value, onChange, type = "text", placeholder, textarea = false, error, disabled = false, min }, ref) => (
  <div className="font-sans space-y-1.5">
    <label className="text-xs font-semibold text-prosperus-text-off uppercase tracking-wider">{label}</label>
    {textarea ? (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className={`w-full bg-prosperus-bg-primary border rounded-lg p-3 text-prosperus-text outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-prosperus-stroke focus:ring-2 focus:ring-prosperus-ouro-vivo/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    ) : (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        className={`w-full bg-prosperus-bg-primary border rounded-lg p-3 text-prosperus-text outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-prosperus-stroke focus:ring-2 focus:ring-prosperus-ouro-vivo/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    )}
    {error && <span className="text-xs text-red-400">{error}</span>}
  </div>
));

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => (
  <div className="font-sans space-y-1.5">
    <label className="text-xs font-semibold text-prosperus-text-off uppercase tracking-wider">Conteúdo (HTML)</label>
    <div className="bg-prosperus-bg-primary border border-prosperus-stroke rounded-lg overflow-hidden">
      <div className="bg-prosperus-bg-box p-2 border-b border-prosperus-stroke flex gap-2 flex-wrap">
        <span className="text-xs text-prosperus-text-off px-2 py-1">Editor Simples (HTML)</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent p-4 text-prosperus-text outline-none min-h-[200px] font-mono text-sm"
        placeholder="Use tags HTML como <p>, <strong>, <h3>..."
      />
    </div>
  </div>
);
