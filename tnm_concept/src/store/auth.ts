import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { adaptLinkedAccount, adaptTrade, adaptJournalSummary } from '@/utils/database-adapters';
import { logAuth, logError } from '@/utils/logger';
import { Trade } from '@/types/trading';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  country?: string;
  countryCode?: string;
  phoneVerified?: boolean;
  roles?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  profileCache: Map<string, { data: User; timestamp: number }>;
  roles: string[];
  isAdmin: () => boolean;
  hasRole: (role: string) => boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, firstName?: string, lastName?: string, country?: string, countryCode?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setSession: (session: Session | null) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      session: null,
      isLoading: true,
      profileCache: new Map(),
      roles: [],
      
      isAdmin: () => {
        return get().roles.includes('admin');
      },
      
      hasRole: (role: string) => {
        return get().roles.includes(role);
      },

      refreshRoles: async () => {
        const state = get();
        if (!state.user) return;
        
        try {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', state.user.id);
          
          const roles = rolesData?.map(r => r.role) || [];
          set({ roles });
          
          // Update user object with refreshed roles
          if (state.user) {
            const updatedUser = { ...state.user, roles };
            state.profileCache.set(state.user.id, {
              data: updatedUser,
              timestamp: Date.now()
            });
            set({ user: updatedUser });
          }
          
          console.log('Roles refreshed successfully');
        } catch (error) {
          console.error('Failed to refresh roles:', error);
        }
      },

      initialize: async () => {
        try {
          // Clean up any existing subscription to avoid duplicates
          const currentSubscription = (get() as any).authSubscription;
          if (currentSubscription) {
            currentSubscription.unsubscribe();
          }

          // Set up auth state listener - MUST be synchronous to avoid deadlocks
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            // Use setTimeout(0) to defer Supabase calls out of the callback
            setTimeout(() => {
              get().setSession(session);
            }, 0);
          });

          // Store subscription for cleanup
          (set as any)({ authSubscription: subscription });

          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            get().setSession(session);
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          logError('Auth initialization error', error, { feature: 'auth' });
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          // Fast-path: immediately set session if available
          if (data.session) {
            get().setSession(data.session);
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      signup: async (email: string, password: string, firstName?: string, lastName?: string, country?: string, countryCode?: string, phone?: string) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                first_name: firstName || '',
                last_name: lastName || '',
                country: country || '',
                country_code: countryCode || '',
                mobile_number: phone || '',
              },
            },
          });

          if (error) {
            return { success: false, error: error.message };
          }

          // Update profile with terms acceptance timestamp
          if (data.user) {
            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({ 
                terms_accepted_at: new Date().toISOString() 
              })
              .eq('user_id', data.user.id);
              
            if (profileUpdateError) {
              logError('Failed to update terms acceptance', profileUpdateError, { feature: 'auth' });
              // Don't fail signup, but log the error
            }
          }

          return { success: true };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        try {
          // Clean up subscription on logout
          const currentSubscription = (get() as any).authSubscription;
          if (currentSubscription) {
            currentSubscription.unsubscribe();
          }
          
          // Sign out from Supabase (ignore errors - session might be expired)
          await supabase.auth.signOut({ scope: 'global' });
        } catch (error) {
          logError('Logout error (ignored)', error, { feature: 'auth' });
        } finally {
          // Always clear auth state and redirect, regardless of signOut success
          set({
            user: null,
            isAuthenticated: false,
            session: null,
            roles: [],
          });
          
          // Clear other store data on logout (stores will auto-clear via their own logic)
          
          // Show success notification
          if (typeof window !== 'undefined') {
            // Use toast if available
            try {
              const { toast } = await import('@/hooks/use-toast');
              toast({
                title: "Signed out successfully",
                description: "You have been logged out of your account",
              });
            } catch {
              // Fallback notification
              console.log('User successfully signed out');
            }
          }
          
          // Redirect to home page
          window.location.href = '/';
        }
      },

      requestPasswordReset: async (email: string) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (error) {
            // Don't reveal if email exists (security best practice)
            logError('Password reset request error', error, { feature: 'auth' });
          }

          // Always return success to prevent email enumeration attacks
          return { success: true };
        } catch (error: any) {
          logError('Password reset request error', error, { feature: 'auth' });
          return { success: true }; // Security: Don't reveal errors
        }
      },

      resetPassword: async (newPassword: string) => {
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) {
            return { success: false, error: error.message };
          }

          logAuth('Password reset successful');
          return { success: true };
        } catch (error: any) {
          logError('Password reset error', error, { feature: 'auth' });
          return { success: false, error: error.message };
        }
      },

      setSession: async (session: Session | null) => {
        logAuth('Session update initiated', { hasSession: !!session });
        
        if (session?.user) {
          try {
            const userId = session.user.id;
            const now = Date.now();
            const cacheExpiry = 5 * 60 * 1000; // 5 minutes
            const cache = get().profileCache;
            
            // Check cache first
            const cached = cache.get(userId);
            let user: User;
            
            if (cached && (now - cached.timestamp) < cacheExpiry) {
              logAuth('Using cached profile', undefined, userId);
              user = cached.data;
            } else {
              logAuth('Fetching user profile', undefined, userId);
              // Fetch user profile
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

              if (error) {
                logError('Profile fetch failed', error, { feature: 'auth', userId });
                // Even if profile fetch fails, we can still authenticate with basic user data
              }

              // SECURITY: Fetch user roles for authorization
              const { data: rolesData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId);
              
              const roles = rolesData?.map(r => r.role) || [];

              user = {
                id: userId,
                email: session.user.email!,
                firstName: profile?.first_name || '',
                lastName: profile?.last_name || '',
                avatar: profile?.avatar_url,
                country: profile?.country,
                countryCode: profile?.country_code,
                phoneVerified: profile?.phone_verified,
                roles,
              };
              
              // Update cache
              cache.set(userId, { data: user, timestamp: now });
            }

            logAuth('User authenticated successfully', undefined, user.id);
            set({
              isAuthenticated: true,
              user,
              session,
              isLoading: false,
              profileCache: cache,
              roles: user.roles || [],
            });

            // Optimized translation preloading - non-blocking
            if (typeof window !== 'undefined') {
              setTimeout(async () => {
                try {
                  const currentPath = window.location.pathname;
                  const language = currentPath.startsWith('/ar') ? 'ar' : 'en';
                  
                  const { preloadRouteTranslations } = await import('../i18n/dynamic-loader');
                  await preloadRouteTranslations(currentPath, language);
                } catch (error) {
                  // Silent fail - translations will load on-demand
                }
              }, 100);
            }

          } catch (error) {
            logError('Authentication error in setSession', error, { feature: 'auth' });
            // Fallback: set basic auth state even if profile fetch fails
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              firstName: '',
              lastName: '',
            };
            
            set({
              isAuthenticated: true,
              user,
              roles: [],
              session,
              isLoading: false,
            });
          }
        } else {
          logAuth('Clearing authentication state');
          set({
            isAuthenticated: false,
            user: null,
            session: null,
            isLoading: false,
          });
          // Stores will auto-clear via their own subscription logic
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        session: state.session,
      }),
    }
  )
);

