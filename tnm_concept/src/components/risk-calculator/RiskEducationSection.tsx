import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Brain, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function RiskEducationSection() {
  const { t } = useTranslation('risk-calculator');

  const cards = [
    {
      icon: Shield,
      title: t('education.whyMatters.title'),
      description: t('education.whyMatters.description'),
      stat: t('education.whyMatters.stat'),
      points: [
        t('education.whyMatters.points.0'),
        t('education.whyMatters.points.1'),
        t('education.whyMatters.points.2')
      ],
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: TrendingUp,
      title: t('education.bestPractices.title'),
      description: t('education.bestPractices.description'),
      stat: t('education.bestPractices.stat'),
      points: [
        t('education.bestPractices.points.0'),
        t('education.bestPractices.points.1'),
        t('education.bestPractices.points.2')
      ],
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: AlertTriangle,
      title: t('education.mistakes.title'),
      description: t('education.mistakes.description'),
      stat: t('education.mistakes.stat'),
      points: [
        t('education.mistakes.list.0'),
        t('education.mistakes.list.1'),
        t('education.mistakes.list.2')
      ],
      color: "from-orange-500/20 to-red-500/20"
    }
  ];

  return (
    <section className="container py-16">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          <Brain className="h-3 w-3 mr-2" />
          {t('education.badge')}
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t('education.title')}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('education.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full hover-scale">
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-6 w-6" />
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {card.description}
                  </p>
                  <Badge variant="secondary" className="mb-4">
                    {card.stat}
                  </Badge>
                </div>

                <ul className="space-y-2">
                  {card.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
