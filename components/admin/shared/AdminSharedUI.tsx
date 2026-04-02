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

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400 whitespace-nowrap">
          <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
            <tr>
              {columns.map((col: string, idx: number) => (
                <th key={idx} className="px-6 py-4">{col}</th>
              ))}
              {(onEdit || onDelete) && <th className="px-6 py-4 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row) => {
              const r = row as Record<string, any>;
              return (
                <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                  {columns.map((col: string, idx: number) => {
                    const headerLower = col.toLowerCase();
                    const key = keyMap[headerLower] || headerLower;
                    let val = r[key];

                    if (col === 'Data' && val) val = new Date(val).toLocaleDateString();
                    if (col === 'Título' || col === 'Nome') val = <span className="font-medium text-white">{val}</span>;
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
                            <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full text-xs border border-slate-700">{val}</span>;
                    }

                    return <td key={idx} className="px-6 py-4">{val || '-'}</td>
                  })}
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-right space-x-2">
                      {onEdit && <button onClick={() => onEdit(row)} className="text-blue-400 hover:text-blue-300 p-1 inline-block"><Edit size={16} /></button>}
                      {onDelete && <button onClick={() => onDelete(row.id)} className="text-red-400 hover:text-red-300 p-1 inline-block"><Trash2 size={16} /></button>}
                    </td>
                  )}
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-6 py-8 text-center text-slate-600">
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
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className="bg-slate-900 rounded-xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center p-6 border-b border-slate-800">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24} /></button>
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
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
    {textarea ? (
      <textarea
        ref={ref as React.Ref<HTMLTextAreaElement>}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className={`w-full bg-slate-950 border rounded-lg p-3 text-slate-200 outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-2 focus:ring-yellow-600/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        className={`w-full bg-slate-950 border rounded-lg p-3 text-slate-200 outline-none transition ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-800 focus:ring-2 focus:ring-yellow-600/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
    )}
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
));

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conteúdo (HTML)</label>
    <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      <div className="bg-slate-900 p-2 border-b border-slate-800 flex gap-2 flex-wrap">
        <span className="text-xs text-slate-500 px-2 py-1">Editor Simples (HTML)</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent p-4 text-slate-200 outline-none min-h-[200px] font-mono text-sm"
        placeholder="Use tags HTML como <p>, <strong>, <h3>..."
      />
    </div>
  </div>
);
