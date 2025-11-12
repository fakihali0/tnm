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

const TERMS_COPY: Record<string, LegalContent> = {
  en: {
    metaTitle: "Terms of Service | Trade'n More",
    metaDescription:
      "Review the terms that govern your use of Trade'n More platforms, trading accounts, and educational services.",
    title: "Terms of Service",
    intro:
      "These Terms of Service describe the rules that apply when you create an account, access our platforms, or participate in any Trade'n More program.",
    lastUpdated: "Last updated: January 12, 2025",
    sections: [
      {
        heading: "1. Accepting the Terms",
        body: [
          "By creating an account or using our services you agree to comply with these Terms, our Privacy Policy, and any additional guidelines we publish.",
          "If you use our services on behalf of an organization, you confirm that you have the authority to bind that organization to these Terms."
        ]
      },
      {
        heading: "2. Eligibility and Accounts",
        body: [
          "You must be of legal age and satisfy our compliance checks to open or maintain an account. We may request additional documentation at any time.",
          "You are responsible for safeguarding your login credentials and notifying us immediately if you suspect unauthorized access."
        ]
      },
      {
        heading: "3. Platform Usage",
        body: [
          "Our trading tools and educational materials are provided for lawful use only. You must not manipulate markets, engage in fraudulent behavior, or misuse platform data.",
          "We reserve the right to suspend or terminate access if we detect violations, security risks, or activity that may harm other users."
        ]
      }
    ],
    closingNote:
      "For questions about these Terms or requests related to account management, contact us at support@tradenmore.com."
  },
  ar: {
    metaTitle: "شروط الخدمة | تريد أند مور",
    metaDescription: "راجع الشروط التي تنظم استخدامك لمنصات تريد أند مور وحسابات التداول والخدمات التعليمية.",
    title: "شروط الخدمة",
    intro:
      "توضح هذه الشروط القواعد التي تنطبق عند إنشاء حساب أو استخدام منصات تريد أند مور أو المشاركة في أي من برامجنا.",
    lastUpdated: "آخر تحديث: 12 يناير 2025",
    sections: [
      {
        heading: "1. قبول الشروط",
        body: [
          "عند إنشاء حساب أو استخدام خدماتنا فإنك توافق على الالتزام بهذه الشروط وسياسة الخصوصية وأي إرشادات إضافية نقوم بنشرها.",
          "إذا كنت تستخدم خدماتنا نيابةً عن جهة ما فأنت تقر بأن لديك الصلاحية القانونية لإلزام تلك الجهة بهذه الشروط."
        ]
      },
      {
        heading: "2. الأهلية والحسابات",
        body: [
          "يجب أن تكون بالغًا قانونيًا وأن تجتاز إجراءات الامتثال الخاصة بنا لفتح أو الحفاظ على الحساب، وقد نطلب مستندات إضافية في أي وقت.",
          "أنت مسؤول عن حماية بيانات تسجيل الدخول وإبلاغنا فورًا إذا اشتبهت في أي وصول غير مصرح به."
        ]
      },
      {
        heading: "3. استخدام المنصة",
        body: [
          "تُقدَّم أدوات التداول والمواد التعليمية للاستخدام القانوني فقط، ويُحظر التلاعب بالأسواق أو ارتكاب أي سلوك احتيالي أو إساءة استخدام بيانات المنصة.",
          "نحتفظ بالحق في تعليق أو إنهاء الوصول إذا اكتشفنا انتهاكات أو مخاطر أمنية أو نشاطًا قد يضر بالمستخدمين الآخرين."
        ]
      }
    ],
    closingNote:
      "للاستفسار حول هذه الشروط أو لطلبات متعلقة بإدارة الحساب، يرجى التواصل عبر support@tradenmore.com."
  }
};

export default function Terms() {
  const location = useLocation();
  const language = getLanguageFromPath(location.pathname);

  const content = useMemo(() => TERMS_COPY[language] ?? TERMS_COPY.en, [language]);

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
