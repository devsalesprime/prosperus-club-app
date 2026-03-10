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
            <style>{`
                @media (min-width: 768px) {
                    #prosperus-bottom-nav { display: none !important; }
                }
            `}</style>

            <nav
                id="prosperus-bottom-nav"
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    width: '100%',
                    flexShrink: 0,
                    paddingTop: 4,
                    paddingBottom: 2,
                    background: BG,
                    borderTop: `1px solid ${BORDER}`,
                    position: 'relative',
                    zIndex: 50,
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
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                padding: '2px 0',
                                cursor: 'pointer',
                                userSelect: 'none',
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
                                lineHeight: '12px',
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
            </nav>
        </>
    );
};