// Trading Account Management
export interface LinkedAccount {
  id: string;
  user_id: string;
  platform: 'MT4' | 'MT5';
  broker_name: string;
  server: string;
  login_number: string;
  account_name?: string;
  balance?: number;
  equity?: number;
  margin?: number;
  free_margin?: number;
  margin_level?: number;
  currency: string;
  leverage?: number;
  is_active: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
  
  // Legacy compatibility properties
  login: string;
  freeMargin?: number;
  createdAt: string;
}

interface AccountState {
  accounts: LinkedAccount[];
  selectedAccount: LinkedAccount | null;
  isConnecting: boolean;
  isLoading: boolean;
  lastSyncTime: Record<string, Date>;
  syncErrors: Record<string, string>;
  addAccount: (account: { platform: 'MT4' | 'MT5'; broker_name: string; server: string; login_number: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  updateAccount: (accountId: string, updates: Partial<LinkedAccount>) => void;
  removeAccount: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  syncAccount: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  refreshAccountData: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  getAccountStatus: (accountId: string) => { lastSync?: Date; error?: string; isActive: boolean };
  setSelectedAccount: (account: LinkedAccount | null) => void;
  loadAccounts: () => Promise<void>;
  clearAccounts: () => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  selectedAccount: null,
  isConnecting: false,
  isLoading: false,
  lastSyncTime: {},
  syncErrors: {},

  loadAccounts: async () => {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated) return;

    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('trading_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allAccounts = (data || []).map(adaptLinkedAccount);
      
      set({ 
        accounts: allAccounts,
        selectedAccount: allAccounts[0] || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading accounts:', error);
      set({ isLoading: false });
    }
  },

  addAccount: async (accountData) => {
    try {
      set({ isConnecting: true });

      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('connect-mt5-account', {
        body: {
          broker_name: accountData.broker_name,
          server: accountData.server,
          login: accountData.login_number,
          password: accountData.password,
          platform: accountData.platform,
        },
      });

      if (error) {
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to connect MT5 account');
      }

      // Reload accounts to include the newly added one
      await get().loadAccounts();

      set({ isConnecting: false });
      return { success: true };
    } catch (error: any) {
      console.error('Error adding account:', error);
      set({ isConnecting: false });
      return { 
        success: false, 
        error: error.message || 'Failed to connect account. Please check your credentials.' 
      };
    }
  },

  updateAccount: (accountId: string, updates: Partial<LinkedAccount>) => {
    set(state => ({
      accounts: state.accounts.map(account =>
        account.id === accountId ? { ...account, ...updates } : account
      ),
      selectedAccount: state.selectedAccount?.id === accountId
        ? { ...state.selectedAccount, ...updates }
        : state.selectedAccount,
    }));
  },

  setSelectedAccount: (account: LinkedAccount | null) => {
    set({ selectedAccount: account });
  },

  removeAccount: async (accountId: string) => {
    try {
      const { error } = await supabase
        .from('trading_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      set(state => {
        const updatedAccounts = state.accounts.filter(account => account.id !== accountId);
        const newSelectedAccount = state.selectedAccount?.id === accountId 
          ? (updatedAccounts[0] || null) 
          : state.selectedAccount;
        
        // Remove sync state for deleted account
        const { [accountId]: removedSync, ...remainingSyncTime } = state.lastSyncTime;
        const { [accountId]: removedError, ...remainingSyncErrors } = state.syncErrors;
        
        return {
          accounts: updatedAccounts,
          selectedAccount: newSelectedAccount,
          lastSyncTime: remainingSyncTime,
          syncErrors: remainingSyncErrors,
        };
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  syncAccount: async (accountId: string) => {
    try {
      // Clear previous error
      set(state => ({
        syncErrors: { ...state.syncErrors, [accountId]: '' }
      }));

      console.log('🔄 Calling sync-trading-data edge function with account_id:', accountId);

      // Call the sync edge function
      const { data, error } = await supabase.functions.invoke('sync-trading-data', {
        body: { account_id: accountId }
      });

      console.log('📦 Edge function response:', { data, error });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || data?.message || 'Failed to sync account data';
        console.error('❌ Edge function returned failure:', data);
        console.log('📊 Sync details:', {
          executionId: data?.executionId,
          totalAccounts: data?.totalAccounts,
          syncResults: data?.syncResults,
          message: data?.message
        });
        throw new Error(errorMsg);
      }

      console.log('✅ Sync successful, data:', data);
      console.log('📊 Sync summary:', {
        executionId: data.executionId,
        totalAccounts: data.totalAccounts,
        successCount: data.successCount,
        failureCount: data.failureCount,
        syncResults: data.syncResults
      });

      // Update last sync time
      set(state => ({
        lastSyncTime: { ...state.lastSyncTime, [accountId]: new Date() }
      }));

      // Reload accounts to get fresh data
      await get().loadAccounts();

      return { success: true };
    } catch (error: any) {
      console.error('❌ Error syncing account:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        raw: error
      });
      set(state => ({
        syncErrors: { ...state.syncErrors, [accountId]: error.message }
      }));
      return { 
        success: false, 
        error: error.message || 'Failed to sync account data' 
      };
    }
  },

  refreshAccountData: async (accountId: string) => {
    // Alias for syncAccount for convenience
    return get().syncAccount(accountId);
  },

  getAccountStatus: (accountId: string) => {
    const state = get();
    const account = state.accounts.find(acc => acc.id === accountId);
    
    return {
      lastSync: state.lastSyncTime[accountId],
      error: state.syncErrors[accountId],
      isActive: account?.is_active ?? false
    };
  },

  clearAccounts: () => {
    set({
      accounts: [],
      selectedAccount: null,
      isConnecting: false,
      isLoading: false,
      lastSyncTime: {},
      syncErrors: {},
    });
  },
}));

// Trading Journal Data Management - Import from unified types
// Trade interface is now imported from '@/types/trading'

export interface JournalSummary {
  winRate: number;
  profitFactor: number;
  avgRR: number;
  avgWin: number;
  avgLoss: number;
  netPL: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  streak: { wins: number; losses: number };
}

export interface SavedView {
  id: string;
  name: string;
  filters: {
    dateRange: [Date | null, Date | null];
    symbol: string | null;
    result: 'all' | 'wins' | 'losses';
    strategy: string | null;
  };
  createdAt: string;
}

interface JournalState {
  trades: Trade[];
  summary: JournalSummary | null;
  isLoading: boolean;
  filters: {
    dateRange: [Date | null, Date | null];
    symbol: string | null;
    result: 'all' | 'wins' | 'losses';
    strategy: string | null;
  };
  savedViews: SavedView[];
  selectedStrategy: string | null;
  loadTrades: (accountId: string) => Promise<void>;
  loadSummary: (accountId: string) => Promise<void>;
  addTrade: (trade: { symbol: string; direction: 'BUY' | 'SELL'; volume: number; entry_price: number; opened_at: string; [key: string]: any }) => Promise<{ success: boolean; error?: string }>;
  updateTrade: (tradeId: string, updates: Partial<Trade>) => Promise<{ success: boolean; error?: string }>;
  deleteTrade: (tradeId: string) => Promise<{ success: boolean; error?: string }>;
  setFilters: (filters: Partial<JournalState['filters']>) => void;
  setSelectedStrategy: (strategy: string | null) => void;
  saveView: (name: string, filters: JournalState['filters']) => void;
  loadView: (view: SavedView) => void;
  deleteView: (viewId: string) => void;
  updateView: (viewId: string, name: string) => void;
  clearData: () => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  trades: [],
  summary: null,
  isLoading: false,
  filters: {
    dateRange: [null, null],
    symbol: null,
    result: 'all',
    strategy: null,
  },
  savedViews: [],
  selectedStrategy: null,

  loadTrades: async (accountId: string) => {
    console.log('📥 Loading trades from database for account:', accountId);
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', accountId)
        .order('opened_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading trades:', error);
        throw error;
      }

      console.log('✅ Trades loaded from database:', {
        count: data?.length || 0,
        rawData: data,
        firstTrade: data?.[0]
      });

      const adaptedTrades = (data || []).map(adaptTrade);
      console.log('✅ Trades adapted:', {
        count: adaptedTrades.length,
        firstAdapted: adaptedTrades[0]
      });

      set({ 
        trades: adaptedTrades,
        isLoading: false 
      });
    } catch (error) {
      console.error('❌ Error loading trades:', error);
      set({ isLoading: false, trades: [] });
    }
  },

