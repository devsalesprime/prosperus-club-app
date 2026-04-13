// ============================================
// PROGRESS FILE HELPERS — Shared utility functions for file icons & badges
// Extracted from AdminMemberProgress.tsx (Operação Estilhaço)
// Pure functions — no side effects
// ============================================

import React from 'react';
import { FileText, FileCode, FileSpreadsheet, File } from 'lucide-react';

export const getFileIcon = (fileType: string): React.ReactNode => {
    const type = fileType.toLowerCase();
    if (type === 'html' || type === 'htm') return <FileCode size={20} className="text-orange-400" />;
    if (type === 'pdf') return <FileText size={20} className="text-red-400" />;
    if (['xlsx', 'xls', 'csv', 'excel'].includes(type)) return <FileSpreadsheet size={20} className="text-green-400" />;
    if (['doc', 'docx'].includes(type)) return <FileText size={20} className="text-blue-400" />;
    return <File size={20} className="text-slate-400" />;
};

export const getFileTypeBadge = (fileType: string): React.ReactNode => {
    const type = fileType.toUpperCase();
    const colorMap: Record<string, string> = {
        'HTML': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
        'HTM': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
        'PDF': 'bg-red-900/30 text-red-400 border-red-800/50',
        'XLSX': 'bg-green-900/30 text-green-400 border-green-800/50',
        'XLS': 'bg-green-900/30 text-green-400 border-green-800/50',
        'DOC': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
        'DOCX': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
    };
    const color = colorMap[type] || 'bg-slate-700 text-slate-300 border-slate-600';
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${color}`}>
            {type}
        </span>
    );
};
