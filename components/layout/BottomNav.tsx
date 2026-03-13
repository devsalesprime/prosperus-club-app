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
        <>
            {/* ── CSS: hide on desktop + safe-area spacer ── */}
            {/* env() MUST be in a <style> tag — iOS ignores it in inline styles */}
            <style>{`
                @media (min-width: 768px) {
                    #prosperus-bottom-nav { display: none !important; }
                }
                .nav-safe-area-spacer {
                    height: env(safe-area-inset-bottom, 0px);
                    flex-shrink: 0;
                    background: ${BG};
                }
            `}</style>

            <nav
                id="prosperus-bottom-nav"
                style={{
                    flexShrink: 0,
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 50,
                    background: BG,
                    borderTop: `1px solid ${BORDER}`,
                }}
            >
                {/* ── Linha dos botões: 56px fixos ── */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    height: 56,
                    paddingLeft: 4,
                    paddingRight: 4,
                }}>
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
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                            >
                                <Icon
                                    size={24}
                                    color={color}
                                    strokeWidth={isActive ? 2.2 : 1.8}
                                />
                                <span style={{
                                    fontSize: 11,
                                    lineHeight: '14px',
                                    fontWeight: isActive ? 600 : 400,
                                    color: color,
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center',
                                }}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Safe area spacer: env(safe-area-inset-bottom) ── */}
                {/* iPhone com home indicator: ~34px. Android/iPhone SE: 0px */}
                <div className="nav-safe-area-spacer" />
            </nav>
        </>
    );
};