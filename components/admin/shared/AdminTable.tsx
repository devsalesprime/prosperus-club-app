// ============================================
// ADMIN TABLE - Shared Component (v2)
// ============================================
// Wrapper padronizado para tabelas do Admin
// Mobile: renderiza cards empilháveis via renderMobileCard
// Desktop: tabela padrão com overflow-x-auto

import React from 'react';

interface Column<T> {
    key: string;
    label: string;
    /** Optional: hide this column on mobile card (still visible in table) */
    hideOnMobile?: boolean;
    /** Custom renderer for the table cell */
    render?: (item: T) => React.ReactNode;
}

interface AdminTableProps<T = Record<string, unknown>> {
    children?: React.ReactNode;
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
    /** Structured data for responsive rendering */
    columns?: Column<T>[];
    data?: T[];
    /** Unique key extractor */
    keyExtractor?: (item: T) => string;
    /** Custom mobile card renderer (overrides default card) */
    renderMobileCard?: (item: T, index: number) => React.ReactNode;
    /** Actions column renderer */
    renderActions?: (item: T) => React.ReactNode;
    /** Empty state message */
    emptyMessage?: string;
}

export const AdminTable = <T extends Record<string, unknown>>({
    children,
    title,
    subtitle,
    headerAction,
    columns,
    data,
    keyExtractor,
    renderMobileCard,
    renderActions,
    emptyMessage = 'Nenhum item encontrado',
}: AdminTableProps<T>) => {
    const isStructured = columns && data;

    return (
        <div className="bg-prosperus-bg-box/50 rounded-xl border border-prosperus-stroke overflow-hidden">
            {/* Optional header row */}
            {(title || headerAction) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-prosperus-stroke">
                    <div>
                        {title && (
                            <h3 className="text-sm font-semibold text-prosperus-text">{title}</h3>
                        )}
                        {subtitle && (
                            <p className="font-sans text-xs text-prosperus-text-off mt-0.5">{subtitle}</p>
                        )}
                    </div>
                    {headerAction && (
                        <div className="flex-shrink-0">{headerAction}</div>
                    )}
                </div>
            )}

            {/* ─── Structured Mode: columns + data ─── */}
            {isStructured ? (
                <>
                    {data.length === 0 ? (
                        <div className="font-sans px-5 py-12 text-center text-sm text-prosperus-text-off">
                            {emptyMessage}
                        </div>
                    ) : (
                        <>
                            {/* Desktop: standard table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="font-sans w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-prosperus-stroke">
                                            {columns.map(col => (
                                                <th
                                                    key={col.key}
                                                    className="px-5 py-3 text-left text-xs font-medium text-prosperus-text-off uppercase tracking-wider"
                                                >
                                                    {col.label}
                                                </th>
                                            ))}
                                            {renderActions && (
                                                <th className="px-5 py-3 text-right text-xs font-medium text-prosperus-text-off uppercase tracking-wider">
                                                    Ações
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-prosperus-stroke/50">
                                        {data.map((item, idx) => (
                                            <tr
                                                key={keyExtractor ? keyExtractor(item) : idx}
                                                className="hover:bg-prosperus-stroke/30 transition-colors"
                                            >
                                                {columns.map(col => (
                                                    <td key={col.key} className="px-5 py-3.5 text-prosperus-text whitespace-nowrap">
                                                        {col.render ? col.render(item) : String(item[col.key] ?? '')}
                                                    </td>
                                                ))}
                                                {renderActions && (
                                                    <td className="px-5 py-3.5 text-right">
                                                        {renderActions(item)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile: stacked cards */}
                            <div className="font-sans md:hidden divide-y divide-prosperus-stroke/50">
                                {data.map((item, idx) => (
                                    <div key={keyExtractor ? keyExtractor(item) : idx}>
                                        {renderMobileCard ? (
                                            renderMobileCard(item, idx)
                                        ) : (
                                            /* Default card: label-value pairs */
                                            <div className="px-4 py-3.5 space-y-2">
                                                {columns
                                                    .filter(col => !col.hideOnMobile)
                                                    .map(col => (
                                                        <div key={col.key} className="flex items-start justify-between gap-3">
                                                            <span className="text-xs text-prosperus-text-off font-medium shrink-0">
                                                                {col.label}
                                                            </span>
                                                            <span className="text-sm text-prosperus-text text-right">
                                                                {col.render ? col.render(item) : String(item[col.key] ?? '—')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                {renderActions && (
                                                    <div className="flex justify-end pt-2 border-t border-prosperus-stroke/30">
                                                        {renderActions(item)}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            ) : (
                /* ─── Legacy Mode: children pass-through ─── */
                <div className="overflow-x-auto">
                    {children}
                </div>
            )}
        </div>
    );
};
