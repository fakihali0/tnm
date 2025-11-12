import { PaymentMethod } from "@/components/payments/PaymentMethodCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { getTranslatedPaymentMethod } from "@/utils/paymentMethodTranslations";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";

interface SimpleComparisonTableProps {
  methods: PaymentMethod[];
}

export const SimpleComparisonTable = ({ methods }: SimpleComparisonTableProps) => {
  const { t } = useTranslation();
  const { motionProps, transition, prefersReducedMotion } = useSectionAnimation();

  // Animation factory functions
  const buildReveal = (direction: "up" | "down" | "left" | "right" = "up", distance = 40, customTransition?: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction, distance, transition: customTransition }), prefersReducedMotion);

  const buildStagger = (stagger = 0.08, delayChildren = 0) =>
    resolveMotionVariants(createStaggerContainer({ stagger, delayChildren }), prefersReducedMotion);

  // Animation variants
  const tableVariants = buildReveal("up", 30, transition);
  const rowVariants = buildReveal("up", 20, { ...transition, duration: 0.4 });
  const rowContainer = buildStagger(0.05, 0.1);
  
  return (
    <motion.div
      {...motionProps}
      variants={tableVariants}
    >
      <Card>
      <CardHeader>
        <CardTitle>{t('paymentMethodsPage.comparisonTable.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
          <table className="w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="border-b border-border/50">
                <th className={`py-4 px-4 font-semibold bg-muted/30 ${i18n.language === 'ar' ? 'text-right' : 'text-left'} first:rounded-tl-md last:rounded-tr-md`}>
                  {t('paymentMethodsPage.comparisonTable.headers.method')}
                </th>
                <th className={`py-4 px-4 font-semibold bg-muted/30 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('paymentMethodsPage.comparisonTable.headers.fee')}
                </th>
                <th className={`py-4 px-4 font-semibold bg-muted/30 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('paymentMethodsPage.comparisonTable.headers.limits')}
                </th>
                <th className={`py-4 px-4 font-semibold bg-muted/30 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('paymentMethodsPage.comparisonTable.headers.processing')}
                </th>
                <th className={`py-4 px-4 font-semibold bg-muted/30 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('paymentMethodsPage.comparisonTable.headers.kyc')}
                </th>
                <th className={`py-4 px-4 font-semibold bg-muted/30 ${i18n.language === 'ar' ? 'text-right' : 'text-left'} first:rounded-tl-md last:rounded-tr-md`}>
                  {t('paymentMethodsPage.comparisonTable.headers.currencies')}
                </th>
              </tr>
            </thead>
            <motion.tbody
              variants={rowContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ amount: 0.2, once: true }}
            >
              {methods.map((method, index) => {
                const translatedMethod = getTranslatedPaymentMethod(method, t);
                const isLast = index === methods.length - 1;
                return (
                  <motion.tr 
                    key={method.id} 
                    className={`border-b border-border/30 hover:bg-muted/20 transition-colors ${isLast ? 'border-b-0' : ''}`}
                    variants={rowVariants}
                    whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
                    transition={{ duration: 0.15 }}
                  >
                    <td className={`py-4 px-4 ${i18n.language === 'ar' ? 'text-right' : 'text-left'} ${isLast ? 'rounded-bl-md' : ''}`}>
                      <div className="font-medium text-foreground mb-1">{translatedMethod.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {method.regions.includes('global') ? t('paymentMethodsPage.comparisonTable.status.global') : method.regions.join(', ')}
                      </div>
                    </td>
                    <td className={`py-4 px-4 font-medium text-foreground ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {translatedMethod.fee}
                    </td>
                    <td className={`py-4 px-4 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <div className="text-sm">
                        <div className="font-medium text-foreground mb-1">{method.minAmount} - {method.maxAmount}</div>
                        <div className="text-xs text-muted-foreground">
                          {t('paymentMethodsPage.comparisonTable.labels.daily')}: {method.dailyLimit}
                        </div>
                      </div>
                    </td>
                    <td className={`py-4 px-4 text-foreground ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {translatedMethod.processingTime}
                    </td>
                    <td className={`py-4 px-4 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                      <Badge variant={method.kyc === 'basic' ? 'secondary' : 'outline'} className="text-xs">
                        {method.kyc === 'basic' ? t('paymentMethodsPage.comparisonTable.status.basic') : t('paymentMethodsPage.comparisonTable.status.advanced')}
                      </Badge>
                    </td>
                    <td className={`py-4 px-4 ${i18n.language === 'ar' ? 'text-right' : 'text-left'} ${isLast ? 'rounded-br-md' : ''}`}>
                      <div className={`flex gap-1 flex-wrap ${i18n.language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                        {method.currencies.slice(0, 3).map((currency) => (
                          <Badge key={currency} variant="outline" className="text-xs">
                            {currency}
                          </Badge>
                        ))}
                        {method.currencies.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{method.currencies.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </motion.tbody>
          </table>
        </div>
      </CardContent>
      </Card>
    </motion.div>
  );
};