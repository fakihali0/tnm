import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Cookie, 
  Shield, 
  Settings, 
  Eye, 
  BarChart3, 
  MapPin, 
  CheckCircle,
  X
} from 'lucide-react';

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
  cookies: string[];
  purpose: string;
  retention: string;
}

export function CookieConsentManager() {
  const { t, i18n } = useTranslation(['common']);
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [categories, setCategories] = useState<CookieCategory[]>([
    {
      id: 'necessary',
      name: 'Strictly Necessary',
      description: 'Essential for the website to function properly',
      required: true,
      enabled: true,
      cookies: ['session_id', 'csrf_token', 'language_preference'],
      purpose: 'Authentication, security, and basic functionality',
      retention: 'Session / 1 year'
    },
    {
      id: 'performance',
      name: 'Performance & Analytics',
      description: 'Help us understand how visitors interact with our website',
      required: false,
      enabled: false,
      cookies: ['analytics_id', 'page_views', 'user_journey'],
      purpose: 'Website analytics and performance monitoring',
      retention: '2 years'
    },
    {
      id: 'functional',
      name: 'Functional',
      description: 'Enable enhanced functionality and personalization',
      required: false,
      enabled: false,
      cookies: ['theme_preference', 'layout_settings', 'notification_settings'],
      purpose: 'User preferences and enhanced features',
      retention: '1 year'
    },
    {
      id: 'targeting',
      name: 'Marketing & Targeting',
      description: 'Used to deliver relevant advertisements and measure campaign effectiveness',
      required: false,
      enabled: false,
      cookies: ['marketing_id', 'campaign_source', 'ad_preferences'],
      purpose: 'Personalized advertising and marketing campaigns',
      retention: '2 years'
    }
  ]);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookie_consent');
    if (consent) {
      const consentData = JSON.parse(consent);
      setHasConsented(true);
      setCategories(consentData.categories || categories);
      
      // Check if consent needs refresh (older than 1 year)
      const consentDate = new Date(consentData.timestamp);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (consentDate < oneYearAgo) {
        setIsVisible(true);
      }
    } else {
      // Show consent banner after a short delay
      setTimeout(() => setIsVisible(true), 2000);
    }
  }, []);

  const handleCategoryToggle = (categoryId: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId && !cat.required 
          ? { ...cat, enabled: !cat.enabled }
          : cat
      )
    );
  };

  const handleAcceptAll = () => {
    const updatedCategories = categories.map(cat => ({ ...cat, enabled: true }));
    saveConsent(updatedCategories);
    trackConsentChoice('accept_all');
  };

  const handleAcceptSelected = () => {
    saveConsent(categories);
    trackConsentChoice('accept_selected');
  };

  const handleRejectAll = () => {
    const necessaryOnly = categories.map(cat => ({ 
      ...cat, 
      enabled: cat.required 
    }));
    saveConsent(necessaryOnly);
    trackConsentChoice('reject_all');
  };

  const saveConsent = (consentCategories: CookieCategory[]) => {
    const consentData = {
      categories: consentCategories,
      timestamp: new Date().toISOString(),
      version: '1.0',
      language: i18n.language
    };
    
    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    setCategories(consentCategories);
    setHasConsented(true);
    setIsVisible(false);
    
    // Apply consent settings
    applyConsentSettings(consentCategories);
  };

  const applyConsentSettings = (consentCategories: CookieCategory[]) => {
    // Enable/disable analytics based on performance consent
    const performanceConsent = consentCategories.find(cat => cat.id === 'performance')?.enabled;
    if (performanceConsent) {
      // Initialize analytics
      window.dispatchEvent(new CustomEvent('analytics:enable'));
    } else {
      // Disable analytics
      window.dispatchEvent(new CustomEvent('analytics:disable'));
    }

    // Handle functional cookies
    const functionalConsent = consentCategories.find(cat => cat.id === 'functional')?.enabled;
    if (!functionalConsent) {
      // Clear functional cookies
      localStorage.removeItem('theme_preference');
      localStorage.removeItem('layout_settings');
    }

    // Handle marketing cookies
    const marketingConsent = consentCategories.find(cat => cat.id === 'targeting')?.enabled;
    if (!marketingConsent) {
      // Clear marketing cookies
      localStorage.removeItem('marketing_id');
      localStorage.removeItem('campaign_source');
    }
  };

  const trackConsentChoice = (choice: string) => {
    // Track consent choice (only if performance cookies are enabled)
    const performanceEnabled = categories.find(cat => cat.id === 'performance')?.enabled;
    if (performanceEnabled) {
      window.dispatchEvent(new CustomEvent('analytics:track', {
        detail: {
          event: 'cookie_consent',
          properties: {
            choice,
            categories_enabled: categories.filter(cat => cat.enabled).map(cat => cat.id),
            language: i18n.language
          }
        }
      }));
    }
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie_consent');
    setHasConsented(false);
    setIsVisible(true);
    setShowDetails(false);
    setCategories(prev => prev.map(cat => ({ ...cat, enabled: cat.required })));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 left-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 max-w-lg"
      >
        <div className="bg-background/95 backdrop-blur border rounded-lg shadow-2xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold mb-0.5">Cookie Preferences</h3>
                <p className="text-xs text-muted-foreground">
                  We use cookies to enhance your experience
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {!showDetails ? (
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p>
                  We use cookies for essential functions and to improve your experience.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAcceptAll} size="sm" className="min-h-[36px]">
                  Accept All
                </Button>
                <Button 
                  onClick={() => setShowDetails(true)} 
                  variant="outline"
                  size="sm"
                  className="min-h-[36px]"
                >
                  <Settings className="w-3 h-3 mr-1.5" />
                  Customize
                </Button>
                <Button 
                  onClick={handleRejectAll} 
                  variant="ghost"
                  size="sm"
                  className="min-h-[36px]"
                >
                  Reject All
                </Button>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <a href="/privacy" className="hover:text-foreground flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  Privacy
                </a>
                <a href="/cookies" className="hover:text-foreground flex items-center gap-1">
                  <Cookie className="w-2.5 h-2.5" />
                  Cookie Policy
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          {category.name}
                          {category.required && (
                            <Badge variant="secondary" className="text-[10px]">
                              Required
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {category.description}
                        </p>
                      </div>
                      <Switch
                        checked={category.enabled}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                        disabled={category.required}
                        className="ml-2"
                      />
                    </div>
                    
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-2.5 h-2.5" />
                        <span>{category.purpose}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="w-2.5 h-2.5" />
                        <span>Retention: {category.retention}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAcceptSelected} size="sm" className="flex-1 min-h-[36px]">
                  <CheckCircle className="w-3 h-3 mr-1.5" />
                  Save
                </Button>
                <Button 
                  onClick={() => setShowDetails(false)} 
                  variant="outline"
                  size="sm"
                  className="min-h-[36px]"
                >
                  Back
                </Button>
              </div>

              {hasConsented && (
                <div className="text-center">
                  <Button
                    onClick={resetConsent}
                    variant="ghost"
                    size="sm"
                    className="text-[10px] text-muted-foreground hover:text-foreground h-auto py-1"
                  >
                    Reset Preferences
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}