import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccountStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Plug, Server, Key, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRTL } from '@/hooks/useRTL';
import { BROKERS, getBrokersByPlatform, getServersByBroker, extractBrokerName } from '@/config/brokers';
import { supabase } from '@/integrations/supabase/client';

export const AccountLinkForm: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { loadAccounts } = useAccountStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; accountData?: any } | null>(null);
  const [formData, setFormData] = useState({
    platform: '' as 'MT4' | 'MT5' | '',
    brokerId: '',
    server: '',
    login: '',
    investorPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.platform) {
      newErrors.platform = 'Platform is required';
    }

    if (!formData.brokerId) {
      newErrors.brokerId = 'Broker is required';
    }

    if (!formData.server) {
      newErrors.server = 'Server is required';
    }

    if (!formData.login) {
      newErrors.login = 'Login number is required';
    } else if (!/^\d+$/.test(formData.login)) {
      newErrors.login = 'Login must be a positive integer';
    }

    if (!formData.investorPassword) {
      newErrors.investorPassword = 'Password is required';
    } else if (formData.investorPassword.length < 6) {
      newErrors.investorPassword = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Test MT5 connection without saving to database
   * AC:3 - Calls connect-mt5-account via Supabase functions invoke
   */
  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing MT5 connection...', {
        platform: formData.platform,
        server: formData.server,
        login: formData.login,
      });

      // Get broker name from selected broker
      const brokerName = extractBrokerName(formData.server);

      // Call Supabase edge function (Story 4.1)
      const { data, error } = await supabase.functions.invoke('connect-mt5-account', {
        body: {
          broker_name: brokerName,
          server: formData.server,
          login: formData.login,
          password: formData.investorPassword,
          platform: formData.platform,
          test_only: true, // Don't save to DB
        },
      });

      console.log('📦 Test connection response:', { data, error });

      if (error) {
        console.error('❌ Test connection error:', error);
        setTestResult({
          success: false,
          message: error.message || 'Connection test failed',
        });
        toast({
          variant: 'destructive',
          title: 'Connection Test Failed',
          description: error.message || 'Failed to connect. Please check your credentials.',
        });
        return;
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || data?.message || 'Connection test failed';
        console.error('❌ Test returned failure:', data);
        setTestResult({
          success: false,
          message: errorMsg,
        });
        toast({
          variant: 'destructive',
          title: 'Connection Test Failed',
          description: errorMsg,
        });
        return;
      }

      // Success!
      console.log('✅ Test connection successful:', data);
      setTestResult({
        success: true,
        message: 'Connection successful!',
        accountData: data.account,
      });
      toast({
        title: 'Test Successful',
        description: `Connected to ${data.account?.broker_name || brokerName} (Balance: $${data.account?.balance || 0})`,
      });

    } catch (error: any) {
      console.error('❌ Test connection exception:', error);
      setTestResult({
        success: false,
        message: error.message || 'Unexpected error during connection test',
      });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsTesting(false);
    }
  };

  /**
   * Connect MT5 account and save to database
   * AC:4 - Reuses test call, saves account, refreshes list
   */
  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
      });
      return;
    }

    setIsConnecting(true);
    setTestResult(null);

    try {
      console.log('🔗 Connecting MT5 account...', {
        platform: formData.platform,
        server: formData.server,
        login: formData.login,
      });

      // Get broker name from selected broker
      const brokerName = extractBrokerName(formData.server);

      // Call Supabase edge function to save account
      const { data, error } = await supabase.functions.invoke('connect-mt5-account', {
        body: {
          broker_name: brokerName,
          server: formData.server,
          login: formData.login,
          password: formData.investorPassword,
          platform: formData.platform,
          test_only: false, // Save to DB
        },
      });

      console.log('📦 Connect account response:', { data, error });

      if (error) {
        console.error('❌ Connection error:', error);
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: error.message || 'Failed to connect account',
        });
        return;
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || data?.message || 'Failed to connect account';
        console.error('❌ Connection returned failure:', data);
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: errorMsg,
        });
        return;
      }

      // Success! Refresh account list
      console.log('✅ Account connected successfully:', data);
      
      // Refresh accounts list (AC:4)
      await loadAccounts();

      toast({
        title: 'Account Connected',
        description: `Successfully linked ${data.account?.broker_name || brokerName} account`,
      });

      // Reset form (AC:4)
      setFormData({
        platform: '',
        brokerId: '',
        server: '',
        login: '',
        investorPassword: '',
      });
      setTestResult(null);
      setErrors({});

    } catch (error: any) {
      console.error('❌ Connection exception:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Get available brokers for selected platform
  const availableBrokers = formData.platform ? getBrokersByPlatform(formData.platform) : [];
  
  // Get available servers for selected broker
  const availableServers = formData.brokerId ? getServersByBroker(formData.brokerId) : [];

  return (
    <Card className="w-full max-w-md mx-auto" dir={rtl.dir}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-start">
          <Plug className="h-5 w-5" />
          {t('accountLink.title')}
        </CardTitle>
        <CardDescription className="text-start">
          {t('accountLink.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* AC:5 - Error/Success feedback banner */}
        {testResult && (
          <Alert className={`mb-4 ${testResult.success ? 'bg-green-50 border-green-200' : ''}`} variant={testResult.success ? 'default' : 'destructive'}>
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>{testResult.success ? 'Connection Successful' : 'Connection Failed'}</AlertTitle>
            <AlertDescription>
              {testResult.message}
              {testResult.accountData && (
                <div className="mt-2 text-sm">
                  <div>Balance: ${testResult.accountData.balance || 0}</div>
                  <div>Currency: {testResult.accountData.currency || 'USD'}</div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleConnectAccount} className="space-y-4">
          {/* AC:1,2 - Platform selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">{t('accountLink.platform')}</Label>
            <Select 
              value={formData.platform} 
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  platform: value as 'MT4' | 'MT5',
                  brokerId: '',
                  server: '' 
                }));
                setErrors(prev => ({ ...prev, platform: '' }));
                setTestResult(null);
              }}
            >
              <SelectTrigger className={errors.platform ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('accountLink.selectPlatform')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MT4">MetaTrader 4</SelectItem>
                <SelectItem value="MT5">MetaTrader 5</SelectItem>
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-sm text-red-500">{errors.platform}</p>
            )}
          </div>

          {/* AC:2 - Broker selection with filtered options */}
          <div className="space-y-2">
            <Label htmlFor="broker">{t('accountLink.broker') || 'Broker'}</Label>
            <Select 
              value={formData.brokerId}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, brokerId: value, server: '' }));
                setErrors(prev => ({ ...prev, brokerId: '', server: '' }));
                setTestResult(null);
              }}
              disabled={!formData.platform}
            >
              <SelectTrigger className={errors.brokerId ? 'border-red-500' : ''}>
                <SelectValue placeholder={formData.platform ? "Select broker" : "Select platform first"} />
              </SelectTrigger>
              <SelectContent>
                {availableBrokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.brokerId && (
              <p className="text-sm text-red-500">{errors.brokerId}</p>
            )}
          </div>

          {/* AC:2 - Server selection (cascading from broker) */}
          <div className="space-y-2">
            <Label htmlFor="server" className="text-start block">{t('accountLink.brokerServer')}</Label>
            <div className="relative">
              <Server className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              <Select 
                value={formData.server}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, server: value }));
                  setErrors(prev => ({ ...prev, server: '' }));
                  setTestResult(null);
                }}
                disabled={!formData.brokerId}
              >
                <SelectTrigger className={`ps-9 ${errors.server ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder={formData.brokerId ? "Select server" : "Select broker first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableServers.map((server) => (
                    <SelectItem key={server.name} value={server.name}>
                      {server.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.server && (
              <p className="text-sm text-red-500">{errors.server}</p>
            )}
          </div>

          {/* AC:1 - Login number validation (positive integer) */}
          <div className="space-y-2">
            <Label htmlFor="login" className="text-start block">{t('accountLink.loginNumber')}</Label>
            <Input
              id="login"
              type="text"
              placeholder={t('accountLink.loginPlaceholder')}
              value={formData.login}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, login: e.target.value }));
                setErrors(prev => ({ ...prev, login: '' }));
                setTestResult(null);
              }}
              className={errors.login ? 'border-red-500' : ''}
              dir={rtl.dir}
            />
            {errors.login && (
              <p className="text-sm text-red-500">{errors.login}</p>
            )}
          </div>

          {/* AC:1 - Password validation (min 6 chars) */}
          <div className="space-y-2">
            <Label htmlFor="investor-password" className="text-start block">{t('accountLink.investorPassword')}</Label>
            <div className="relative">
              <Key className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="investor-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('accountLink.passwordPlaceholder')}
                className={`ps-9 pe-9 ${errors.investorPassword ? 'border-red-500' : ''}`}
                value={formData.investorPassword}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, investorPassword: e.target.value }));
                  setErrors(prev => ({ ...prev, investorPassword: '' }));
                  setTestResult(null);
                }}
                dir={rtl.dir}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.investorPassword && (
              <p className="text-sm text-red-500">{errors.investorPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('accountLink.passwordHint')}
            </p>
          </div>

          {/* AC:3,4 - Test Connection and Connect Account buttons */}
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline"
              className="flex-1" 
              disabled={isTesting || isConnecting}
              onClick={handleTestConnection}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isConnecting || isTesting}
            >
              {isConnecting ? t('accountLink.connecting') : t('accountLink.connect')}
            </Button>
          </div>

          {/* AC:5 - ngrok testing guidance */}
          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              <strong>Local Testing:</strong> For local development, ensure the MT5 service is running 
              and ngrok tunnel is active. See docs/stories/1-5-ngrok-tunnel-for-supabase-edge-function-testing.md
            </AlertDescription>
          </Alert>
        </form>
      </CardContent>
    </Card>
  );
};