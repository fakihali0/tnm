import React, { useState, useEffect } from 'react';
import { LinkedAccount, useAccountStore } from '@/store/auth';
import { LinkedAccountCard } from './LinkedAccountCard';
import { AccountDetailsModal } from './AccountDetailsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Unlink, RefreshCw, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRTL } from '@/hooks/useRTL';
import { supabase } from '@/integrations/supabase/client';
import { useRealTradingData } from '@/hooks/useRealTradingData';

interface LinkedAccountsListProps {
  accounts: LinkedAccount[];
  selectedAccount: LinkedAccount | null;
  onSelectAccount: (account: LinkedAccount) => void;
}

export const LinkedAccountsList: React.FC<LinkedAccountsListProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
}) => {
  const rtl = useRTL();
  const { removeAccount, syncAccount, getAccountStatus, loadAccounts, syncingAccountId, setDefaultAccount } = useAccountStore();
  const { toast } = useToast();
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);
  const [detailsAccount, setDetailsAccount] = useState<LinkedAccount | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Realtime subscription for account updates (AC5)
  useEffect(() => {
    const channel = supabase
      .channel('trading_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trading_accounts',
        },
        (payload) => {
          console.log('Account change detected:', payload);
          // Reload accounts when changes detected
          loadAccounts();
        }
      )
      .subscribe();

    // Fallback polling every 30s if realtime fails
    const pollInterval = setInterval(() => {
      loadAccounts();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [loadAccounts]);

  const handleUnlinkAccount = async (accountId: string) => {
    setUnlinkingAccountId(accountId);
    try {
      const result = await removeAccount(accountId);
      
      if (result.success) {
        toast({
          title: "Account Unlinked",
          description: "Trading account has been successfully unlinked.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to unlink account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUnlinkingAccountId(null);
    }
  };

  const handleSyncAccount = async (accountId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Show syncing toast
    const syncToastId = toast({
      title: "Syncing...",
      description: "Account sync in progress. This may take 10-15 seconds.",
      duration: 20000, // Keep toast visible during sync
    });
    
    try {
      const result = await syncAccount(accountId);
      
      // Dismiss syncing toast
      syncToastId.dismiss();
      
      if (result.success) {
        // Force refresh positions for the synced account
        const { refreshData } = useRealTradingData.getState();
        await refreshData();
        
        toast({
          title: "Sync Complete",
          description: "Account data has been synchronized successfully.",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync account data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      syncToastId.dismiss();
      toast({
        title: "Error",
        description: "An unexpected error occurred during sync.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (account: LinkedAccount, event: React.MouseEvent) => {
    event.stopPropagation();
    setDetailsAccount(account);
    setIsDetailsModalOpen(true);
  };

  const handleSetDefault = async (accountId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const result = await setDefaultAccount(accountId);
      
      if (result.success) {
        toast({
          title: "Default Account Set",
          description: "This account will now be used for positions display.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to set default account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="card-enhanced" dir={rtl.dir}>
        <CardHeader>
          <CardTitle className="text-start">Linked Trading Accounts</CardTitle>
          <CardDescription className="text-start">
            Manage your connected MT4/MT5 trading accounts • Live sync enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => {
              const accountStatus = getAccountStatus(account.id);
              const isSyncing = syncingAccountId === account.id;
              
              return (
                <div key={account.id} className="relative group">
                  <LinkedAccountCard
                    account={account}
                    isSelected={selectedAccount?.id === account.id}
                    onSelect={() => onSelectAccount(account)}
                    lastSync={accountStatus.lastSync}
                    syncError={accountStatus.error}
                    isSyncing={isSyncing}
                    onViewDetails={() => handleViewDetails(account, {} as React.MouseEvent)}
                  />
                  
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                    {/* Set as Default Button */}
                    {!account.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 bg-background shadow-sm"
                        onClick={(e) => handleSetDefault(account.id, e)}
                        title="Set as default account for positions"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Sync Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 bg-background shadow-sm"
                      onClick={(e) => handleSyncAccount(account.mt5_service_account_id, e)}
                      disabled={isSyncing}
                      title="Refresh account data"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    {/* Unlink Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 shadow-sm"
                          disabled={unlinkingAccountId === account.id}
                          title="Disconnect account"
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect Trading Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to disconnect this {account.platform} account (Login: {account.login})? 
                            This will remove all associated data and cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUnlinkAccount(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={unlinkingAccountId === account.id}
                          >
                            {unlinkingAccountId === account.id ? "Disconnecting..." : "Disconnect Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Account Details Modal */}
      <AccountDetailsModal
        account={detailsAccount}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </>
  );
};