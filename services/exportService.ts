// services/exportService.ts
// Contact Export: CSV and vCard (.vcf) generators
// Prosperus Club App v2.9 — PRD Gap Fix #4

import { ProfileData } from './profileService';

// ========== CSV EXPORT ==========

/**
 * Generate CSV content from ProfileData array
 * Columns: Nome, Email, Empresa, Cargo, LinkedIn, Instagram, WhatsApp, Website, Tags
 */
export function generateCSV(members: ProfileData[]): string {
    const headers = ['Nome', 'Email', 'Empresa', 'Cargo', 'LinkedIn', 'Instagram', 'WhatsApp', 'Website', 'Tags'];

    const escapeCSV = (val: string): string => {
        if (!val) return '';
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    };

    const rows = members.map(m => [
        escapeCSV(m.name || ''),
        escapeCSV(m.email || ''),
        escapeCSV(m.company || ''),
        escapeCSV(m.job_title || ''),
        escapeCSV(m.socials?.linkedin || ''),
        escapeCSV(m.socials?.instagram || ''),
        escapeCSV(m.socials?.whatsapp || ''),
        escapeCSV(m.socials?.website || ''),
        escapeCSV((m.tags || []).join('; '))
    ].join(','));

    // BOM for Excel UTF-8 compatibility
    return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

// ========== VCARD EXPORT ==========

/**
 * Generate a single vCard 3.0 string for a member
 */
function memberToVCard(m: ProfileData): string {
    const lines: string[] = [];
    lines.push('BEGIN:VCARD');
    lines.push('VERSION:3.0');

    // Full Name
    const nameParts = (m.name || '').split(' ');
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const firstName = nameParts[0] || '';
    lines.push(`N:${lastName};${firstName};;;`);
    lines.push(`FN:${m.name || ''}`);

    // Organization & Title
    if (m.company) lines.push(`ORG:${m.company}`);
    if (m.job_title) lines.push(`TITLE:${m.job_title}`);

    // Email
    if (m.email) lines.push(`EMAIL;TYPE=INTERNET:${m.email}`);

    // Phone (WhatsApp)
    if (m.socials?.whatsapp) {
        lines.push(`TEL;TYPE=CELL:${m.socials.whatsapp}`);
    }

    // URLs
    if (m.socials?.website) lines.push(`URL:${m.socials.website}`);
    if (m.socials?.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${m.socials.linkedin}`);
    if (m.socials?.instagram) lines.push(`X-SOCIALPROFILE;TYPE=instagram:${m.socials.instagram}`);

    // Photo URL
    if (m.image_url) lines.push(`PHOTO;VALUE=URI:${m.image_url}`);

    // Note with bio and tags
    const notes: string[] = [];
    if (m.bio) notes.push(m.bio);
    if (m.tags?.length) notes.push(`Tags: ${m.tags.join(', ')}`);
    if (notes.length > 0) lines.push(`NOTE:${notes.join(' | ').replace(/\n/g, '\\n')}`);

    // Source
    lines.push('X-SOURCE:Prosperus Club');

    lines.push('END:VCARD');
    return lines.join('\r\n');
}

/**
 * Generate combined vCard (.vcf) file content from multiple members
 */
export function generateVCards(members: ProfileData[]): string {
    return members.map(memberToVCard).join('\r\n');
}

// ========== DOWNLOAD HELPERS ==========

/**
 * Trigger browser download of a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Export members as CSV file download
 */
export function exportMembersCSV(members: ProfileData[]): void {
    const csv = generateCSV(members);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(csv, `prosperus-members-${date}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export members as vCard (.vcf) file download
 */
export function exportMembersVCard(members: ProfileData[]): void {
    const vcf = generateVCards(members);
    const date = new Date().toISOString().split('T')[0];
    downloadFile(vcf, `prosperus-contacts-${date}.vcf`, 'text/vcard;charset=utf-8');
}
