// adminUserService.ts
// Serviço de administração para gerenciamento de usuários (bloqueio/desbloqueio)

import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'TEAM' | 'MEMBER';
    company: string | null;
    job_title: string | null;
    image_url: string | null;
    is_blocked: boolean;
    blocked_at: string | null;
    blocked_reason: string | null;
    blocked_by: string | null;
}

export interface BlockAuditLog {
    userId: string;
    adminId: string;
    action: 'BLOCK' | 'UNBLOCK';
    reason: string | null;
    timestamp: string;
}

class AdminUserService {
    /**
     * Verifica se o usuário atual tem permissão de admin
     */
    private async checkAdminRole(): Promise<{ isAdmin: boolean; adminId: string | null }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { isAdmin: false, adminId: null };

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return {
            isAdmin: profile?.role === 'ADMIN' || profile?.role === 'TEAM',
            adminId: user.id
        };
    }

    /**
     * Busca informações de um usuário específico
     */
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        const { isAdmin } = await this.checkAdminRole();
        if (!isAdmin) {
            throw new Error('Unauthorized: Only ADMIN/TEAM can view user details');
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, role, company, job_title, image_url, is_blocked, blocked_at, blocked_reason, blocked_by')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }

        return data as UserProfile;
    }

    /**
     * Bloqueia ou desbloqueia um usuário
     */
    async toggleUserBlock(userId: string, reason?: string): Promise<{ success: boolean; isBlocked: boolean; message: string }> {
        console.log('🔒 Admin: Toggling block status for user:', userId);

        const { isAdmin, adminId } = await this.checkAdminRole();
        if (!isAdmin || !adminId) {
            throw new Error('Unauthorized: Only ADMIN/TEAM can block users');
        }

        // Verificar status atual do usuário
        const { data: currentProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('is_blocked, role, name')
            .eq('id', userId)
            .single();

        if (fetchError || !currentProfile) {
            throw new Error('User not found');
        }

        // Não permitir bloquear outros admins
        if (currentProfile.role === 'ADMIN') {
            throw new Error('Cannot block another admin');
        }

        const isCurrentlyBlocked = currentProfile.is_blocked || false;
        const newBlockedStatus = !isCurrentlyBlocked;

        // Atualizar status de bloqueio
        const updateData: any = {
            is_blocked: newBlockedStatus
        };

        if (newBlockedStatus) {
            // Bloqueando
            updateData.blocked_at = new Date().toISOString();
            updateData.blocked_reason = reason || null;
            updateData.blocked_by = adminId;
        } else {
            // Desbloqueando
            updateData.blocked_at = null;
            updateData.blocked_reason = null;
            updateData.blocked_by = null;
        }

        console.log('📤 Admin: Updating user with data:', updateData);

        const { data: updateResult, error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select();

        console.log('📥 Admin: Update result:', updateResult);
        console.log('📥 Admin: Update error:', updateError);

        if (updateError) {
            console.error('❌ Error updating block status:', updateError);
            throw new Error('Failed to update block status: ' + updateError.message);
        }

        if (!updateResult || updateResult.length === 0) {
            console.error('❌ Update returned no rows - RLS may be blocking');
            throw new Error('Update failed: no rows affected. Check RLS policies on profiles table.');
        }

        // Log de auditoria (console)
        const action = newBlockedStatus ? 'BLOCKED' : 'UNBLOCKED';
        console.log(`📝 AUDIT: Admin ${adminId} ${action} user ${userId} (${currentProfile.name}) at ${new Date().toISOString()}${reason ? ` - Reason: ${reason}` : ''}`);

        return {
            success: true,
            isBlocked: newBlockedStatus,
            message: newBlockedStatus
                ? `Usuário "${currentProfile.name}" foi bloqueado`
                : `Usuário "${currentProfile.name}" foi desbloqueado`
        };
    }

    /**
     * Verifica se um usuário está bloqueado
     */
    async isUserBlocked(userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_blocked')
            .eq('id', userId)
            .single();

        if (error) return false;
        return data?.is_blocked || false;
    }

    /**
     * Lista todos os usuários bloqueados
     */
    async getBlockedUsers(): Promise<UserProfile[]> {
        const { isAdmin } = await this.checkAdminRole();
        if (!isAdmin) {
            throw new Error('Unauthorized');
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, role, company, job_title, image_url, is_blocked, blocked_at, blocked_reason, blocked_by')
            .eq('is_blocked', true)
            .order('blocked_at', { ascending: false });

        if (error) {
            console.error('Error fetching blocked users:', error);
            return [];
        }

        return data as UserProfile[];
    }
}

export const adminUserService = new AdminUserService();