  loadSummary: async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from('journal_summaries')
        .select('*')
        .eq('account_id', accountId)
        .order('period_end', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      set({ summary: data ? adaptJournalSummary(data) : null });
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  },

  addTrade: async (tradeData) => {
    const accountStore = useAccountStore.getState();
    if (!accountStore.selectedAccount) {
      return { success: false, error: 'No account selected' };
    }

    try {
      const { data, error } = await supabase
        .from('trades')
        .insert([{
          account_id: accountStore.selectedAccount.id,
          ...tradeData,
        }])
        .select()
        .single();

      if (error) throw error;

      const adaptedTrade = adaptTrade(data);
      set(state => ({
        trades: [adaptedTrade, ...state.trades],
      }));

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateTrade: async (tradeId: string, updates: Partial<Trade>) => {
    try {
      const { data, error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', tradeId)
        .select()
        .single();

      if (error) throw error;

      const adaptedTrade = adaptTrade(data);
      set(state => ({
        trades: state.trades.map(trade =>
          trade.id === tradeId ? adaptedTrade : trade
        ),
      }));

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  deleteTrade: async (tradeId: string) => {
    try {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', tradeId);

      if (error) throw error;

      set(state => ({
        trades: state.trades.filter(trade => trade.id !== tradeId),
      }));

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  setSelectedStrategy: (strategy: string | null) => {
    set({ selectedStrategy: strategy });
  },

  saveView: (name: string, filters: JournalState['filters']) => {
    const newView: SavedView = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };
    
    set(state => ({
      savedViews: [...state.savedViews, newView]
    }));
  },

  loadView: (view: SavedView) => {
    set({ filters: view.filters });
  },

  deleteView: (viewId: string) => {
    set(state => ({
      savedViews: state.savedViews.filter(view => view.id !== viewId)
    }));
  },

  updateView: (viewId: string, name: string) => {
    set(state => ({
      savedViews: state.savedViews.map(view =>
        view.id === viewId ? { ...view, name } : view
      )
    }));
  },

  clearData: () => {
    set({
      trades: [],
      summary: null,
      isLoading: false,
      savedViews: [],
      selectedStrategy: null,
    });
  },
}));

// Store journal store reference for cross-store access using window (browser global)
// Use setTimeout to avoid circular dependency during initial load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    (window as any).journalStoreRef = useJournalStore;
  }, 0);
}