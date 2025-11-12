import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { Layout } from "@/components/layout/Layout";
import { getLanguageFromPath } from "@/i18n";

type LegalSection = {
  heading: string;
  body: string[];
};

type LegalContent = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
  closingNote: string;
};

const COOKIE_COPY: Record<string, LegalContent> = {
  en: {
    metaTitle: "Cookie Policy | Trade'n More",
    metaDescription:
      "Understand how Trade'n More uses cookies and similar technologies to deliver a secure and personalized trading experience.",
    title: "Cookie Policy",
    intro:
      "We use cookies and similar tracking technologies to provide a tailored experience, monitor platform performance, and support essential security measures.",
    lastUpdated: "Last updated: January 12, 2025",
    sections: [
      {
        heading: "1. What Are Cookies?",
        body: [
          "Cookies are small text files stored on your device. They help us remember your preferences, keep you signed in, and understand how our services are used.",
          "Some cookies are essential for the platform to function, while others improve performance or deliver optional features."
        ]
      },
      {
        heading: "2. Types of Cookies We Use",
        body: [
          "Essential cookies keep your account sessions secure and enable core functionality such as account access and language settings.",
          "Analytics and performance cookies help us measure traffic, identify issues, and enhance features. Marketing cookies may be used to deliver relevant communications when permitted."
        ]
      },
      {
        heading: "3. Managing Your Preferences",
        body: [
          "Most browsers allow you to manage or disable cookies. You can also clear stored cookies at any time through your browser settings.",
          "Disabling certain cookies might impact site performance or limit access to specific features."
        ]
      }
    ],
    closingNote:
      "If you have questions about how we use cookies, please contact privacy@tradenmore.com."
  },
  ar: {
    metaTitle: "سياسة ملفات تعريف الارتباط | تريد أند مور",
    metaDescription: "تعرّف على كيفية استخدام تريد أند مور لملفات تعريف الارتباط والتقنيات المشابهة لتقديم تجربة تداول مخصصة وآمنة.",
    title: "سياسة ملفات تعريف الارتباط",
    intro:
      "نستخدم ملفات تعريف الارتباط وتقنيات التتبع المماثلة لتقديم تجربة مخصصة ومراقبة أداء المنصة ودعم إجراءات الأمان الأساسية.",
    lastUpdated: "آخر تحديث: 12 يناير 2025",
    sections: [
      {
        heading: "1. ما هي ملفات تعريف الارتباط؟",
        body: [
          "هي ملفات نصية صغيرة تُخزَّن على جهازك وتساعدنا على تذكر تفضيلاتك والحفاظ على تسجيل الدخول وفهم كيفية استخدام خدماتنا.",
          "بعض الملفات ضرورية لعمل المنصة، بينما يعمل البعض الآخر على تحسين الأداء أو توفير ميزات اختيارية."
        ]
      },
      {
        heading: "2. أنواع الملفات التي نستخدمها",
        body: [
          "تحافظ ملفات الارتباط الأساسية على أمان جلسات الحساب وتمكِّن الوظائف الأساسية مثل الوصول للحساب وإعدادات اللغة.",
          "تساعدنا ملفات التحليلات والأداء على قياس حركة المرور وتحديد المشكلات وتحسين الميزات، وقد نستخدم ملفات تسويقية لتقديم رسائل ذات صلة عند السماح بذلك."
        ]
      },
      {
        heading: "3. إدارة التفضيلات",
        body: [
          "تتيح معظم المتصفحات التحكم في ملفات تعريف الارتباط أو تعطيلها، كما يمكنك حذفها في أي وقت من إعدادات المتصفح.",
          "قد يؤثر تعطيل بعض الملفات على أداء الموقع أو يحد من الوصول إلى ميزات معينة."
        ]
      }
    ],
    closingNote:
      "للاستفسار حول كيفية استخدامنا لملفات تعريف الارتباط، يرجى التواصل عبر privacy@tradenmore.com."
  }
};

export default function Cookies() {
  const location = useLocation();
  const language = getLanguageFromPath(location.pathname);

  const content = useMemo(() => COOKIE_COPY[language] ?? COOKIE_COPY.en, [language]);

  return (
    <Layout title={content.metaTitle} description={content.metaDescription}>
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto flex max-w-4xl flex-col gap-12">
          <header className="space-y-4 text-center md:text-left">
            <p className="text-sm text-muted-foreground">{content.lastUpdated}</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{content.title}</h1>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">{content.intro}</p>
          </header>

          <div className="space-y-10">
            {content.sections.map((section) => (
              <article key={section.heading} className="space-y-3">
                <h2 className="text-xl font-semibold md:text-2xl">{section.heading}</h2>
                {section.body.map((paragraph, index) => (
                  <p key={index} className="leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>

          <footer className="rounded-lg bg-muted/30 p-6 text-sm leading-relaxed text-muted-foreground">
            {content.closingNote}
          </footer>
        </div>
      </section>
    </Layout>
  );
}
