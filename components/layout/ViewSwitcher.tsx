// ============================================
// VIEW SWITCHER — Route View Rendering
// ============================================
// Extracted from App.tsx L1071-1550 (the switch(view) block)
// All heavy components use React.lazy() for code splitting.

import React, { Suspense } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { Calendar, Views, View, Navigate } from 'react-big-calendar';
import { localizer } from '../../utils/calendarUtils.tsx';
import {
    CalendarIcon,
    ChevronRight,
    ChevronLeft,
    List,
} from 'lucide-react';
import { IconAgenda } from '../ui/icons/CustomIcons';
import { ViewState, ClubEvent as Event } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { profileService } from '../../services/profileService';
import useAnalytics from '../../hooks/useAnalytics';

// --- Lazy Imports (Code Splitting) ---
const NewsList = React.lazy(() => import('../academy/NewsList').then(m => ({ default: m.NewsList })));
const ArticleReader = React.lazy(() => import('../academy/ArticleReader').then(m => ({ default: m.ArticleReader })));
const ProfilePreview = React.lazy(() => import('../ProfilePreview').then(m => ({ default: m.ProfilePreview })));
const DashboardHome = React.lazy(() => import('../dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const MemberBook = React.lazy(() => import('../MemberBook').then(m => ({ default: m.MemberBook })));
const MobileAgendaView = React.lazy(() => import('../events/MobileAgendaView').then(m => ({ default: m.MobileAgendaView })));
const YearlyAgendaView = React.lazy(() => import('../events/YearlyAgendaView').then(m => ({ default: m.YearlyAgendaView })));
const EventDetailsModal = React.lazy(() => import('../events/EventDetailsModal').then(m => ({ default: m.EventDetailsModal })));
const ProfileSection = React.lazy(() => import('../ProfileSection').then(m => ({ default: m.default })));

// --- Lazy Imports (Code Splitting) ---
const Academy = React.lazy(() => import('../academy/Academy.tsx').then(m => ({ default: m.Academy })));
const ProsperusToolsPage = React.lazy(() => import('../../pages/ProsperusToolsPage').then(m => ({ default: m.ProsperusToolsPage })));
const SolutionsListPage = React.lazy(() => import('../../pages/SolutionsListPage').then(m => ({ default: m.SolutionsListPage })));
const ProgressListPage = React.lazy(() => import('../../pages/ProgressListPage').then(m => ({ default: m.ProgressListPage })));
const MessagesView = React.lazy(() => import('../chat/MessagesView').then(m => ({ default: m.MessagesView })));
const NotificationsPage = React.lazy(() => import('../notifications/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const FavoritesPage = React.lazy(() => import('../FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const ProfileEdit = React.lazy(() => import('../ProfileEdit.tsx').then(m => ({ default: m.ProfileEdit })));
const Gallery = React.lazy(() => import('../gallery/Gallery').then(m => ({ default: m.Gallery })));
const MyDealsScreen = React.lazy(() => import('../business/MyDealsScreen').then(m => ({ default: m.default })));
const ReferralsScreen = React.lazy(() => import('../business/ReferralsScreen').then(m => ({ default: m.default })));
const RankingsScreen = React.lazy(() => import('../business/RankingsScreen').then(m => ({ default: m.default })));
const ROIDashboardWidget = React.lazy(() => import('../business/ROIDashboardWidget').then(m => ({ default: m.default })));

import { supabase } from '../../lib/supabase';

import 'react-big-calendar/lib/css/react-big-calendar.css';



export const ViewSwitcher: React.FC = () => {
    const {
        view, setView,
        currentUser, userProfile,
        isMobile, mobileView, setMobileView,
        members, clubEvents,
        carouselItems,
        selectedEvent, setSelectedEvent,
        selectedMember, setSelectedMember,
        selectedArticle, setSelectedArticle,
        isEditingProfile, setIsEditingProfile,
        showPreviewProfile, setShowPreviewProfile,
        showBenefitsFilter, setShowBenefitsFilter,
        isMockMode, session,
        handleProfileSave, handleLogout, handleNotificationNavigate,
        memberToProfileData,
        calendarDefaultView
    } = useApp();

    // ── Analytics: auto-tracks APP_OPEN (mount) + PAGE_VIEW (view change) + LOGOUT (unmount)
    useAnalytics({ userId: currentUser?.id || null, currentView: view });

    return (
        <ErrorBoundary moduleName="aplicativo">
            {view === ViewState.DASHBOARD && (
                <DashboardHome
                    currentUser={currentUser!}
                    members={members}
                    carouselItems={carouselItems}
                    setView={setView}
                    onViewProfile={(memberId) => {
                        profileService.getProfile(memberId).then(profile => {
                            if (profile) {
                                setSelectedMember(profile);
                                setView(ViewState.MEMBERS);
                            }
                        });
                    }}
                    onBannerClick={(banner) => {
                        if (banner.link_url) {
                            if (banner.link_type === 'EXTERNAL') {
                                window.open(banner.link_url, '_blank');
                            } else {
                                window.location.href = banner.link_url;
                            }
                        }
                    }}
                    onEditProfile={() => setIsEditingProfile(true)}
                    memberToProfileData={memberToProfileData}
                    onNavigateToBenefits={() => {
                        setShowBenefitsFilter(true);
                        setView(ViewState.MEMBERS);
                    }}
                />
            )}

            {view === ViewState.AGENDA && (
                <div className="h-full bg-gradient-to-b from-prosperus-dark-start to-prosperus-dark-end border border-prosperus-stroke p-0 md:p-4 animate-in fade-in overflow-hidden flex flex-col">
                    {/* Filter and Legend Bar */}
                    <div className="hidden md:flex flex-none flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 p-3 bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Legenda:</span>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-purple-500"></span>
                                <span className="text-sm text-slate-300 font-medium">Presencial</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-emerald-500"></span>
                                <span className="text-sm text-slate-300 font-medium">Online</span>
                            </div>
                        </div>

                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'TEAM') && (
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Filtrar:</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 border-slate-600 bg-slate-700 text-yellow-500 focus:ring-yellow-500/50" />
                                    <span className="text-sm text-slate-300 font-medium">Eventos do Clube</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 border-slate-600 bg-slate-700 text-yellow-500 focus:ring-yellow-500/50" />
                                    <span className="text-sm text-slate-300 font-medium">Eventos do Time</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Conditional Rendering: Mobile Hybrid vs Desktop Full Calendar */}
                    {isMobile ? (
                        <>
                            <div className="shrink-0 bg-prosperus-box border-b border-prosperus-stroke px-4 pt-4 pb-4 flex justify-between items-center z-10">
                                <h2 className="text-xl font-bold text-prosperus-white flex items-center gap-2">
                                    <IconAgenda size={24} className="text-prosperus-gold-dark" />
                                    Agenda
                                </h2>
                                <div className="bg-prosperus-box rounded-lg p-1 flex items-center">
                                    <button
                                        onClick={() => setMobileView('LIST')}
                                        className={mobileView === 'LIST' ? "bg-gradient-to-r from-prosperus-gold-light to-prosperus-gold-dark text-prosperus-box font-bold rounded-md px-4 py-1.5 text-sm border-none transition-all" : "bg-prosperus-muted-bg text-prosperus-muted-text rounded-md px-4 py-1.5 text-sm border-transparent transition-colors"}
                                    >
                                        Lista
                                    </button>
                                    <button
                                        onClick={() => setMobileView('MONTH')}
                                        className={mobileView === 'MONTH' ? "bg-gradient-to-r from-prosperus-gold-light to-prosperus-gold-dark text-prosperus-box font-bold rounded-md px-4 py-1.5 text-sm border-none transition-all" : "bg-prosperus-muted-bg text-prosperus-muted-text rounded-md px-4 py-1.5 text-sm border-transparent transition-colors"}
                                    >
                                        Mês
                                    </button>
                                    <button
                                        onClick={() => setMobileView('YEAR')}
                                        className={mobileView === 'YEAR' ? "bg-gradient-to-r from-prosperus-gold-light to-prosperus-gold-dark text-prosperus-box font-bold rounded-md px-4 py-1.5 text-sm border-none transition-all" : "bg-prosperus-muted-bg text-prosperus-muted-text rounded-md px-4 py-1.5 text-sm border-transparent transition-colors"}
                                    >
                                        Ano
                                    </button>
                                </div>
                            </div>

                            {mobileView === 'YEAR' ? (
                                <YearlyAgendaView events={clubEvents} onSelectEvent={(event) => setSelectedEvent(event)} />
                            ) : mobileView === 'LIST' ? (
                                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain agenda-scroll-area" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                                    <MobileAgendaView
                                        events={clubEvents}
                                        onSelectEvent={(event) => setSelectedEvent(event)}
                                        onSwitchToMonth={() => setMobileView('MONTH')}
                                    />
                                </div>
                            ) : (
                                <div className="flex-1 min-h-0 flex flex-col mobile-calendar-month px-2 overflow-auto">
                                    <style>{`
                                        .agenda-scroll-area { scrollbar-width: thin; scrollbar-color: transparent transparent; -ms-overflow-style: none; }
                                        .agenda-scroll-area::-webkit-scrollbar { width: 0; background: transparent; }
                                        .mobile-calendar-month .rbc-header { font-size: 0.8rem; }
                                        .mobile-calendar-month .rbc-month-view { max-width: 100%; flex: 1; min-height: 0; overflow: visible; }
                                        .mobile-calendar-month .rbc-month-row { min-height: 60px; }
                                    `}</style>
                                    <Calendar
                                        localizer={localizer}
                                        culture="pt-BR"
                                        events={clubEvents}
                                        startAccessor={(event: Event) => {
                                            const date = new Date(event.date);
                                            return isNaN(date.getTime()) ? new Date() : date;
                                        }}
                                        endAccessor={(event: Event) => {
                                            if (event.endDate) {
                                                const endDate = new Date(event.endDate);
                                                return isNaN(endDate.getTime()) ? new Date(new Date(event.date).getTime() + 3600000) : endDate;
                                            }
                                            return new Date(new Date(event.date).getTime() + 3600000);
                                        }}
                                        defaultView="month"
                                        views={['month']}
                                        style={{ flex: 1, minHeight: 0 }}
                                        formats={{
                                            weekdayFormat: (date, culture, localizer) => {
                                                const fullDay = localizer?.format(date, 'EEEE', culture) || '';
                                                return fullDay.substring(0, 3).toLowerCase();
                                            }
                                        }}
                                        messages={{
                                            next: "Próximo",
                                            previous: "Anterior",
                                            today: "Hoje",
                                            month: "Mês",
                                            noEventsInRange: "Sem eventos",
                                        }}
                                        onSelectEvent={(event) => setSelectedEvent(event)}
                                        eventPropGetter={(event) => {
                                            let backgroundColor = '#10b981';
                                            let borderColor = '#059669';
                                            if (event.category === 'PRESENTIAL') {
                                                backgroundColor = '#9333ea';
                                                borderColor = '#7c3aed';
                                            }
                                            return { style: { backgroundColor, borderColor, color: 'white', borderWidth: '1px', borderStyle: 'solid', fontWeight: '600', fontSize: '11px' } };
                                        }}
                                        components={{
                                            toolbar: (props) => (
                                                <div className="flex justify-between items-center mb-3 px-2">
                                                    <button onClick={() => props.onNavigate(Navigate.PREVIOUS)} className="p-2 hover:bg-slate-800 rounded transition-colors">
                                                        <ChevronLeft size={20} />
                                                    </button>
                                                    <span className="text-base font-bold text-white capitalize">{props.label}</span>
                                                    <button onClick={() => props.onNavigate(Navigate.NEXT)} className="p-2 hover:bg-slate-800 rounded transition-colors">
                                                        <ChevronRight size={20} />
                                                    </button>
                                                </div>
                                            )
                                        }}
                                    />
                                </div>
                            )}

                            {/* RODAPÉ (LEGENDA FIXA) */}
                            <div className="shrink-0 w-full bg-prosperus-box border-t border-prosperus-stroke py-4 px-6 flex items-center justify-start gap-6 z-20">
                                <span className="text-xs font-bold text-prosperus-grey tracking-widest uppercase">Legenda:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border border-purple-500/50 bg-purple-500/10 rounded-sm flex-shrink-0" />
                                    <span className="text-sm font-bold text-prosperus-white">Presencial</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border border-emerald-500/50 bg-emerald-500/10 rounded-sm flex-shrink-0" />
                                    <span className="text-sm font-bold text-prosperus-white">Online</span>
                                </div>
                            </div>
                        </>
                    ) : mobileView === 'YEAR' ? (
                        <YearlyAgendaView events={clubEvents} onSelectEvent={(event) => setSelectedEvent(event)} />
                    ) : (
                        <div className="h-full w-full overflow-hidden rounded-xl">
                            <Calendar
                                localizer={localizer}
                                culture="pt-BR"
                                events={clubEvents}
                                startAccessor={(event: Event) => {
                                    const date = new Date(event.date);
                                    return isNaN(date.getTime()) ? new Date() : date;
                                }}
                                endAccessor={(event: Event) => {
                                    if (event.endDate) {
                                        const endDate = new Date(event.endDate);
                                        return isNaN(endDate.getTime()) ? new Date(new Date(event.date).getTime() + 3600000) : endDate;
                                    }
                                    return new Date(new Date(event.date).getTime() + 3600000);
                                }}
                                defaultView={calendarDefaultView}
                                style={{ height: 'calc(100% - 80px)' }}
                                messages={{
                                    next: "Próximo", previous: "Anterior", today: "Hoje",
                                    month: "Mês", week: "Semana", day: "Dia",
                                    agenda: "Lista", date: "Data", time: "Hora",
                                    event: "Evento", noEventsInRange: "Não há eventos neste período.",
                                    showMore: (total) => `+ ${total} mais`
                                }}
                                views={{ agenda: true, day: true, week: true, month: true }}
                                onSelectEvent={(event) => setSelectedEvent(event)}
                                eventPropGetter={(event) => {
                                    let backgroundColor = '#10b981';
                                    let borderColor = '#059669';
                                    if (event.category === 'PRESENTIAL') {
                                        backgroundColor = '#9333ea';
                                        borderColor = '#7c3aed';
                                    }
                                    return { style: { backgroundColor, borderColor, color: 'white', borderWidth: '1px', borderStyle: 'solid', fontWeight: '600' } };
                                }}
                                components={{
                                    toolbar: (props) => (
                                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 p-2">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => props.onNavigate(Navigate.PREVIOUS)} className="p-2 hover:bg-slate-800 transition-colors" title="Anterior">
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <button onClick={() => props.onNavigate(Navigate.TODAY)} className="px-3 py-1 text-sm font-bold text-yellow-500 hover:text-yellow-400 transition-colors">Hoje</button>
                                                <span className="text-lg font-bold text-white capitalize min-w-[200px] text-center">{props.label}</span>
                                                <button onClick={() => props.onNavigate(Navigate.NEXT)} className="p-2 hover:bg-slate-800 transition-colors" title="Próximo">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                            <div className="flex bg-slate-800 p-1 gap-1">
                                                {['agenda', 'day', 'week', 'month'].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => { setMobileView(v === 'agenda' ? 'LIST' : v === 'month' ? 'MONTH' : 'MONTH'); props.onView(v as any); }}
                                                        className={`px-4 py-2 text-sm font-bold transition-all ${props.view === v ? 'bg-yellow-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                                                    >
                                                        {v === 'agenda' ? 'Lista' : v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setMobileView('YEAR')}
                                                    className="px-4 py-2 text-sm font-bold transition-all text-slate-400 hover:text-white hover:bg-slate-700"
                                                >
                                                    Ano
                                                </button>
                                            </div>
                                        </div>
                                    )
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {view === ViewState.PROSPERUS_TOOLS && currentUser && (
                <div className="animate-in fade-in"><ProsperusToolsPage setView={setView} /></div>
            )}

            {view === ViewState.ACADEMY && currentUser && (
                <div className="animate-in fade-in"><Academy userId={currentUser.id} onBack={() => setView(ViewState.PROSPERUS_TOOLS)} /></div>
            )}

            {view === ViewState.SOLUTIONS && currentUser && (
                <div className="animate-in fade-in"><SolutionsListPage setView={setView} /></div>
            )}

            {view === ViewState.PROGRESS && currentUser && (
                <div className="animate-in fade-in"><ProgressListPage setView={setView} /></div>
            )}

            {/* EVENT DETAILS MODAL */}
            {selectedEvent && (
                <EventDetailsModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    userId={userProfile?.id}
                />
            )}

            {view === ViewState.MEMBERS && (
                <MemberBook
                    onSelectMember={setSelectedMember}
                    currentUserId={currentUser?.id}
                    initialBenefitsFilter={showBenefitsFilter}
                />
            )}

            {/* MEMBER DETAILS MODAL */}
            {selectedMember && (
                <ProfilePreview
                    profile={selectedMember}
                    onClose={() => setSelectedMember(null)}
                    currentUserId={currentUser?.id}
                    onStartChat={() => {
                        setSelectedMember(null);
                        setView(ViewState.MESSAGES);
                    }}
                />
            )}

            {view === ViewState.GALLERY && (
                <div className="animate-in fade-in h-full"><Gallery /></div>
            )}

            {view === ViewState.NEWS && (
                <div className="animate-in fade-in h-full">
                    {selectedArticle ? (
                        <ArticleReader article={selectedArticle} onBack={() => setSelectedArticle(null)} />
                    ) : (
                        <NewsList onArticleSelect={(article) => setSelectedArticle(article)} />
                    )}
                </div>
            )}

            {view === ViewState.DEALS && currentUser && (
                <div className="animate-in fade-in"><MyDealsScreen /></div>
            )}

            {view === ViewState.REFERRALS && currentUser && (
                <div className="animate-in fade-in"><ReferralsScreen /></div>
            )}

            {view === ViewState.RANKINGS && currentUser && (
                <div className="animate-in fade-in"><RankingsScreen /></div>
            )}

            {view === ViewState.MESSAGES && currentUser && (
                <div className="h-full animate-in fade-in"><MessagesView currentUserId={currentUser.id} /></div>
            )}

            {view === ViewState.NOTIFICATIONS && currentUser && (
                <div className="animate-in fade-in">
                    <NotificationsPage currentUserId={currentUser.id} onNavigate={handleNotificationNavigate} />
                </div>
            )}

            {view === ViewState.FAVORITES && currentUser && (
                <div className="animate-in fade-in">
                    <FavoritesPage setView={setView} currentUserId={currentUser.id} />
                </div>
            )}

            {view === ViewState.PROFILE && currentUser && (
                <ProfileSection
                    currentUser={currentUser}
                    setView={setView}
                    setIsEditingProfile={setIsEditingProfile}
                    setShowPreviewProfile={setShowPreviewProfile}
                    onLogout={handleLogout}
                />
            )}

            {/* PROFILE EDIT MODAL */}
            {isEditingProfile && currentUser && (
                <ProfileEdit
                    currentUser={memberToProfileData(currentUser)}
                    supabase={supabase}
                    isMockMode={isMockMode}
                    onSave={handleProfileSave}
                    onCancel={() => setIsEditingProfile(false)}
                />
            )}

            {/* PROFILE PREVIEW MODAL */}
            {showPreviewProfile && currentUser && (
                <ProfilePreview
                    profile={memberToProfileData(currentUser)}
                    onClose={() => setShowPreviewProfile(false)}
                    currentUserId={currentUser.id}
                />
            )}
        </ErrorBoundary>
    );
};
