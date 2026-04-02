import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface MemberReport {
    id: string;
    user_id: string;
    title: string;
    storage_path: string;
    created_at: string;
}

class ReportService {
    /**
     * Busca todos os relatórios disponíveis para o Sócio autenticado logado
     */
    async getMyReports(): Promise<MemberReport[]> {
        try {
            const { data, error } = await supabase
                .from('member_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as MemberReport[];
        } catch (error) {
            logger.error('Error fetching member reports:', error);
            return [];
        }
    }

    /**
     * Busca todos os relatórios M2M globais (Painel Admin)
     */
    async getAllReports(): Promise<MemberReport[]> {
        try {
            const { data, error } = await supabase
                .from('member_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as MemberReport[];
        } catch (error) {
            logger.error('Error fetching ALL member reports:', error);
            return [];
        }
    }

    /**
     * Gera uma URL temporária assinada para acessar o relatório isoladamente (60 segundos)
     * Isso impede leitura sem autorização e protege a formatação Tailwind do WebApp
     */
    async getReportSignedUrl(storagePath: string): Promise<string | null> {
        try {
            const { data, error } = await supabase.storage
                .from('member_reports')
                .createSignedUrl(storagePath, 60); // 60s expiration for preview

            if (error) throw error;
            return data?.signedUrl || null;
        } catch (error) {
            logger.error(`Error generating signed URL for report ${storagePath}:`, error);
            return null;
        }
    }

    /**
     * Gera URL de compartilhamento com 7 dias de validade (link para gestores).
     * A opção { download: false } instrui o Supabase CDN a servir com
     * Content-Disposition: inline, fazendo o navegador RENDERIZAR o HTML.
     */
    async getShareableUrl(storagePath: string): Promise<string | null> {
        try {
            const { data, error } = await supabase.storage
                .from('member_reports')
                .createSignedUrl(storagePath, 60 * 60 * 24 * 7, {
                    download: false  // inline, sem forçar download
                });

            if (error) throw error;
            return data?.signedUrl || null;
        } catch (error) {
            logger.error(`Error generating shareable URL for report ${storagePath}:`, error);
            return null;
        }
    }

    /**
     * Deleta um relatório permanentemente do Banco e do Storage
     */
    async deleteReport(id: string, storagePath: string): Promise<boolean> {
        try {
            // Remove do Storage
            const { error: storageError } = await supabase.storage
                .from('member_reports')
                .remove([storagePath]);

            if (storageError) throw storageError;

            // Remove do DB
            const { error: dbError } = await supabase
                .from('member_reports')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;
            
            return true;
        } catch (error) {
            logger.error(`Error deleting report ${id}:`, error);
            return false;
        }
    }
}

export const reportService = new ReportService();
