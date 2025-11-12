import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { CountrySelect } from '@/components/ui/country-select';
import { PhoneInput } from '@/components/ui/phone-input';
import { Eye, EyeOff, Mail, Lock, User, MapPin, Phone, Shield, CheckCircle, AlertCircle, XCircle, ArrowLeft } from 'lucide-react';
import { countries, type Country } from '@/data/countries';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AuthBackground } from './AuthBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate, useLocation } from 'react-router-dom';
import { validatePassword, ValidationResult } from '@/utils/password-validator';

interface AuthGateProps {
  children: React.ReactNode;
}

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('invalidEmail'),
  password: z.string().min(1, 'fieldRequired'),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, 'fieldRequired'),
  lastName: z.string().min(1, 'fieldRequired'),
  email: z.string().email('invalidEmail'),
  country: z.string().min(1, 'fieldRequired'),
  phone: z.string().min(1, 'fieldRequired'),
  password: z.string().min(8, 'passwordTooShort'),
  confirmPassword: z.string(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'mustAcceptTerms',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'passwordsDontMatch',
  path: ['confirmPassword'],
});

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const { isAuthenticated, login, signup, requestPasswordReset } = useAuthStore();
  const { t } = useTranslation('tnm-ai');
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneCountryCode, setPhoneCountryCode] = useState<Country>(countries[0]);
  const [passwordValidation, setPasswordValidation] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return tab === 'signup' ? 'signup' : 'signin';
  });
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: '',
    phone: '',
    termsAccepted: false,
  });

  // Sync activeTab with URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'signup' || tab === 'signin') {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Auto-focus first input when tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Update password strength when password changes (with debouncing)
  useEffect(() => {
    if (activeTab === 'signup' && formData.password) {
      const timer = setTimeout(() => {
        const result = validatePassword(formData.password, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        setPasswordValidation(result);
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (!formData.password) {
      setPasswordValidation(null);
    }
  }, [formData.password, formData.email, formData.firstName, formData.lastName, activeTab]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const validateForm = (mode: 'signin' | 'signup') => {
    setErrors({});
    const schema = mode === 'signin' ? signInSchema : signUpSchema;
    
    try {
      if (mode === 'signin') {
        schema.parse({
          email: formData.email,
          password: formData.password,
        });
      } else {
        schema.parse({
          ...formData,
          country: selectedCountry?.code || '',
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = t(`auth.${err.message}`);
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (mode: 'signin' | 'signup') => {
    if (!validateForm(mode)) return;
    
    setIsLoading(true);
    
    try {
      const result = mode === 'signin' 
        ? await login(formData.email, formData.password)
        : await signup(
            formData.email, 
            formData.password, 
            formData.firstName, 
            formData.lastName,
            selectedCountry?.name,
            phoneCountryCode?.dialCode,
            formData.phone
          );
      
      if (result.success) {
        toast({
          title: mode === 'signin' ? t('common.success') : t('auth.accountCreated'),
          description: mode === 'signin' ? 'You have been signed in successfully.' : t('auth.accountCreatedDesc'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('auth.authFailed'),
          description: result.error || t('auth.authFailedDesc'),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('common.error'),
        description: 'An unexpected error occurred. Please try again.',
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

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
      <AuthBackground />
      
      {/* Back button - absolute positioned top-left */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 p-3 rounded-full bg-card/80 backdrop-blur-sm border border-border/60 hover:bg-card transition-all shadow-lg"
        aria-label={t('auth.backToWebsite')}
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
            TNM AI
          </h1>
          <p className="text-muted-foreground mt-3 text-lg">Your intelligent AI trading companion</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="backdrop-blur-md bg-card/90 border-border/60 shadow-2xl overflow-hidden">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => {
                setActiveTab(value);
                const params = new URLSearchParams(location.search);
                params.set('tab', value);
                navigate(`?${params.toString()}`, { replace: true });
              }} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger 
                  value="signin"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
                >
                  {t('auth.signIn')}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-200"
                >
                  {t('auth.signUp')}
                </TabsTrigger>
              </TabsList>
            
            <TabsContent value="signin" className="focus-within:outline-none">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="text-2xl font-semibold">{t('auth.welcomeBack')}</CardTitle>
                <CardDescription className="text-base">
                  {t('auth.signInDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label 
                    htmlFor="signin-email" 
                    className="text-sm font-medium"
                  >
                    {t('auth.email')}
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      ref={activeTab === 'signin' ? firstInputRef : undefined}
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={t('auth.enterEmail')}
                      className={`pl-10 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.email ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      aria-describedby={errors.email ? "signin-email-error" : undefined}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p 
                        id="signin-email-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label 
                      htmlFor="signin-password" 
                      className="text-sm font-medium"
                    >
                      {t('auth.password')}
                    </Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs text-primary hover:text-primary/80"
                      onClick={() => setShowForgotPassword(!showForgotPassword)}
                    >
                      Forgot password?
                    </Button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t('auth.enterPassword')}
                      className={`pl-10 pr-12 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.password ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      aria-describedby={errors.password ? "signin-password-error" : undefined}
                      aria-invalid={!!errors.password}
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
                    {errors.password && (
                      <motion.p 
                        id="signin-password-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {showForgotPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                        {!resetSent ? (
                          <>
                            <p className="text-sm text-muted-foreground">
                              {t('auth.resetPasswordInstructions')}
                            </p>
                            <div className="flex gap-2">
                              <Input
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder={t('auth.enterEmail')}
                                className="flex-1"
                                disabled={isLoading}
                              />
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={async () => {
                                  if (!resetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
                                    toast({
                                      title: t('auth.error'),
                                      description: t('auth.invalidEmail'),
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  setIsLoading(true);
                                  await requestPasswordReset(resetEmail);
                                  setIsLoading(false);
                                  setResetSent(true);
                                  
                                  toast({
                                    title: t('auth.resetEmailSent'),
                                    description: t('auth.checkEmailForReset'),
                                  });
                                }}
                                disabled={isLoading || !resetEmail}
                              >
                                {isLoading ? t('auth.sending') : t('auth.sendReset')}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                {t('auth.resetEmailSent')}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('auth.checkEmailForReset')}
                              </p>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto text-xs mt-2"
                                onClick={() => {
                                  setResetSent(false);
                                  setResetEmail('');
                                  setShowForgotPassword(false);
                                }}
                              >
                                {t('auth.backToSignIn')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button 
                    className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                    onClick={() => handleSubmit('signin')}
                    disabled={isLoading || !formData.email || !formData.password}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t('auth.signingIn')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {t('auth.signIn')}
                      </div>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="signup" className="focus-within:outline-none">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="text-2xl font-semibold">{t('auth.createAccount')}</CardTitle>
                <CardDescription className="text-base">
                  {t('auth.signUpDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="signup-firstname" className="text-sm font-medium">{t('auth.firstName')}</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        ref={activeTab === 'signup' ? firstInputRef : undefined}
                        id="signup-firstname"
                        name="given-name"
                        type="text"
                        autoComplete="given-name"
                        placeholder={t('auth.firstName')}
                        className={`pl-10 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                          errors.firstName ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                        }`}
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        aria-describedby={errors.firstName ? "signup-firstname-error" : undefined}
                        aria-invalid={!!errors.firstName}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.firstName && (
                        <motion.p 
                          id="signup-firstname-error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-sm text-destructive flex items-center gap-2"
                        >
                          <AlertCircle className="h-4 w-4" />
                          {errors.firstName}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="signup-lastname" className="text-sm font-medium">{t('auth.lastName')}</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        id="signup-lastname"
                        name="family-name"
                        type="text"
                        autoComplete="family-name"
                        placeholder={t('auth.lastName')}
                        className={`pl-10 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                          errors.lastName ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                        }`}
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        aria-describedby={errors.lastName ? "signup-lastname-error" : undefined}
                        aria-invalid={!!errors.lastName}
                      />
                    </div>
                    <AnimatePresence>
                      {errors.lastName && (
                        <motion.p 
                          id="signup-lastname-error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-sm text-destructive flex items-center gap-2"
                        >
                          <AlertCircle className="h-4 w-4" />
                          {errors.lastName}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="signup-email" className="text-sm font-medium">{t('auth.email')}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder={t('auth.enterEmail')}
                      className={`pl-10 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.email ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      aria-describedby={errors.email ? "signup-email-error" : undefined}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p 
                        id="signup-email-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signup-country" className="text-sm font-medium">{t('auth.country')}</Label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 group-focus-within:text-primary transition-colors" />
                    <CountrySelect
                      value={selectedCountry}
                      onValueChange={(country) => {
                        setSelectedCountry(country);
                        setPhoneCountryCode(country);
                      }}
                      placeholder={t('auth.selectCountry')}
                      className={`pl-10 h-12 transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.country ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.country && (
                      <motion.p 
                        id="signup-country-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.country}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signup-phone" className="text-sm font-medium">
                    {t('auth.phone')}
                  </Label>
                  <PhoneInput
                    value={formData.phone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                    countryCode={phoneCountryCode}
                    onCountryCodeChange={setPhoneCountryCode}
                    placeholder={t('auth.phone')}
                    required
                    className={`transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20 ${
                      errors.phone ? 'border-destructive focus-within:border-destructive' : 'focus-within:border-primary'
                    }`}
                  />
                  <AnimatePresence>
                    {errors.phone && (
                      <motion.p 
                        id="signup-phone-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.phone}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="signup-password" className="text-sm font-medium">{t('auth.password')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('auth.createPassword')}
                      className={`pl-10 pr-12 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.password ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      aria-describedby={errors.password ? "signup-password-error" : "password-requirements"}
                      aria-invalid={!!errors.password}
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
                  
                  {formData.password && passwordValidation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      id="password-requirements"
                    >
                      <PasswordStrengthIndicator validation={passwordValidation} />
                    </motion.div>
                  )}
                  
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p 
                        id="signup-password-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="signup-confirm-password" className="text-sm font-medium">{t('auth.confirmPassword')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="signup-confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      className={`pl-10 pr-12 h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 ${
                        errors.confirmPassword ? 'border-destructive focus:border-destructive' : 'focus:border-primary'
                      }`}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      aria-describedby={errors.confirmPassword ? "signup-confirm-password-error" : undefined}
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
                        id="signup-confirm-password-error"
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
                </div>
                
                {/* Terms and Conditions Agreement */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
                    <Checkbox
                      id="terms-checkbox"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, termsAccepted: checked === true }))
                      }
                      aria-describedby={errors.termsAccepted ? "terms-error" : undefined}
                      aria-invalid={!!errors.termsAccepted}
                      className={errors.termsAccepted ? 'border-destructive' : ''}
                    />
                    <div className="flex-1">
                      <Label 
                        htmlFor="terms-checkbox" 
                        className="text-sm font-normal leading-relaxed cursor-pointer"
                      >
                        I agree to the{' '}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Terms and Conditions
                        </a>
                        {' '}and{' '}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
                        </a>
                      </Label>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {errors.termsAccepted && (
                      <motion.p 
                        id="terms-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-destructive flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        {errors.termsAccepted}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button 
                    className="w-full h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                    onClick={() => handleSubmit('signup')}
                    disabled={
                      isLoading || 
                      !formData.email || 
                      !formData.password || 
                      !formData.confirmPassword || 
                      !formData.firstName || 
                      !formData.lastName || 
                      !selectedCountry ||
                      !formData.termsAccepted ||
                      (passwordValidation && !passwordValidation.isValid)
                    }
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        {t('auth.creatingAccount')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('auth.signUp')}
                      </div>
                    )}
                  </Button>
                </motion.div>
              </CardContent>
            </TabsContent>
          </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};