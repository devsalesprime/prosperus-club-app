import React from 'react';
import { ViewState } from '../../types';
import { useApp } from '../../contexts/AppContext';

import {
    IconHome,
    IconAgenda,
    IconProsperus,
    IconSocios,
    IconGaleria
} from '../ui/icons/CustomIcons';

// Constants Removed - Usando Design System Tokens via Tailwind

const bottomNavItems = [
    { id: ViewState.DASHBOARD, label: 'Início', Icon: IconHome },
    { id: ViewState.AGENDA, label: 'Agenda', Icon: IconAgenda },
    { id: 'prosperus-tools', label: 'Prosperus', Icon: IconProsperus, view: ViewState.PROSPERUS_TOOLS },
    { id: ViewState.MEMBERS, label: 'Sócios', Icon: IconSocios },
    { id: ViewState.GALLERY, label: 'Galeria', Icon: IconGaleria },
];

export const BottomNav: React.FC = () => {
    const { view, setView } = useApp();

    return (
        <>
            {/* CSS: esconder no desktop + safe-area padding para iOS */}
            <style>{`
                @media (min-width: 768px) {
                    #prosperus-bottom-nav { display: none !important; }
                }
                #prosperus-bottom-nav {
                    padding-bottom: max(env(safe-area-inset-bottom, 0px), 8px);
                }
            `}</style>

            <nav
                id="prosperus-bottom-nav"
                className="fixed bottom-0 left-0 right-0 z-50 bg-prosperus-navy border-t border-prosperus-border"
            >
                {/* Wrapper interno: 56px fixos para ícones + labels */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    height: 56,
                    width: '100%',
                    paddingLeft: 4,
                    paddingRight: 4,
                }}>
                    {bottomNavItems.map(item => {
                        const targetView = ('view' in item && item.view) ? item.view : item.id;
                        const isActive = view === targetView;
                        const textColorClass = isActive ? 'text-prosperus-gold' : 'text-prosperus-grey';
                        const textWeightClass = isActive ? 'font-semibold' : 'font-normal';
                        const strokeWidth = isActive ? 2.2 : 1.8;
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
                                className={`flex-1 flex flex-col items-center justify-center gap-[2px] cursor-pointer select-none ${textColorClass}`}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                <Icon
                                    size={24}
                                    className={textColorClass}
                                />
                                <span className={`text-[11px] leading-[14px] whitespace-nowrap text-center ${textWeightClass}`}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};