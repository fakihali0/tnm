import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAccountStore } from '../auth';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

// Mock useAuthStore to always return authenticated state
vi.mock('../auth', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useAuthStore: {
      getState: vi.fn(() => ({
        isAuthenticated: true,
        user: { id: 'test-user-id', email: 'test@example.com' },
      })),
    },
  };
});

describe('useAccountStore - Account Management', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAccountStore.setState({
      accounts: [],
      selectedAccount: null,
      isConnecting: false,
      isLoading: false,
      lastSyncTime: {},
      syncErrors: {},
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadAccounts', () => {
    it('should load accounts successfully', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          user_id: 'test-user-id',
          platform: 'MT5',
          broker_name: 'TestBroker',
          server: 'TestServer',
          login_number: '12345',
          account_name: 'Test Account',
          balance: 10000,
          equity: 10500,
          currency: 'USD',
          is_active: true,
          connection_status: 'connected',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockAccounts,
          error: null,
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await useAccountStore.getState().loadAccounts();

      // Verify the select was called
      expect(mockSelect).toHaveBeenCalledWith('*');

      const state = useAccountStore.getState();
      expect(state.accounts.length).toBeGreaterThan(0);
      expect(state.isLoading).toBe(false);
    });

    it('should handle empty account list', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      await useAccountStore.getState().loadAccounts();

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(0);
      expect(state.selectedAccount).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockRejectedValue(new Error('Database error')),
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      await useAccountStore.getState().loadAccounts();

      const state = useAccountStore.getState();
      expect(state.isLoading).toBe(false);
      // Error should be logged
      expect(mockSelect).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('addAccount - AC1', () => {
    it('should successfully add an MT5 account', async () => {
      // Mock auth session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            user: { id: 'test-user-id' },
          } as any,
        },
        error: null,
      });

      // Mock successful edge function response
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          account_id: 'new-account-id',
        },
        error: null,
      });

      // Mock loadAccounts to simulate refresh
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{
              id: 'new-account-id',
              platform: 'MT5',
              broker_name: 'TestBroker',
              server: 'TestServer',
              login_number: '12345',
              is_active: true,
              connection_status: 'connected',
              currency: 'USD',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            }],
            error: null,
          }),
        }),
      } as any);

      const result = await useAccountStore.getState().addAccount({
        platform: 'MT5',
        broker_name: 'TestBroker',
        server: 'TestServer',
        login_number: '12345',
        password: 'test-password',
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(supabase.functions.invoke).toHaveBeenCalledWith('connect-mt5-account', {
        body: {
          broker_name: 'TestBroker',
          server: 'TestServer',
          login: '12345',
          password: 'test-password',
          platform: 'MT5',
        },
      });

      const state = useAccountStore.getState();
      expect(state.isConnecting).toBe(false);
    });

    it('should handle authentication errors', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error('Not authenticated'),
      });

      const result = await useAccountStore.getState().addAccount({
        platform: 'MT5',
        broker_name: 'TestBroker',
        server: 'TestServer',
        login_number: '12345',
        password: 'test-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(useAccountStore.getState().isConnecting).toBe(false);
    });

    it('should handle edge function errors', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            user: { id: 'test-user-id' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: new Error('Connection failed'),
      });

      const result = await useAccountStore.getState().addAccount({
        platform: 'MT5',
        broker_name: 'TestBroker',
        server: 'TestServer',
        login_number: '12345',
        password: 'test-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(useAccountStore.getState().isConnecting).toBe(false);
    });

    it('should handle MT5 validation errors', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            user: { id: 'test-user-id' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: false,
          error: 'Invalid credentials',
        },
        error: null,
      });

      const result = await useAccountStore.getState().addAccount({
        platform: 'MT5',
        broker_name: 'TestBroker',
        server: 'TestServer',
        login_number: '12345',
        password: 'wrong-password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should set isConnecting flag during connection', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            user: { id: 'test-user-id' },
          } as any,
        },
        error: null,
      });

      let isConnectingDuringCall = false;
      vi.mocked(supabase.functions.invoke).mockImplementation(async () => {
        isConnectingDuringCall = useAccountStore.getState().isConnecting;
        return {
          data: { success: true },
          error: null,
        };
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      await useAccountStore.getState().addAccount({
        platform: 'MT5',
        broker_name: 'TestBroker',
        server: 'TestServer',
        login_number: '12345',
        password: 'test-password',
      });

      expect(isConnectingDuringCall).toBe(true);
      expect(useAccountStore.getState().isConnecting).toBe(false);
    });
  });

  describe('syncAccount - AC2', () => {
    beforeEach(() => {
      useAccountStore.setState({
        accounts: [{
          id: 'account-1',
          user_id: 'test-user-id',
          platform: 'MT5',
          broker_name: 'TestBroker',
          server: 'TestServer',
          login_number: '12345',
          login: '12345',
          currency: 'USD',
          is_active: true,
          connection_status: 'connected',
          createdAt: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }],
        selectedAccount: null,
      });
    });

    it('should successfully sync account data', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: true,
          executionId: 'test-exec-id',
          totalAccounts: 1,
          successCount: 1,
          failureCount: 0,
        },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [{
              id: 'account-1',
              equity: 11000, // Updated equity
              balance: 10000,
              platform: 'MT5',
              is_active: true,
              connection_status: 'connected',
              currency: 'USD',
              broker_name: 'TestBroker',
              server: 'TestServer',
              login_number: '12345',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            }],
            error: null,
          }),
        }),
      } as any);

      const result = await useAccountStore.getState().syncAccount('account-1');

      expect(result.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('sync-trading-data', {
        body: { account_id: 'account-1' },
      });

      const state = useAccountStore.getState();
      expect(state.lastSyncTime['account-1']).toBeInstanceOf(Date);
      expect(state.syncErrors['account-1']).toBe('');

      consoleSpy.mockRestore();
    });

    it('should handle sync failures and update syncErrors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: false,
          error: 'MT5 connection timeout',
        },
        error: null,
      });

      const result = await useAccountStore.getState().syncAccount('account-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('MT5 connection timeout');

      const state = useAccountStore.getState();
      expect(state.syncErrors['account-1']).toBe('MT5 connection timeout');
      expect(state.lastSyncTime['account-1']).toBeUndefined();

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should clear previous errors before syncing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Set initial error
      useAccountStore.setState({
        syncErrors: { 'account-1': 'Previous error' },
      });

      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      await useAccountStore.getState().syncAccount('account-1');

      // Error should be cleared
      expect(useAccountStore.getState().syncErrors['account-1']).toBe('');
      
      consoleSpy.mockRestore();
    });
  });

  describe('removeAccount (deleteAccount) - AC2', () => {
    beforeEach(() => {
      useAccountStore.setState({
        accounts: [
          {
            id: 'account-1',
            user_id: 'test-user-id',
            platform: 'MT5',
            broker_name: 'TestBroker',
            server: 'TestServer',
            login_number: '12345',
            login: '12345',
            currency: 'USD',
            is_active: true,
            connection_status: 'connected',
            createdAt: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 'account-2',
            user_id: 'test-user-id',
            platform: 'MT5',
            broker_name: 'TestBroker2',
            server: 'TestServer2',
            login_number: '67890',
            login: '67890',
            currency: 'USD',
            is_active: true,
            connection_status: 'connected',
            createdAt: '2024-01-02T00:00:00Z',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
          },
        ],
        selectedAccount: {
          id: 'account-1',
          user_id: 'test-user-id',
          platform: 'MT5',
          broker_name: 'TestBroker',
          server: 'TestServer',
          login_number: '12345',
          login: '12345',
          currency: 'USD',
          is_active: true,
          connection_status: 'connected',
          createdAt: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        lastSyncTime: { 'account-1': new Date(), 'account-2': new Date() },
        syncErrors: { 'account-1': 'Some error', 'account-2': '' },
      });
    });

    it('should successfully delete an account', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      const result = await useAccountStore.getState().removeAccount('account-1');

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('trading_accounts');

      const state = useAccountStore.getState();
      expect(state.accounts).toHaveLength(1);
      expect(state.accounts[0].id).toBe('account-2');
      expect(state.selectedAccount?.id).toBe('account-2');
      expect(state.lastSyncTime['account-1']).toBeUndefined();
      expect(state.syncErrors['account-1']).toBeUndefined();
    });

    it('should handle deletion errors', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      } as any);

      const result = await useAccountStore.getState().removeAccount('account-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(useAccountStore.getState().accounts).toHaveLength(2);
    });

    it('should clear sync state when deleting account', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await useAccountStore.getState().removeAccount('account-1');

      const state = useAccountStore.getState();
      expect(state.lastSyncTime['account-1']).toBeUndefined();
      expect(state.syncErrors['account-1']).toBeUndefined();
      expect(state.lastSyncTime['account-2']).toBeDefined();
      expect(state.syncErrors['account-2']).toBe('');
    });
  });

  describe('refreshAccountData - AC2', () => {
    it('should be an alias for syncAccount', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const result = await useAccountStore.getState().refreshAccountData('account-1');

      expect(result.success).toBe(true);
      expect(supabase.functions.invoke).toHaveBeenCalledWith('sync-trading-data', {
        body: { account_id: 'account-1' },
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('getAccountStatus - AC2, AC3', () => {
    beforeEach(() => {
      const now = new Date();
      useAccountStore.setState({
        accounts: [{
          id: 'account-1',
          user_id: 'test-user-id',
          platform: 'MT5',
          broker_name: 'TestBroker',
          server: 'TestServer',
          login_number: '12345',
          login: '12345',
          currency: 'USD',
          is_active: true,
          connection_status: 'connected',
          createdAt: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }],
        lastSyncTime: { 'account-1': now },
        syncErrors: { 'account-1': 'Connection timeout' },
      });
    });

    it('should return account status with sync info', () => {
      const status = useAccountStore.getState().getAccountStatus('account-1');

      expect(status.isActive).toBe(true);
      expect(status.lastSync).toBeInstanceOf(Date);
      expect(status.error).toBe('Connection timeout');
    });

    it('should handle missing account', () => {
      const status = useAccountStore.getState().getAccountStatus('non-existent');

      expect(status.isActive).toBe(false);
      expect(status.lastSync).toBeUndefined();
      expect(status.error).toBeUndefined();
    });
  });

  describe('State Management - AC3', () => {
    it('should maintain lastSyncTime state correctly', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: { success: true },
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const beforeSync = Date.now();
      await useAccountStore.getState().syncAccount('account-1');
      const afterSync = Date.now();

      const syncTime = useAccountStore.getState().lastSyncTime['account-1'];
      expect(syncTime).toBeInstanceOf(Date);
      expect(syncTime!.getTime()).toBeGreaterThanOrEqual(beforeSync);
      expect(syncTime!.getTime()).toBeLessThanOrEqual(afterSync);
      
      consoleSpy.mockRestore();
    });

    it('should maintain syncErrors state correctly', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: {
          success: false,
          error: 'Specific error message',
        },
        error: null,
      });

      await useAccountStore.getState().syncAccount('account-1');

      expect(useAccountStore.getState().syncErrors['account-1']).toBe('Specific error message');
      
      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should maintain isConnecting flag correctly', () => {
      useAccountStore.setState({ isConnecting: true });
      expect(useAccountStore.getState().isConnecting).toBe(true);

      useAccountStore.setState({ isConnecting: false });
      expect(useAccountStore.getState().isConnecting).toBe(false);
    });
  });

  describe('Error Handling - AC4', () => {
    it('should always return structured response objects', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('Test error')),
        }),
      } as any);

      const result = await useAccountStore.getState().removeAccount('account-1');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.error).toBe('string');
      
      consoleSpy.mockRestore();
    });

    it('should reset isConnecting flag even on error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: {
          session: {
            access_token: 'test-token',
            user: { id: 'test-user-id' },
          } as any,
        },
        error: null,
      });

      vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('Network error'));

      await useAccountStore.getState().addAccount({
        platform: 'MT5',
        broker_name: 'TestBroker',
        server: 'TestServer',
        login_number: '12345',
        password: 'test-password',
      });

      expect(useAccountStore.getState().isConnecting).toBe(false);
    });
  });
});
