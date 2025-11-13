import React, { useState } from 'react';
import { LinkedAccount, useAccountStore } from '@/store/auth';
import { LinkedAccountCard } from './LinkedAccountCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Unlink, Info, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRTL } from '@/hooks/useRTL';

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
  const { removeAccount, syncAccount, getAccountStatus } = useAccountStore();
  const { toast } = useToast();
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);

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
    setSyncingAccountId(accountId);
    try {
      const result = await syncAccount(accountId);
      
      if (result.success) {
        toast({
          title: "Sync Successful",
          description: "Account data has been synchronized.",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync account data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during sync.",
        variant: "destructive",
      });
    } finally {
      setSyncingAccountId(null);
    }
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <Card className="card-enhanced" dir={rtl.dir}>
      <CardHeader>
        <CardTitle className="text-start">Linked Trading Accounts</CardTitle>
        <CardDescription className="text-start">
          Manage your connected MT4/MT5 trading accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const accountStatus = getAccountStatus(account.id);
            return (
            <div key={account.id} className="relative group">
              <LinkedAccountCard
                account={account}
                isSelected={selectedAccount?.id === account.id}
                onSelect={() => onSelectAccount(account)}
                lastSync={accountStatus.lastSync}
                syncError={accountStatus.error}
              />
              
              {/* Action Buttons */}
              <div className="absolute top-2 right-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                {/* Sync Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background shadow-sm"
                  onClick={(e) => handleSyncAccount(account.id, e)}
                  disabled={syncingAccountId === account.id}
                >
                  <RefreshCw className={`h-4 w-4 ${syncingAccountId === account.id ? 'animate-spin' : ''}`} />
                </Button>
                
                {/* Unlink Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0 shadow-sm"
                      disabled={unlinkingAccountId === account.id}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unlink Trading Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to unlink this {account.platform} account (Login: {account.login})? 
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
                        {unlinkingAccountId === account.id ? "Unlinking..." : "Unlink Account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )})}
        </div>
      </CardContent>
    </Card>
  );
};