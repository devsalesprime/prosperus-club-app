// tests/services/exportService.test.ts
// Unit tests for CSV and vCard export generators

import { describe, it, expect } from 'vitest';
import { generateCSV, generateVCards } from '../../services/exportService';
import type { ProfileData } from '../../services/profileService';

const mockMembers: ProfileData[] = [
    {
        id: '1',
        email: 'joao@empresa.com',
        name: 'João Silva',
        role: 'MEMBER',
        company: 'Tech Corp',
        job_title: 'CEO',
        socials: {
            linkedin: 'https://linkedin.com/in/joaosilva',
            instagram: '@joaosilva',
            whatsapp: '+5511999999999',
            website: 'https://joaosilva.com'
        },
        tags: ['Tecnologia', 'Vendas'],
        bio: 'Empreendedor apaixonado por tecnologia.'
    },
    {
        id: '2',
        email: 'maria@design.co',
        name: 'Maria Costa',
        role: 'MEMBER',
        company: 'Design Co',
        job_title: 'Designer Lead',
        tags: ['Marketing', 'Consultoria']
    },
    {
        id: '3',
        email: 'pedro@test.com',
        name: 'Pedro',
        role: 'MEMBER',
    }
];

// ===================== CSV TESTS =====================

describe('generateCSV', () => {
    it('should generate valid CSV with BOM header', () => {
        const csv = generateCSV(mockMembers);
        // BOM character for UTF-8
        expect(csv.charCodeAt(0)).toBe(0xFEFF);
    });

    it('should include correct CSV headers', () => {
        const csv = generateCSV(mockMembers);
        const lines = csv.split('\r\n');
        // Remove BOM from first line comparison
        const headers = lines[0].replace('\uFEFF', '');
        expect(headers).toBe('Nome,Email,Empresa,Cargo,LinkedIn,Instagram,WhatsApp,Website,Tags');
    });

    it('should include all members as rows', () => {
        const csv = generateCSV(mockMembers);
        const lines = csv.split('\r\n');
        // 1 header + 3 data rows
        expect(lines.length).toBe(4);
    });

    it('should correctly populate member data', () => {
        const csv = generateCSV(mockMembers);
        const lines = csv.split('\r\n');
        const row1 = lines[1]; // João Silva
        expect(row1).toContain('João Silva');
        expect(row1).toContain('joao@empresa.com');
        expect(row1).toContain('Tech Corp');
        expect(row1).toContain('CEO');
        expect(row1).toContain('https://linkedin.com/in/joaosilva');
    });

    it('should handle missing fields gracefully', () => {
        const csv = generateCSV(mockMembers);
        const lines = csv.split('\r\n');
        const row3 = lines[3]; // Pedro (minimal data)
        expect(row3).toContain('Pedro');
        expect(row3).toContain('pedro@test.com');
        // Should have empty fields for missing data
        expect(row3.split(',').length).toBe(9); // 9 columns
    });

    it('should escape values containing commas', () => {
        const memberWithComma: ProfileData[] = [{
            id: '4',
            email: 'test@test.com',
            name: 'Silva, João',
            role: 'MEMBER'
        }];
        const csv = generateCSV(memberWithComma);
        expect(csv).toContain('"Silva, João"');
    });

    it('should handle empty array', () => {
        const csv = generateCSV([]);
        const lines = csv.split('\r\n');
        expect(lines.length).toBe(1); // Only headers
    });

    it('should join tags with semicolons', () => {
        const csv = generateCSV(mockMembers);
        expect(csv).toContain('Tecnologia; Vendas');
    });
});

// ===================== VCARD TESTS =====================

describe('generateVCards', () => {
    it('should generate valid vCard 3.0 format', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('BEGIN:VCARD');
        expect(vcf).toContain('VERSION:3.0');
        expect(vcf).toContain('END:VCARD');
    });

    it('should include full name', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('FN:João Silva');
    });

    it('should split name into first/last for N field', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('N:Silva;João;;;');
    });

    it('should include organization and title', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('ORG:Tech Corp');
        expect(vcf).toContain('TITLE:CEO');
    });

    it('should include email', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('EMAIL;TYPE=INTERNET:joao@empresa.com');
    });

    it('should include phone from WhatsApp', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('TEL;TYPE=CELL:+5511999999999');
    });

    it('should include social profiles', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('X-SOCIALPROFILE;TYPE=linkedin:https://linkedin.com/in/joaosilva');
        expect(vcf).toContain('X-SOCIALPROFILE;TYPE=instagram:@joaosilva');
    });

    it('should include website', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('URL:https://joaosilva.com');
    });

    it('should include bio in NOTE', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('NOTE:Empreendedor apaixonado por tecnologia.');
    });

    it('should include tags in NOTE', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('Tags: Tecnologia, Vendas');
    });

    it('should include Prosperus source', () => {
        const vcf = generateVCards([mockMembers[0]]);
        expect(vcf).toContain('X-SOURCE:Prosperus Club');
    });

    it('should handle member with minimal data', () => {
        const vcf = generateVCards([mockMembers[2]]); // Pedro
        expect(vcf).toContain('BEGIN:VCARD');
        expect(vcf).toContain('FN:Pedro');
        expect(vcf).toContain('END:VCARD');
        expect(vcf).not.toContain('ORG:');
        expect(vcf).not.toContain('TITLE:');
    });

    it('should generate multiple vCards separated by newlines', () => {
        const vcf = generateVCards(mockMembers);
        const vCards = vcf.split('BEGIN:VCARD');
        // First element is empty string before first BEGIN:VCARD
        expect(vCards.length - 1).toBe(3);
    });

    it('should handle single-name members', () => {
        const vcf = generateVCards([mockMembers[2]]); // Pedro (single name)
        expect(vcf).toContain('N:;Pedro;;;');
        expect(vcf).toContain('FN:Pedro');
    });
});
