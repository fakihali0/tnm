/**
 * Role Refresh Hook
 * Provides utilities for refreshing user roles on demand
 */

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/integrations/supabase/client';

export function useRoleRefresh() {
  const user = useAuthStore(state => state.user);
  const setRoles = useCallback((roles: string[]) => {
    useAuthStore.setState({ roles });
  }, []);

  const refreshRoles = useCallback(async () => {
    if (!user) {
      console.warn('Cannot refresh roles: no user');
      return { success: false, error: 'No user logged in' };
    }

    try {
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      const roles = rolesData?.map(r => r.role) || [];
      setRoles(roles);

      console.log('Roles refreshed successfully:', roles);
      return { success: true, roles };
    } catch (error) {
      console.error('Failed to refresh roles:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [user, setRoles]);

  return {
    refreshRoles,
    isAdmin: useAuthStore(state => state.isAdmin()),
    hasRole: useAuthStore(state => state.hasRole),
    roles: useAuthStore(state => state.roles)
  };
}
