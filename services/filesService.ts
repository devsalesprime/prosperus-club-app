// services/filesService.ts
// Service for Member Files: upload, list, download tracking, admin CRUD

import { supabase } from '../lib/supabase';

// ========== TYPES ==========

export interface MemberFile {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_path: string;
    file_type: 'pdf' | 'pptx' | 'ppt' | 'image' | 'doc' | 'docx' | 'xlsx';
    file_size: number;
    file_name: string;
    category: 'geral' | 'apresentacao' | 'evento' | 'material';
    is_visible: boolean;
    download_count: number;
    created_at: string;
}

export interface FileDownloadStat {
    file_id: string;
    title: string;
    file_type: string;
    category: string;
    total_downloads: number;
    unique_downloaders: number;
    last_downloaded: string | null;
}

// ========== UPLOAD (admin) ==========

export async function uploadMemberFile(
    file: File,
    title: string,
    category: string = 'geral',
    description?: string
): Promise<{ data: MemberFile | null; error: string | null }> {
    try {
        // 1. Detect file type
        const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
        const typeMap: Record<string, MemberFile['file_type']> = {
            pdf: 'pdf', pptx: 'pptx', ppt: 'ppt',
            doc: 'doc', docx: 'docx', xlsx: 'xlsx',
            jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', gif: 'image',
        };
        const fileType = typeMap[ext] ?? 'pdf';

        // 2. Build storage path — subfolder club-files/ inside member-reports bucket
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `club-files/${timestamp}_${safeName}`;

        // 3. Upload to Supabase Storage
        const { data: storageData, error: storageErr } = await supabase.storage
            .from('member-reports')
            .upload(path, file, {
                contentType: file.type || 'application/octet-stream',
                upsert: false,
                cacheControl: '3600',
            });

        if (storageErr) throw storageErr;

        // 4. Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('member-reports')
            .getPublicUrl(storageData.path);

        // 5. Get current user for created_by
        const { data: { user } } = await supabase.auth.getUser();

        // 6. Insert into DB
        const { data, error: dbErr } = await supabase
            .from('member_files')
            .insert({
                title,
                description: description || null,
                file_url: publicUrl,
                file_path: storageData.path,
                file_type: fileType,
                file_size: file.size,
                file_name: file.name,
                category,
                is_visible: true,
                created_by: user?.id || null,
            })
            .select()
            .single();

        if (dbErr) throw dbErr;
        return { data, error: null };

    } catch (err: any) {
        console.error('[filesService] uploadMemberFile error:', err);
        return { data: null, error: err?.message ?? 'Erro ao enviar arquivo.' };
    }
}

// ========== LIST ==========

export async function getFiles(
    category: string = 'todos',
    adminMode: boolean = false
): Promise<MemberFile[]> {
    let query = supabase
        .from('member_files')
        .select('*')
        .order('created_at', { ascending: false });

    if (!adminMode) query = query.eq('is_visible', true);
    if (category !== 'todos') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) { console.error('[filesService] getFiles error:', error); return []; }
    return data ?? [];
}

// ========== DOWNLOAD TRACKING ==========

export async function trackFileDownload(
    fileId: string,
    userId: string
): Promise<void> {
    try {
        // Log individual download
        await supabase
            .from('file_downloads')
            .insert({ file_id: fileId, user_id: userId });

        // Atomic increment counter via RPC
        await supabase.rpc('increment_file_download', { p_file_id: fileId });
    } catch (err) {
        console.error('[filesService] trackFileDownload error:', err);
        // Don't propagate — tracking failure should not break the download
    }
}

// ========== ADMIN: DELETE ==========

export async function deleteFile(fileId: string, filePath: string): Promise<boolean> {
    try {
        // 1. Remove from Storage
        await supabase.storage.from('member-reports').remove([filePath]);

        // 2. Remove from DB (cascade deletes file_downloads)
        const { error } = await supabase
            .from('member_files')
            .delete()
            .eq('id', fileId);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('[filesService] deleteFile error:', err);
        return false;
    }
}

// ========== ADMIN: TOGGLE VISIBILITY ==========

export async function toggleFileVisibility(
    fileId: string,
    visible: boolean
): Promise<boolean> {
    const { error } = await supabase
        .from('member_files')
        .update({ is_visible: visible })
        .eq('id', fileId);
    if (error) console.error('[filesService] toggleFileVisibility error:', error);
    return !error;
}

// ========== ANALYTICS ==========

export async function getFileDownloadStats(period: string = '30d'): Promise<FileDownloadStat[]> {
    const { data, error } = await supabase
        .rpc('get_file_download_stats', { p_period: period });
    if (error) { console.error('[filesService] getFileDownloadStats error:', error); return []; }
    return data ?? [];
}

// ========== TOP DOWNLOADERS ==========

export interface TopDownloader {
    user_id: string;
    user_name: string;
    user_image: string | null;
    user_company: string | null;
    total_downloads: number;
    unique_files: number;
    last_download: string | null;
}

export async function getTopFileDownloaders(period: string = '30d'): Promise<TopDownloader[]> {
    const { data, error } = await supabase
        .rpc('get_top_file_downloaders', { p_period: period });
    if (error) { console.error('[filesService] getTopFileDownloaders error:', error); return []; }
    return data ?? [];
}
