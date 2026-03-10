// BottomNav — Mobile Bottom Navigation
// Uses .bottom-nav-ios class from index.html for safe-area padding
// (CSS env() must be in stylesheet, not inline styles for iOS)

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
            // md:hidden hides on desktop
            // bottom-nav-ios: padding-bottom with env(safe-area-inset-bottom) from index.html CSS
            className="md:hidden bottom-nav-ios"
            style={{
                flexShrink: 0,
                width: '100%',
                display: 'flex',
                flexDirection: 'row' as const,
                alignItems: 'center',
                justifyContent: 'space-around',
                position: 'relative' as const,
                zIndex: 50,
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
                            userSelect: 'none' as const,
                            WebkitTapHighlightColor: 'transparent',
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
                            whiteSpace: 'nowrap' as const,
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