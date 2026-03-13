// ============================================
// EVENTS MODULE - Orchestrator (Refactored)
// ============================================
// State machine: list ↔ form view
// All logic delegated to EventList and EventForm submodules

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ClubEvent } from '../../../types';
import { eventService } from '../../../services/eventService';
import { AdminPageHeader, AdminLoadingState } from '../shared';
import { EventList } from './EventList';
import { EventForm } from './EventForm';

type ViewMode = 'list' | 'form';

export const EventsModule: React.FC = () => {
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewMode>('list');
    const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);

    const refreshEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            setEvents(data);
        } catch (err) {
            console.error('Error loading events:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refreshEvents(); }, []);

    const handleNew = () => {
        setEditingEvent(null);
        setView('form');
    };

    const handleEdit = (event: ClubEvent) => {
        setEditingEvent(event);
        setView('form');
    };

    const handleSaved = async () => {
        setView('list');
        setEditingEvent(null);
        await refreshEvents();
    };

    const handleCancel = () => {
        setView('list');
        setEditingEvent(null);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Gestão de Eventos" subtitle="Crie e gerencie eventos do clube" />
                <AdminLoadingState message="Carregando eventos..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gestão de Eventos"
                subtitle={`${events.length} evento(s) cadastrado(s)`}
                action={
                    <button
                        onClick={handleNew}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 font-bold transition shadow-lg"
                    >
                        <Plus size={18} /> Novo Evento
                    </button>
                }
            />

            <EventList
                events={events}
                onEdit={handleEdit}
                onRefresh={refreshEvents}
            />

            {view === 'form' && (
                <EventForm
                    event={editingEvent}
                    onSaved={handleSaved}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

export default EventsModule;
