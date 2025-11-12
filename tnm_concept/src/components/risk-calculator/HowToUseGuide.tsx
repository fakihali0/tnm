import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export function HowToUseGuide() {
  const { t } = useTranslation('risk-calculator');

  const steps = [
    {
      number: "01",
      title: t('education.howToUse.steps.0'),
      description: t('education.howToUse.stepsDesc.0')
    },
    {
      number: "02",
      title: t('education.howToUse.steps.1'),
      description: t('education.howToUse.stepsDesc.1')
    },
    {
      number: "03",
      title: t('education.howToUse.steps.2'),
      description: t('education.howToUse.stepsDesc.2')
    },
    {
      number: "04",
      title: t('education.howToUse.steps.3'),
      description: t('education.howToUse.stepsDesc.3')
    },
    {
      number: "05",
      title: t('education.howToUse.steps.4'),
      description: t('education.howToUse.stepsDesc.4')
    }
  ];

  return (
    <section className="container py-16 bg-muted/30">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          <BookOpen className="h-3 w-3 mr-2" />
          {t('education.howToUse.badge')}
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t('education.howToUse.title')}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('education.howToUse.subtitle')}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="hover-scale">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{step.number}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
