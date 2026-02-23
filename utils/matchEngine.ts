// ============================================
// MATCH ENGINE — Business Compatibility Scoring
// ============================================
// Client-side matching: what members sell × need × sectors × tags
// Pure functions, zero side-effects, no API calls

import { ProfileData } from '../services/profileService';

// ─── Types ────────────────────────────────────────────────────────

export type MatchType = 'STRONG' | 'COMMON' | 'POTENTIAL' | 'NONE';

export interface MatchReason {
    type: 'SELLS_NEEDS' | 'NEEDS_SELLS' | 'SECTOR' | 'TAG';
    label: string;       // Human-readable (pt-BR)
    detail: string;      // Matched keywords joined by " · "
    points: number;
}

export interface MatchResult {
    profile: ProfileData;
    score: number;
    matchType: MatchType;
    reasons: MatchReason[];
}

// ─── Stopwords (pt-BR) ───────────────────────────────────────────

const STOPWORDS = new Set([
    'que', 'para', 'com', 'por', 'uma', 'uns', 'umas', 'como',
    'mais', 'mas', 'seu', 'sua', 'nos', 'nas', 'dos', 'das',
    'este', 'essa', 'isso', 'ser', 'ter', 'fazer', 'pode',
    'todo', 'toda', 'todos', 'todas', 'muito', 'muita', 'muitos',
    'vou', 'vai', 'vamos', 'foram', 'sobre', 'entre', 'quando',
    'onde', 'quem', 'qual', 'quais', 'estou', 'esta', 'esse',
    'tambem', 'ainda', 'apenas', 'desde', 'ate', 'sem', 'num',
    'numa', 'cada', 'mesmo', 'mesma', 'nao', 'sim', 'bem',
]);

// ─── Tokenizer ────────────────────────────────────────────────────

function tokenize(text: string): Set<string> {
    if (!text) return new Set();
    return new Set(
        text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')   // strip accents
            .replace(/[^\w\s]/g, ' ')          // strip punctuation
            .split(/\s+/)
            .filter(w => w.length > 2)         // drop short words
            .filter(w => !STOPWORDS.has(w))
    );
}

// ─── Text Overlap Score (Jaccard-based) ───────────────────────────

function textOverlapScore(
    textA: string,
    textB: string
): { score: number; matchedKeywords: string[] } {
    const tokensA = tokenize(textA);
    const tokensB = tokenize(textB);

    if (tokensA.size === 0 || tokensB.size === 0) {
        return { score: 0, matchedKeywords: [] };
    }

    const matched = [...tokensA].filter(t => tokensB.has(t));

    if (matched.length === 0) {
        return { score: 0, matchedKeywords: [] };
    }

    // Jaccard similarity scaled to 0-50 range
    const union = new Set([...tokensA, ...tokensB]).size;
    const jaccard = matched.length / union;
    const score = Math.round(jaccard * 150); // amplify for usable range

    return {
        score: Math.min(score, 50),
        matchedKeywords: matched.slice(0, 5),
    };
}

// ─── Main Scoring Function ────────────────────────────────────────

export function calculateMatch(
    currentUser: ProfileData,
    other: ProfileData
): MatchResult {
    // Never match with self
    if (other.id === currentUser.id) {
        return { profile: other, score: 0, matchType: 'NONE', reasons: [] };
    }

    let totalScore = 0;
    const reasons: MatchReason[] = [];

    // ── DIMENSION 1A: Other sells what I need (up to 50pts) ──
    const sellsWhatINeed = textOverlapScore(
        other.what_i_sell || '',
        currentUser.what_i_need || ''
    );
    if (sellsWhatINeed.score > 5) {
        totalScore += sellsWhatINeed.score;
        reasons.push({
            type: 'SELLS_NEEDS',
            label: 'Oferece o que você precisa',
            detail: sellsWhatINeed.matchedKeywords.join(' · '),
            points: sellsWhatINeed.score,
        });
    }

    // ── DIMENSION 1B: I sell what they need (weighted 0.7x, up to ~35pts) ──
    const iSellWhatTheyNeed = textOverlapScore(
        currentUser.what_i_sell || '',
        other.what_i_need || ''
    );
    if (iSellWhatTheyNeed.score > 5) {
        const pts = Math.round(iSellWhatTheyNeed.score * 0.7);
        totalScore += pts;
        reasons.push({
            type: 'NEEDS_SELLS',
            label: 'Você oferece o que ele precisa',
            detail: iSellWhatTheyNeed.matchedKeywords.join(' · '),
            points: pts,
        });
    }

    // ── DIMENSION 2: Shared sectors (up to 30pts, +10 each) ──
    const mySectors = currentUser.partnership_interests ?? [];
    const theirSectors = other.partnership_interests ?? [];
    const sharedSectors = mySectors.filter(s => theirSectors.includes(s));
    if (sharedSectors.length > 0) {
        const pts = Math.min(sharedSectors.length * 10, 30);
        totalScore += pts;
        reasons.push({
            type: 'SECTOR',
            label: 'Setores em comum',
            detail: sharedSectors.slice(0, 3).join(' · '),
            points: pts,
        });
    }

    // ── DIMENSION 3: Shared tags (up to 20pts, +5 each) ──
    const myTags = currentUser.tags ?? [];
    const theirTags = other.tags ?? [];
    const sharedTags = myTags.filter(t => theirTags.includes(t));
    if (sharedTags.length > 0) {
        const pts = Math.min(sharedTags.length * 5, 20);
        totalScore += pts;
        reasons.push({
            type: 'TAG',
            label: 'Interesses em comum',
            detail: sharedTags.slice(0, 4).join(' · '),
            points: pts,
        });
    }

    // ── Final score + classification ──
    const score = Math.min(totalScore, 100);
    const matchType: MatchType =
        score >= 70 ? 'STRONG' :
            score >= 40 ? 'COMMON' :
                score >= 10 ? 'POTENTIAL' :
                    'NONE';

    return { profile: other, score, matchType, reasons };
}

// ─── Rank All Profiles ────────────────────────────────────────────

export function rankMatches(
    currentUser: ProfileData,
    allProfiles: ProfileData[]
): MatchResult[] {
    return allProfiles
        .map(p => calculateMatch(currentUser, p))
        .filter(r => r.matchType !== 'NONE')
        .sort((a, b) => b.score - a.score);
}
