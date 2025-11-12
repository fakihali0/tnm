import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function UseCasesShowcase() {
  const { t } = useTranslation('risk-calculator');

  const useCases = [
    {
      icon: Clock,
      title: t('useCases.dayTrading.title'),
      description: t('useCases.dayTrading.description'),
      example: t('useCases.dayTrading.example'),
      color: "from-purple-500/20 to-pink-500/20",
      badge: t('useCases.dayTrading.badge')
    },
    {
      icon: Calendar,
      title: t('useCases.swingTrading.title'),
      description: t('useCases.swingTrading.description'),
      example: t('useCases.swingTrading.example'),
      color: "from-blue-500/20 to-indigo-500/20",
      badge: t('useCases.swingTrading.badge')
    },
    {
      icon: TrendingUp,
      title: t('useCases.positionTrading.title'),
      description: t('useCases.positionTrading.description'),
      example: t('useCases.positionTrading.example'),
      color: "from-green-500/20 to-teal-500/20",
      badge: t('useCases.positionTrading.badge')
    }
  ];

  return (
    <section className="container py-16">
      <div className="text-center mb-12">
        <Badge variant="secondary" className="mb-4">
          {t('useCases.badge')}
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          {t('useCases.title')}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('useCases.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {useCases.map((useCase, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Card className="h-full hover-scale">
              <CardContent className="p-6 space-y-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center`}>
                  <useCase.icon className="h-7 w-7" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{useCase.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {useCase.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {useCase.description}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('useCases.exampleLabel')}
                  </p>
                  <p className="text-sm font-medium">{useCase.example}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
