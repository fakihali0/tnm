import React, { useState } from 'react';
import { LinkedAccount, useAccountStore } from '@/store/auth';
import { LinkedAccountCard } from './LinkedAccountCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Unlink, Info } from 'lucide-react';
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
  const { removeAccount } = useAccountStore();
  const { toast } = useToast();
  const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);

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
        <Alert className="mb-4 border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Live synchronization is temporarily disabled. Existing account data remains accessible.
          </AlertDescription>
        </Alert>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="relative group">
              <LinkedAccountCard
                account={account}
                isSelected={selectedAccount?.id === account.id}
                onSelect={() => onSelectAccount(account)}
              />
              
              {/* Unlink Button */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 w-8 p-0"
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};