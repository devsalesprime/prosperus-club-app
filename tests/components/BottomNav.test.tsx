// tests/components/BottomNav.test.tsx
// Vitest unit tests for BottomNav component

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav, bottomNavItems } from '../../components/layout/BottomNav';

// Mock the AppContext
const mockSetView = vi.fn();
vi.mock('../../contexts/AppContext', () => ({
    useApp: () => ({
        view: 'DASHBOARD',
        setView: mockSetView,
    }),
}));

describe('BottomNav', () => {
    beforeEach(() => {
        mockSetView.mockClear();
    });

    it('renders all 5 navigation items', () => {
        render(<BottomNav />);
        expect(screen.getByText('Início')).toBeInTheDocument();
        expect(screen.getByText('Agenda')).toBeInTheDocument();
        expect(screen.getByText('Prosperus')).toBeInTheDocument();
        expect(screen.getByText('Sócios')).toBeInTheDocument();
        expect(screen.getByText('Galeria')).toBeInTheDocument();
    });

    it('exports exactly 5 items from bottomNavItems', () => {
        expect(bottomNavItems).toHaveLength(5);
        const labels = bottomNavItems.map(i => i.label);
        expect(labels).toEqual(['Início', 'Agenda', 'Prosperus', 'Sócios', 'Galeria']);
    });

    it('renders nav with correct id', () => {
        const { container } = render(<BottomNav />);
        const nav = container.querySelector('#prosperus-bottom-nav');
        expect(nav).toBeInTheDocument();
        expect(nav?.tagName).toBe('NAV');
    });

    it('contains an inner 56px button row', () => {
        const { container } = render(<BottomNav />);
        const nav = container.querySelector('#prosperus-bottom-nav');
        const buttonRow = nav?.firstElementChild as HTMLElement;
        expect(buttonRow).toBeTruthy();
        expect(buttonRow.style.height).toBe('56px');
    });

    it('nav uses flex-column for safe area expansion', () => {
        const { container } = render(<BottomNav />);
        const nav = container.querySelector('#prosperus-bottom-nav') as HTMLElement;
        expect(nav.style.flexDirection).toBe('column');
    });

    it('injects <style> tag with env() safe area rules', () => {
        const { container } = render(<BottomNav />);
        const styleTag = container.querySelector('style');
        expect(styleTag).toBeTruthy();
        expect(styleTag?.textContent).toContain('env(safe-area-inset-bottom');
        expect(styleTag?.textContent).toContain('min-height');
        expect(styleTag?.textContent).toContain('padding-bottom');
    });

    it('highlights active tab with gold color', () => {
        render(<BottomNav />);
        const activeLabel = screen.getByText('Início');
        expect(activeLabel.style.color).toBe('rgb(255, 218, 113)'); // #FFDA71
        expect(activeLabel.style.fontWeight).toBe('600');
    });

    it('shows inactive tabs with grey color', () => {
        render(<BottomNav />);
        const inactiveLabel = screen.getByText('Agenda');
        expect(inactiveLabel.style.color).toBe('rgb(138, 155, 176)'); // #8A9BB0
        expect(inactiveLabel.style.fontWeight).toBe('400');
    });

    it('calls setView when a tab is clicked', () => {
        render(<BottomNav />);
        fireEvent.click(screen.getByText('Agenda'));
        expect(mockSetView).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard navigation (Enter key)', () => {
        render(<BottomNav />);
        const agendaButton = screen.getByText('Agenda').closest('[role="button"]')!;
        fireEvent.keyDown(agendaButton, { key: 'Enter' });
        expect(mockSetView).toHaveBeenCalledTimes(1);
    });

    it('uses div role=button instead of button elements', () => {
        const { container } = render(<BottomNav />);
        const buttons = container.querySelectorAll('[role="button"]');
        expect(buttons.length).toBe(5);
        buttons.forEach(btn => {
            expect(btn.tagName).toBe('DIV');
        });
    });
});
