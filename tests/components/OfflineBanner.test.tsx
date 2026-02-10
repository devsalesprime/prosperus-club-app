// tests/components/OfflineBanner.test.tsx
// Component tests for offline/online banner

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '../../components/OfflineBanner';

describe('OfflineBanner', () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });
    });

    it('should render nothing when online', () => {
        const { container } = render(<OfflineBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('should show offline banner when offline', () => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        render(<OfflineBanner />);

        expect(screen.getByText('Você está offline')).toBeInTheDocument();
    });

    it('should include cache message on desktop', () => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        render(<OfflineBanner />);

        expect(screen.getByText(/exibindo dados do cache local/)).toBeInTheDocument();
    });
});
