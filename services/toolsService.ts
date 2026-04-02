// services/toolsService.ts
// Service for Prosperus Tools Hub: Solutions and Member Progress

import { supabase } from '../lib/supabase';

// ========== TYPES ==========

export interface ToolSolution {
    id: string;
    title: string;
    description: string | null;
    external_url: string;
    icon_url: string | null;
    banner_url: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface MemberProgressFile {
    id: string;
    member_id: string;
    title: string;
    file_url: string;
    file_type: string;
    file_size: number | null;
    created_at: string;
    created_by: string | null;
    // Joined data
    member?: {
        id: string;
        name: string;
        image_url: string;
    };
}

export interface CreateSolutionInput {
    title: string;
    description?: string;
    external_url: string;
    icon_url?: string;
    banner_url?: string;
    sort_order?: number;
}

export interface UploadProgressFileInput {
    member_id: string;
    title: string;
    file: File;
}

// ========== SERVICE CLASS ==========

class ToolsService {
    // ==================== SOLUTIONS ====================

    /**
     * Get all active solutions (for members)
     */
    async getActiveSolutions(): Promise<ToolSolution[]> {
        const { data, error } = await supabase
            .from('tools_solutions')
            .select('id, title, description, external_url, icon_url, banner_url, is_active, sort_order, created_at, updated_at')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get all solutions (for admin)
     */
    async getAllSolutions(): Promise<ToolSolution[]> {
        const { data, error } = await supabase
            .from('tools_solutions')
            .select('id, title, description, external_url, icon_url, banner_url, is_active, sort_order, created_at, updated_at')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Create a new solution (admin only)
     */
    async createSolution(input: CreateSolutionInput): Promise<ToolSolution> {
        const { data, error } = await supabase
            .from('tools_solutions')
            .insert({
                title: input.title,
                description: input.description,
                external_url: input.external_url,
                icon_url: input.icon_url,
                banner_url: input.banner_url,
                sort_order: input.sort_order || 0,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update a solution (admin only)
     */
    async updateSolution(id: string, updates: Partial<CreateSolutionInput>): Promise<ToolSolution> {
        const { data, error } = await supabase
            .from('tools_solutions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Toggle solution active status (admin only)
     */
    async toggleSolutionStatus(id: string, is_active: boolean): Promise<void> {
        const { error } = await supabase
            .from('tools_solutions')
            .update({ is_active })
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Delete a solution (admin only)
     */
    async deleteSolution(id: string): Promise<void> {
        const { error } = await supabase
            .from('tools_solutions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // ==================== MEMBER PROGRESS FILES ====================

    /**
     * Get progress files for current user
     */
    async getMyProgressFiles(): Promise<MemberProgressFile[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('member_progress_files')
            .select('id, member_id, title, file_url, file_type, file_size, created_at, created_by')
            .eq('member_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get all progress files (admin only)
     */
    async getAllProgressFiles(): Promise<MemberProgressFile[]> {
        const { data, error } = await supabase
            .from('member_progress_files')
            .select(`
                *,
                member:member_id (id, name, image_url)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Get progress files for a specific member (admin only)
     */
    async getMemberProgressFiles(memberId: string): Promise<MemberProgressFile[]> {
        const { data, error } = await supabase
            .from('member_progress_files')
            .select('id, member_id, title, file_url, file_type, file_size, created_at, created_by')
            .eq('member_id', memberId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Upload a progress file for a member (admin only)
     */
    async uploadProgressFile(input: UploadProgressFileInput): Promise<MemberProgressFile> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        // 1. Upload file to storage
        const fileExt = input.file.name.split('.').pop()?.toLowerCase() || 'unknown';
        const fileName = `${input.member_id}/${Date.now()}.${fileExt}`;

        // Map extension to correct MIME type for proper browser rendering
        const mimeTypes: Record<string, string> = {
            'html': 'text/html',
            'htm': 'text/html',
            'pdf': 'application/pdf',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'csv': 'text/csv',
        };
        const contentType = mimeTypes[fileExt] || input.file.type || 'application/octet-stream';

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('member-reports')
            .upload(fileName, input.file, {
                contentType,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('member-reports')
            .getPublicUrl(fileName);

        // 3. Create database record
        const { data, error } = await supabase
            .from('member_progress_files')
            .insert({
                member_id: input.member_id,
                title: input.title,
                file_url: publicUrl,
                file_type: fileExt || 'unknown',
                file_size: input.file.size,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete a progress file (admin only)
     */
    async deleteProgressFile(id: string): Promise<void> {
        // 1. Get file info
        const { data: file, error: fetchError } = await supabase
            .from('member_progress_files')
            .select('file_url')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Extract file path from URL
        const urlParts = file.file_url.split('/member-reports/');
        if (urlParts.length > 1) {
            const filePath = urlParts[1];

            // 3. Delete from storage
            await supabase.storage
                .from('member-reports')
                .remove([filePath]);
        }

        // 4. Delete database record
        const { error } = await supabase
            .from('member_progress_files')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // ==================== STORAGE HELPERS ====================

    /**
     * Upload solution banner/icon
     * Reuses 'chat-media' bucket (confirmed accepts image MIME types) with solutions/ subfolder
     */
    async uploadSolutionAsset(file: File, type: 'banner' | 'icon'): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `solutions/${type}s/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('chat-media')
            .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('chat-media')
            .getPublicUrl(fileName);

        return publicUrl;
    }
}

// Singleton Export
export const toolsService = new ToolsService();
