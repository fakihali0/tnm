import { Link, useLocation } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { openEmailClient, redirectToAuth, AUTH_URLS } from "@/utils/auth-redirects";
import { getLanguageFromPath, getLocalizedPath } from "@/i18n";
import { cn } from "@/lib/utils";
import { SPACING } from "@/styles/spacing";

import { Button } from "@/components/ui/button";

const social = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
];

const getNavigation = (t: TFunction) => ({
  products: [
    { name: t("footer.navigation.tradingInstruments"), href: "/products" },
    { name: t("footer.navigation.accountTypes"), href: "/products#accounts" },
    { name: t("footer.navigation.metaTrader5"), href: "/products#platform" },
    { name: t("footer.navigation.tradingTools"), href: "/products#tools" },
  ],
  education: [
    { name: t("footer.navigation.tradingAcademy"), href: "/education/webinars" },
    { name: t("footer.navigation.educationalResources"), href: "/education/resources" },
    { name: t("footer.navigation.marketAnalysis"), href: "/education/market-reports" },
  ],
});

export default function Footer() {
  const { t, i18n } = useTranslation('common');
  const location = useLocation();

  const pathLang = getLanguageFromPath(location.pathname);
  const appLang = i18n.language?.startsWith("ar") || pathLang === "ar" ? "ar" : "en";
  const navigation = getNavigation(t);

  return (
    <>
      {/* Social Icons Row */}
      <div className={`bg-card ${SPACING.section.pySmall}`}>
        <div className="container">
          <div className={`flex items-center justify-center ${SPACING.gap.xlarge}`}>
            {social.map((item) => (
              <a
                key={item.name}
                href={item.href}
                aria-label={t("footer.social.followOn", { platform: item.name })}
                className={`p-2 rounded-md ${SPACING.touch.min} flex items-center justify-center text-muted-foreground hover:underline`}
              >
                <item.icon className={SPACING.icon.lg} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer style={{ backgroundColor: 'var(--footer-bg)' }}>
        <div className={`container ${SPACING.section.pySmall}`}>
          {/* 6-column grid with brand taking 2 columns (auto-mirrors in RTL) */}
          <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 ${SPACING.gap.xlarge}`} dir={appLang === "ar" ? "rtl" : "ltr"}>
            {/* Brand column - takes 2 columns on large screens */}
            <div className={`lg:col-span-2 ${SPACING.stack.relaxed}`} style={{ textAlign: appLang === "ar" ? "right" : "left" }}>
              <Link to={getLocalizedPath("/", appLang)} className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="font-poppins text-xl font-bold gradient-text">
                  Trade'n More
                </span>
              </Link>

              <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--footer-muted)', textAlign: appLang === "ar" ? "right" : "left" }}>
                {t("footer.description")}
              </p>

              <div className={`flex flex-col sm:flex-row ${SPACING.gap.button}`}>
                <Button
                  onClick={() => redirectToAuth(AUTH_URLS.MT5_WINDOWS, "mt5-download", "footer")}
                  className={`w-full ${SPACING.touch.button} rounded-lg text-base font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all duration-300 dark:bg-primary/20 dark:text-white dark:border-primary/30 dark:hover:bg-primary/30`}
                >
                  {t("footer.downloadMT5")}
                </Button>

                <Button
                  onClick={() => redirectToAuth(AUTH_URLS.REGISTRATION, "open-account", "footer")}
                  className={`w-full ${SPACING.touch.button} rounded-lg text-base font-semibold gradient-bg text-white shadow-primary hover:opacity-90 transition-all duration-300`}
                >
                  {t("footer.openAccount")}
                </Button>
              </div>
            </div>

            {/* Products column */}
            <div style={{ textAlign: appLang === "ar" ? "right" : "left" }}>
              <h3 className={`${SPACING.margin.heading} text-sm font-medium font-poppins`} style={{ color: 'var(--footer-text)' }}>
                {t("footer.sectionTitles.products")}
              </h3>
              <ul className={SPACING.stack.compact}>
                {navigation.products.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={getLocalizedPath(item.href, appLang)}
                      className="block text-sm hover:underline"
                      style={{ color: 'var(--footer-muted)' }}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Education column */}
            <div style={{ textAlign: appLang === "ar" ? "right" : "left" }}>
              <h3 className={`${SPACING.margin.heading} text-sm font-medium font-poppins`} style={{ color: 'var(--footer-text)' }}>
                {t("footer.sectionTitles.education")}
              </h3>
              <ul className={SPACING.stack.compact}>
                {navigation.education.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={getLocalizedPath(item.href, appLang)}
                      className="block text-sm hover:underline"
                      style={{ color: 'var(--footer-muted)' }}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Partners column */}
            <div style={{ textAlign: appLang === "ar" ? "right" : "left" }}>
              <h3 className={`${SPACING.margin.heading} text-sm font-medium font-poppins`} style={{ color: 'var(--footer-text)' }}>
                {t("footer.sectionTitles.partners")}
              </h3>
              <ul className={SPACING.stack.compact}>
                <li>
                  <Link
                    to={getLocalizedPath("/partners", appLang)}
                    className="block text-sm hover:underline"
                    style={{ color: 'var(--footer-muted)' }}
                  >
                    {t("footer.navigation.partners")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={getLocalizedPath("/get-funded", appLang)}
                    className="block text-sm hover:underline"
                    style={{ color: 'var(--footer-muted)' }}
                  >
                    {t("footer.navigation.getFunded")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support column */}
            <div style={{ textAlign: appLang === "ar" ? "right" : "left" }}>
              <h3 className={`${SPACING.margin.heading} text-sm font-medium font-poppins`} style={{ color: 'var(--footer-text)' }}>
                {t("footer.sectionTitles.support")}
              </h3>
              <ul className={SPACING.stack.compact}>
                <li>
                  <Link
                    to={getLocalizedPath("/contact", appLang)}
                    className="block text-sm hover:underline"
                    style={{ color: 'var(--footer-muted)' }}
                  >
                    {t("footer.navigation.contact")}
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() =>
                      openEmailClient(
                        "support@tradenmore.com",
                        "Support Request from Trade'n More Website",
                        "email",
                        "footer"
                      )
                    }
                    className="w-full text-sm hover:underline"
                    style={{ 
                      color: 'var(--footer-muted)',
                      textAlign: appLang === "ar" ? "right" : "left"
                    }}
                  >
                    {t("footer.emailUs")}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => redirectToAuth(AUTH_URLS.WHATSAPP, "whatsapp", "footer")}
                    className="w-full text-sm hover:underline"
                    style={{ 
                      color: 'var(--footer-muted)',
                      textAlign: appLang === "ar" ? "right" : "left"
                    }}
                  >
                    {t("footer.callUs")}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      const mapsUrl = "https://www.google.com/maps?q=Lebanon";
                      window.open(mapsUrl, "_blank", "noopener,noreferrer");
                    }}
                    className="w-full text-sm hover:underline"
                    style={{ 
                      color: 'var(--footer-muted)',
                      textAlign: appLang === "ar" ? "right" : "left"
                    }}
                  >
                    {t("footer.visitUs")}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Risk warning card */}
          <div className={`${SPACING.margin.headingHuge} pt-8`} style={{ borderTop: `1px solid var(--footer-divider)` }}>
            <div className={`rounded-lg ${SPACING.padding.card}`} style={{ backgroundColor: 'rgba(255,255,255,0.05)', textAlign: appLang === "ar" ? "right" : "left" }}>
              <h4 className={`${SPACING.margin.heading} text-sm font-medium font-poppins`} style={{ color: 'var(--footer-text)' }}>
                {t("footer.sectionTitles.riskWarning")}
              </h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--footer-muted)' }}>
                {t("footer.riskWarning")}
              </p>
            </div>
          </div>

          {/* Bottom legal row (mirrors automatically via dir) */}
          <div 
            className={`${SPACING.margin.section} pt-6 flex flex-col sm:flex-row items-center ${SPACING.gap.medium}`}
            style={{ 
              borderTop: `1px solid var(--footer-divider)`,
              justifyContent: appLang === "ar" ? "space-between" : "space-between",
              flexDirection: appLang === "ar" ? "row-reverse" : "row"
            }}
          >
            <div className={cn(
              `flex flex-wrap ${SPACING.gap.medium} footer-legal-links`,
              appLang === "ar" && "rtl:gap-6" // Enhanced Arabic spacing
            )} style={{ order: appLang === "ar" ? 2 : 1 }}>
              <Link
                to={getLocalizedPath("/privacy", appLang)}
                className="text-xs hover:underline transition-colors"
                style={{ color: 'var(--footer-muted)' }}
              >
                {t("footer.legal.privacyPolicy")}
              </Link>
              <Link
                to={getLocalizedPath("/terms", appLang)}
                className="text-xs hover:underline transition-colors"
                style={{ color: 'var(--footer-muted)' }}
              >
                {t("footer.legal.termsOfService")}
              </Link>
              <Link
                to={getLocalizedPath("/cookies", appLang)}
                className="text-xs hover:underline transition-colors"
                style={{ color: 'var(--footer-muted)' }}
              >
                {t("footer.legal.cookiePolicy")}
              </Link>
            </div>
            <p 
              className="text-xs" 
              style={{ 
                color: 'var(--footer-muted)',
                order: appLang === "ar" ? 1 : 2
              }}
            >
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}