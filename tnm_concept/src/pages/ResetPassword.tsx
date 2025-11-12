import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, Shield, CheckCircle, AlertCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthBackground } from '@/components/tnm-pro/AuthBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { validatePassword, ValidationResult } from '@/utils/password-validator';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuthStore();
  const { t } = useTranslation('tnm-ai');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState<ValidationResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sessionReady, setSessionReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // Detect password recovery session from email link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        } else if (event === 'SIGNED_OUT') {
          navigate('/tnm-ai');
        }
      }
    );

    // Check if we already have a session (user refreshed page)
    const checkExistingSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Check URL hash for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type');
      
      if (type === 'recovery' && session) {
        setSessionReady(true);
      } else if (!type && !session) {
        setTokenError('No reset token found. Please use the link from your email.');
      }
    };

    checkExistingSession();
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Update password validation when password changes (with debouncing)
  useEffect(() => {
    if (newPassword) {
      const timer = setTimeout(() => {
        const result = validatePassword(newPassword);
        setPasswordValidation(result);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setPasswordValidation(null);
    }
  }, [newPassword]);

  // Countdown and redirect after success
  useEffect(() => {
    if (resetSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (resetSuccess && countdown === 0) {
      navigate('/tnm-ai');
    }
  }, [resetSuccess, countdown, navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newPassword) {
      newErrors.newPassword = t('auth.fieldRequired');
    } else if (passwordValidation && !passwordValidation.isValid) {
      newErrors.newPassword = passwordValidation.errors[0] || t('auth.passwordTooWeak');
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.fieldRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDontMatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Verify session exists before attempting update
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        variant: 'destructive',
        title: t('auth.resetPasswordError'),
        description: 'Your reset link has expired. Please request a new one.',
      });
      setTokenError('Session expired. Please request a new reset link.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await resetPassword(newPassword);
      
      if (result.success) {
        setResetSuccess(true);
        toast({
          title: t('auth.resetPasswordSuccess'),
          description: t('auth.resetPasswordSuccessDesc'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('auth.resetPasswordError'),
          description: result.error || t('auth.invalidResetToken'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: t('auth.invalidResetToken'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (strength: ValidationResult['strength']) => {
    switch(strength) {
      case 'very-weak': return 'text-destructive';
      case 'weak': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'strong': return 'text-green-500';
      case 'very-strong': return 'text-emerald-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStrengthLabel = (strength: ValidationResult['strength']) => {
    switch(strength) {
      case 'very-weak': return t('auth.passwordStrength.veryWeak');
      case 'weak': return t('auth.passwordStrength.weak');
      case 'medium': return t('auth.passwordStrength.medium');
      case 'strong': return t('auth.passwordStrength.strong');
      case 'very-strong': return t('auth.passwordStrength.veryStrong');
      default: return '';
    }
  };

  const PasswordStrengthIndicator = ({ validation }: { validation: ValidationResult }) => (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{t('auth.passwordStrength.strengthLabel')}</span>
          <span className={`font-medium ${getStrengthColor(validation.strength)}`}>
            {getStrengthLabel(validation.strength)}
          </span>
        </div>
        <Progress 
          value={validation.score} 
          className="h-2"
        />
      </div>

      {/* Requirements checklist - Only show missing */}
      {Object.entries(validation.checks).filter(([_, check]) => !check.passed).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(validation.checks)
            .filter(([_, check]) => !check.passed)
            .map(([key, check]) => (
              <div 
                key={key}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <AlertCircle className="h-3 w-3" />
                <span className="line-clamp-1">{check.message}</span>
              </div>
            ))}
        </div>
      )}

      {/* Errors - Only show critical security issues */}
      {validation.errors.filter(error => 
        !error.includes('must be at least') && 
        !error.includes('Must contain') && 
        !error.includes('Password must be at least')
      ).length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Critical Issues:
          </p>
          {validation.errors
            .filter(error => 
              !error.includes('must be at least') &&
              !error.includes('Must contain') &&
              !error.includes('Password must be at least')
            )
            .map((error, i) => (
              <p key={i} className="text-xs text-destructive pl-4">• {error}</p>
            ))}
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="space-y-1">
          {validation.warnings.map((warning, i) => (
            <p key={i} className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-1">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );

  // Loading state while verifying token
  if (!sessionReady && !tokenError) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
        <AuthBackground />
        <div className="text-center space-y-4 relative z-10">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-lg">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Error state for invalid/expired token
  if (tokenError) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
        <AuthBackground />
        <Card className="max-w-md relative z-10 backdrop-blur-md bg-card/90 border-border/60 shadow-2xl">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mx-auto w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center"
            >
              <AlertCircle className="h-12 w-12 text-destructive" />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Invalid Reset Link</h2>
              <p className="text-muted-foreground">{tokenError}</p>
            </div>
            <Button onClick={() => navigate('/tnm-ai')} className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
        <AuthBackground />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="backdrop-blur-md bg-card/90 border-border/60 shadow-2xl">
            <CardContent className="pt-10 pb-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle className="h-12 w-12 text-green-500" />
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  {t('auth.resetPasswordSuccess')}
                </h2>
                <p className="text-muted-foreground">
                  {t('auth.resetPasswordSuccessDesc')}
                </p>
              </div>
              
              <div className="text-4xl font-bold text-primary">
                {countdown}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
      <AuthBackground />
      
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/tnm-ai')}
        className="absolute top-6 left-6 z-20 p-3 rounded-full bg-card/80 backdrop-blur-sm border border-border/60 hover:bg-card transition-all shadow-lg"
        aria-label="Back to sign in"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </motion.button>

      <div className="w-full max-w-lg relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            {t('auth.passwordResetTitle')}
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">{t('auth.passwordResetSubtitle')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="backdrop-blur-md bg-card/90 border-border/60 shadow-2xl">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="text-2xl font-semibold">{t('auth.enterNewPassword')}</CardTitle>
              <CardDescription className="text-base">
                Create a strong password to secure your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* New Password */}
                <div className="space-y-3">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    {t('auth.newPassword')}
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Enter new password"
                      className={`pl-10 pr-12 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.newPassword ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      aria-describedby={errors.newPassword ? "new-password-error" : undefined}
                      aria-invalid={!!errors.newPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-muted/50 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <AnimatePresence>
                    {errors.newPassword && (
                      <motion.p 
                        id="new-password-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.newPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {newPassword && passwordValidation && <PasswordStrengthIndicator validation={passwordValidation} />}
                </div>

                {/* Confirm Password */}
                <div className="space-y-3">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    {t('auth.confirmNewPassword')}
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      className={`pl-10 pr-12 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.confirmPassword ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-muted/50 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <AnimatePresence>
                    {errors.confirmPassword && (
                      <motion.p 
                        id="confirm-password-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {confirmPassword && newPassword === confirmPassword && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Passwords match
                    </motion.div>
                  )}
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button 
                    type="submit"
                    className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                    disabled={isLoading || !newPassword || !confirmPassword || (passwordValidation && !passwordValidation.isValid)}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Resetting...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {t('auth.resetPassword')}
                      </div>
                    )}
                  </Button>
                </motion.div>

                {/* Back to Sign In Link */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/tnm-ai')}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    {t('auth.backToSignIn')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
