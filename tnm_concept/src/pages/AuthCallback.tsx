import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthCallback() {
  const { t } = useTranslation('tnm-ai');
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const currentLanguage = location.pathname.startsWith('/ar') ? 'ar' : 'en';

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the hash params from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Handle error in URL
        if (error) {
          console.error('Auth error from URL:', error, errorDescription);
          setStatus('error');
          setErrorMessage(errorDescription || t('auth.verification.error'));
          return;
        }

        // If no access token, check if already authenticated
        if (!accessToken) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('success');
            setTimeout(() => {
              navigate(currentLanguage === 'ar' ? '/ar/tnm-ai' : '/tnm-ai', { replace: true });
            }, 2000);
            return;
          }
          
          setStatus('error');
          setErrorMessage(t('auth.verification.invalid'));
          return;
        }

        // Set the session with the token
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (session) {
          // Update auth store
          useAuthStore.getState().setSession(session);
          
          setStatus('success');
          
          // Redirect to dashboard after success
          setTimeout(() => {
            navigate(currentLanguage === 'ar' ? '/ar/tnm-ai' : '/tnm-ai', { replace: true });
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage(t('auth.verification.invalid'));
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMessage(t('auth.verification.error'));
      }
    };

    handleEmailVerification();
  }, [navigate, currentLanguage, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <h2 className="text-2xl font-semibold">{t('auth.verification.processing')}</h2>
                <p className="text-muted-foreground">{t('auth.verification.pleaseWait')}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <h2 className="text-2xl font-semibold">{t('auth.verification.success')}</h2>
                <p className="text-muted-foreground">{t('auth.verification.redirecting')}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <AlertCircle className="h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-semibold">{t('auth.verification.failed')}</h2>
                <p className="text-muted-foreground">{errorMessage}</p>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => navigate(currentLanguage === 'ar' ? '/ar/tnm-ai' : '/tnm-ai')}
                    variant="outline"
                  >
                    {t('auth.verification.goToLogin')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
