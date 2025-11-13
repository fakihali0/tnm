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
import { Plug, Server, Key, Eye, EyeOff } from 'lucide-react';
import { useRTL } from '@/hooks/useRTL';

export const AccountLinkForm: React.FC = () => {
  const { t } = useTranslation('tnm-ai');
  const rtl = useRTL();
  const { addAccount, isConnecting } = useAccountStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    platform: '',
    server: '',
    login: '',
    investorPassword: '',
  });

  const handlePasswordChange = (password: string) => {
    setFormData(prev => ({ ...prev, investorPassword: password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.platform || !formData.server || !formData.login || !formData.investorPassword) {
      toast({
        variant: 'destructive',
        title: t('accountLink.errors.missingInfo'),
        description: t('accountLink.errors.fillAllFields'),
      });
      return;
    }

    // SECURITY: Credentials sent over HTTPS, encrypted server-side
    // No client-side logging of sensitive data
    const result = await addAccount({
      platform: formData.platform as 'MT4' | 'MT5',
      broker_name: formData.server.split('-')[0] || 'Unknown Broker',
      server: formData.server,
      login_number: formData.login,
      password: formData.investorPassword,
    });

    if (result.success) {
      toast({
        title: t('accountLink.success.title'),
        description: t('accountLink.success.description'),
      });
      setFormData({
        platform: '',
        server: '',
        login: '',
        investorPassword: '',
      });
    } else {
      toast({
        variant: 'destructive',
        title: t('accountLink.errors.connectionFailed'),
        description: result.error || t('accountLink.errors.checkCredentials'),
      });
    }
  };

  const brokerServers = {
    MT4: [
      'MetaQuotes-Demo',
      'ICMarkets-Live01',
      'ICMarkets-Live02',
      'FXPRO-Real',
      'FXPRO-Demo',
      'XM-Real',
      'XM-Demo',
    ],
    MT5: [
      'MetaQuotes-MT5',
      'ICMarkets-MT5-Live',
      'FXPRO-MT5-Real',
      'FXPRO-MT5-Demo',
      'XM-MT5-Real',
      'XM-MT5-Demo',
    ],
  };

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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">{t('accountLink.platform')}</Label>
            <Select 
              value={formData.platform} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value, server: '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('accountLink.selectPlatform')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MT4">MetaTrader 4</SelectItem>
                <SelectItem value="MT5">MetaTrader 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="server" className="text-start block">{t('accountLink.brokerServer')}</Label>
            <div className="relative">
              <Server className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              {formData.platform ? (
                <Select 
                  value={formData.server}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, server: value }))}
                >
                  <SelectTrigger className="ps-9">
                    <SelectValue placeholder={t('accountLink.selectServer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {brokerServers[formData.platform as keyof typeof brokerServers]?.map((server) => (
                      <SelectItem key={server} value={server}>{server}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="server"
                  type="text"
                  placeholder={t('accountLink.serverPlaceholder')}
                  className="ps-9"
                  value={formData.server}
                  onChange={(e) => setFormData(prev => ({ ...prev, server: e.target.value }))}
                  disabled
                  dir={rtl.dir}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="login" className="text-start block">{t('accountLink.loginNumber')}</Label>
            <Input
              id="login"
              type="text"
              placeholder={t('accountLink.loginPlaceholder')}
              value={formData.login}
              onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
              dir={rtl.dir}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investor-password" className="text-start block">{t('accountLink.investorPassword')}</Label>
            <div className="relative">
              <Key className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="investor-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('accountLink.passwordPlaceholder')}
                className="ps-9 pe-9"
                value={formData.investorPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
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
            <p className="text-xs text-muted-foreground">
              {t('accountLink.passwordHint')}
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isConnecting}
          >
            {isConnecting ? t('accountLink.connecting') : t('accountLink.connect')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};