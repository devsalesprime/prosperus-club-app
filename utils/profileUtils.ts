// Profile utility functions for calculating profile completeness and validation
// Provides detailed breakdown of missing fields with weighted scoring

import { ProfileData } from '../services/profileService';

export interface ProfileCompleteness {
    percentage: number;
    missingFields: string[];
    completedFields: string[];
    fieldScores: { [key: string]: { completed: boolean; weight: number } };
}

/**
 * Calculate profile completion percentage with detailed breakdown
 * 
 * Scoring weights (Total: 100%):
 * - name: 15%
 * - job_title: 15%
 * - company: 15%
 * - bio: 25%
 * - image_url: 10%
 * - linkedin_url: 10%
 * - tags (at least 1): 10%
 * 
 * Note: phone field (10%) temporarily removed pending database migration 011
 */
export function calculateProfileCompletion(profile: ProfileData | null): ProfileCompleteness {
    if (!profile) {
        return {
            percentage: 0,
            missingFields: ['name', 'job_title', 'company', 'bio', 'image_url', 'linkedin_url', 'tags', 'phone'],
            completedFields: [],
            fieldScores: {}
        };
    }

    const fields = {
        name: { weight: 15, completed: !!profile.name && profile.name.trim().length > 0 },
        job_title: { weight: 15, completed: !!profile.job_title && profile.job_title.trim().length > 0 },
        company: { weight: 15, completed: !!profile.company && profile.company.trim().length > 0 },
        bio: { weight: 25, completed: !!profile.bio && profile.bio.trim().length > 0 },
        image_url: { weight: 10, completed: !!profile.image_url && profile.image_url.trim().length > 0 },
        linkedin_url: {
            weight: 10,
            completed: !!(profile.socials?.linkedin) &&
                (profile.socials?.linkedin?.trim().length ?? 0) > 0
        },
        tags: { weight: 10, completed: !!profile.tags && profile.tags.length > 0 }
        // phone field temporarily removed (not yet in database schema - migration 011 pending)
    };

    let totalScore = 0;
    const missingFields: string[] = [];
    const completedFields: string[] = [];

    Object.entries(fields).forEach(([fieldName, fieldData]) => {
        if (fieldData.completed) {
            totalScore += fieldData.weight;
            completedFields.push(fieldName);
        } else {
            missingFields.push(fieldName);
        }
    });

    return {
        percentage: Math.round(totalScore),
        missingFields,
        completedFields,
        fieldScores: fields
    };
}

/**
 * Get user-friendly field names for display
 */
export function getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
        name: 'Nome',
        job_title: 'Cargo',
        company: 'Empresa',
        bio: 'Bio',
        image_url: 'Foto de perfil',
        linkedin_url: 'LinkedIn',
        tags: 'Áreas de interesse',
        phone: 'Telefone'
    };

    return displayNames[fieldName] || fieldName;
}

/**
 * Get missing fields as user-friendly text
 */
export function getMissingFieldsText(missingFields: string[]): string {
    if (missingFields.length === 0) return '';
    if (missingFields.length === 1) return getFieldDisplayName(missingFields[0]);

    const displayNames = missingFields.map(getFieldDisplayName);
    const lastField = displayNames.pop();

    return `${displayNames.join(', ')} e ${lastField}`;
}

/**
 * Check if profile is complete (100%)
 */
export function isProfileComplete(profile: ProfileData | null): boolean {
    const { percentage } = calculateProfileCompletion(profile);
    return percentage === 100;
}
