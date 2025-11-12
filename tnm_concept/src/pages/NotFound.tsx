import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { getLocalizedPath, getLanguageFromPath } from '@/i18n';

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const currentLang = getLanguageFromPath(location.pathname);

  useEffect(() => {
    // Track 404 error for analytics in production
    if (process.env.NODE_ENV === 'production') {
      // analytics.track('404_error', { path: location.pathname });
    }
  }, [location.pathname]);

  return (
    <Layout>
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <span className="text-6xl font-bold gradient-text">404</span>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            {t('common:errors.pageNotFound.title', 'Page Not Found')}
          </h1>
          <p className="mb-8 text-muted-foreground leading-relaxed">
            {t('common:errors.pageNotFound.description', "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="gap-2">
              <Link to={getLocalizedPath("/", currentLang)}>
                <Home className="h-4 w-4" />
                {t('common:navigation.returnHome', 'Return Home')}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common:navigation.goBack', 'Go Back')}
            </Button>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default NotFound;
