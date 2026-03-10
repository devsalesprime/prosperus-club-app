// BottomNav — Mobile Bottom Navigation
// Uses <div role="button"> instead of <button> to avoid
// iOS Safari's implicit overflow:clip on button elements
// that clips labels below icons.

import React from 'react';
import {
    LayoutDashboard,
    Calendar as CalendarIcon,
    Briefcase,
    Users,
    Image as ImageIcon
} from 'lucide-react';
import { ViewState } from '../../types';
import { useApp } from '../../contexts/AppContext';

const GOLD = '#FFDA71';
const GREY = '#8A9BB0';
const BG = '#031A2B';
const BORDER = '#123F5B';

const bottomNavItems = [
    { id: ViewState.DASHBOARD, label: 'Início', Icon: LayoutDashboard },
    { id: ViewState.AGENDA, label: 'Agenda', Icon: CalendarIcon },
    { id: 'prosperus-tools', label: 'Prosperus', Icon: Briefcase, view: ViewState.PROSPERUS_TOOLS },
    { id: ViewState.MEMBERS, label: 'Sócios', Icon: Users },
    { id: ViewState.GALLERY, label: 'Galeria', Icon: ImageIcon },
];

export const BottomNav: React.FC = () => {
    const { view, setView } = useApp();

    return (
        <nav
            className="md:hidden"
            style={{
                paddingTop: 8,
                paddingBottom: 8,
                minHeight: 60,
                flexShrink: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'row' as const,
                alignItems: 'center',
                justifyContent: 'space-around',
                position: 'relative' as const,
                zIndex: 50,
                overflow: 'visible',
                background: BG,
                borderTop: `1px solid ${BORDER}`,
            }}
        >
            {bottomNavItems.map(item => {
                const targetView = ('view' in item && item.view) ? item.view : item.id;
                const isActive = view === targetView;
                const color = isActive ? GOLD : GREY;
                const { Icon } = item;

                return (
                    // div role="button" instead of <button>
                    // iOS Safari clips overflow on <button> elements
                    <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setView(targetView as ViewState)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setView(targetView as ViewState);
                            }
                        }}
                        data-tour-id={
                            item.id === 'prosperus-tools'
                                ? 'prosperus-tools'
                                : item.id.toLowerCase()
                        }
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column' as const,
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            padding: '4px 0',
                            cursor: 'pointer',
                            overflow: 'visible',
                            WebkitTapHighlightColor: 'transparent',
                            outline: 'none',
                            userSelect: 'none',
                        }}
                    >
                        <Icon
                            size={20}
                            color={color}
                            strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        <span style={{
                            fontSize: 10,
                            lineHeight: '14px',
                            fontWeight: isActive ? 600 : 400,
                            color: color,
                            whiteSpace: 'nowrap',
                            display: 'block',
                            overflow: 'visible',
                            textAlign: 'center' as const,
                        }}>
                            {item.label}
                        </span>
                    </div>
                );
            })}
        </nav>
    );
};