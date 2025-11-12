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

const PRIVACY_COPY: Record<string, LegalContent> = {
  en: {
    metaTitle: "Privacy Policy | Trade'n More",
    metaDescription:
      "Learn how Trade'n More collects, uses, and protects your personal information across our trading services.",
    title: "Privacy Policy",
    intro:
      "This Privacy Policy explains how Trade'n More collects, uses, and protects your information when you interact with our platforms, services, and partners.",
    lastUpdated: "Last updated: January 12, 2025",
    sections: [
      {
        heading: "1. Information We Collect",
        body: [
          "We collect information that you provide directly to us, such as your name, email address, contact details, and documents shared during onboarding.",
          "We also gather usage data automatically, including device information, log data, and analytics that help us improve our services and keep your account secure."
        ]
      },
      {
        heading: "2. How We Use Your Information",
        body: [
          "Your information allows us to deliver our trading services, verify your identity, prevent fraud, and comply with regulatory obligations.",
          "We may also use your contact details to share service updates, educational resources, or marketing messages. You can opt out of promotional communications at any time."
        ]
      },
      {
        heading: "3. Sharing and Retention",
        body: [
          "We only share personal data with trusted providers who help us operate our platform, process payments, or meet compliance requirements.",
          "We retain your information for as long as necessary to provide our services and meet legal obligations, after which it is securely deleted or anonymized."
        ]
      }
    ],
    closingNote:
      "If you have questions about this Privacy Policy or wish to exercise your data rights, please reach out to privacy@tradenmore.com."
  },
  ar: {
    metaTitle: "سياسة الخصوصية | تريد أند مور",
    metaDescription: "اكتشف كيفية جمع وحماية بياناتك الشخصية عند استخدام خدمات تريد أند مور للتداول.",
    title: "سياسة الخصوصية",
    intro:
      "توضح هذه السياسة كيفية قيام تريد أند مور بجمع بياناتك الشخصية واستخدامها وحمايتها عند استخدامك لمنصاتنا وخدماتنا.",
    lastUpdated: "آخر تحديث: 12 يناير 2025",
    sections: [
      {
        heading: "1. المعلومات التي نجمعها",
        body: [
          "نجمع البيانات التي تزودنا بها مباشرة مثل اسمك وبريدك الإلكتروني ووسائل الاتصال وأي مستندات مطلوبة لفتح الحساب.",
          "كما نقوم بجمع بيانات استخدام تلقائية تشمل معلومات الجهاز وسجلات النشاط والتحليلات لمساعدتنا على تحسين الخدمات وحماية حسابك."
        ]
      },
      {
        heading: "2. كيفية استخدام المعلومات",
        body: [
          "نستخدم بياناتك لتقديم خدمات التداول والتحقق من الهوية ومنع الاحتيال والالتزام بالمتطلبات التنظيمية.",
          "قد نرسل إليك تحديثات للخدمة أو موارد تعليمية أو رسائل تسويقية، ويمكنك إلغاء الاشتراك في الرسائل التسويقية في أي وقت."
        ]
      },
      {
        heading: "3. المشاركة والاحتفاظ",
        body: [
          "لا نشارك بياناتك إلا مع مزودي الخدمات الموثوقين الذين يساعدوننا في تشغيل المنصة أو معالجة المدفوعات أو تلبية المتطلبات القانونية.",
          "نحتفظ ببياناتك فقط للمدة اللازمة لتقديم الخدمة والوفاء بالالتزامات القانونية، ثم نقوم بحذفها أو إخفاء هويتها بشكل آمن."
        ]
      }
    ],
    closingNote:
      "للاستفسار عن سياسة الخصوصية أو لممارسة حقوقك المتعلقة بالبيانات، يرجى التواصل عبر privacy@tradenmore.com."
  }
};

export default function Privacy() {
  const location = useLocation();
  const language = getLanguageFromPath(location.pathname);

  const content = useMemo(() => PRIVACY_COPY[language] ?? PRIVACY_COPY.en, [language]);

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
