import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, AlertTriangle } from "lucide-react";
import { PaymentMethod } from "./PaymentMethodCard";
import { trackButtonClick, AUTH_URLS } from "@/utils/auth-redirects";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { getTranslatedPaymentMethod } from "@/utils/paymentMethodTranslations";
import { motion, type Transition } from "framer-motion";
import { useSectionAnimation } from "@/hooks/useSectionAnimation";
import { createRevealVariants, createStaggerContainer, resolveMotionVariants } from "@/components/animation/variants";
import { SPACING } from "@/styles/spacing";

interface FeeEstimatorProps {
  methods: PaymentMethod[];
  className?: string;
}

export function FeeEstimator({ methods, className }: FeeEstimatorProps) {
  const { t } = useTranslation();
  const { motionProps, transition, prefersReducedMotion } = useSectionAnimation();
  const [direction, setDirection] = useState<'deposit' | 'withdrawal'>('deposit');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [amount, setAmount] = useState<string>('1000');

  // Animation factory functions
  const buildReveal = (direction: "up" | "down" | "left" | "right" = "up", distance = 40, customTransition?: Transition) =>
    resolveMotionVariants(createRevealVariants({ direction, distance, transition: customTransition }), prefersReducedMotion);

  const buildStagger = (stagger = 0.1, delayChildren = 0) =>
    resolveMotionVariants(createStaggerContainer({ stagger, delayChildren }), prefersReducedMotion);

  // Animation variants
  const cardVariants = buildReveal("up", 30, transition);
  const formVariants = buildReveal("up", 20, { ...transition, delay: 0.1 });
  const resultsVariants = buildReveal("up", 30, { ...transition, duration: 0.5 });
  const badgeContainer = buildStagger(0.05, 0.1);

  const selectedMethod = methods.find(m => m.id === selectedMethodId);
  
  // Get available currencies based on selected method
  const getAvailableCurrencies = () => {
    if (selectedMethod) {
      return selectedMethod.currencies;
    }
    // When no method is selected, show USD by default
    return ['USD'];
  };

  const availableCurrencies = getAvailableCurrencies();

  const availableMethods = methods.filter(method => 
    method.directions.includes(direction)
  ).map(method => getTranslatedPaymentMethod(method, t));

  const calculateFee = () => {
    if (!selectedMethod || !amount) return null;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return null;

    // Parse fee percentage (e.g., "1.9%" -> 1.9, "0%" -> 0)
    const feeStr = selectedMethod.fee.replace('%', '').replace('Network fees apply', '0');
    const feePercentage = parseFloat(feeStr) || 0;
    
    const feeAmount = (numAmount * feePercentage) / 100;
    const netAmount = direction === 'deposit' 
      ? numAmount - feeAmount  // For deposits, you pay fee, receive less
      : numAmount + feeAmount; // For withdrawals, fee is added to request

    return {
      originalAmount: numAmount,
      feeAmount,
      netAmount: direction === 'deposit' ? numAmount : numAmount - feeAmount,
      totalCost: direction === 'deposit' ? numAmount + feeAmount : numAmount
    };
  };

  const result = calculateFee();

  // Handle method selection change
  const handleMethodChange = (methodId: string) => {
    setSelectedMethodId(methodId);
    const method = methods.find(m => m.id === methodId);
    if (method) {
      // Auto-set currency based on method type
      if (method.type === 'crypto') {
        setCurrency('USDT');
      } else {
        setCurrency('USD');
      }
    }
  };

  const handleCalculate = () => {
    trackButtonClick({
      buttonType: 'pm_fee_estimate',
      buttonLocation: 'fee-estimator'
    });
    
    // Redirect to login page
    window.open(AUTH_URLS.LOGIN, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      {...motionProps}
      variants={cardVariants}
      className={className}
    >
      <Card>
      <CardHeader>
        <CardTitle className={`flex items-center ${SPACING.gap.small}`}>
          <Calculator className={`${SPACING.icon.md} w-5`} />
          {t('paymentMethodsPage.feeEstimator.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('paymentMethodsPage.feeEstimator.description')}
        </p>
      </CardHeader>

      <CardContent className={SPACING.stack.comfortable} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div 
          className={`grid grid-cols-1 md:grid-cols-4 ${SPACING.gap.medium}`}
          variants={formVariants}
        >
          {/* Direction */}
          <div className={SPACING.stack.compact}>
            <Label>{t('paymentMethodsPage.feeEstimator.labels.direction')}</Label>
            <div className="flex rounded-lg border p-1">
              <button
                onClick={() => {
                  setDirection('deposit');
                  setSelectedMethodId('');
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  direction === 'deposit'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {t('paymentMethodsPage.feeEstimator.directions.deposit')}
              </button>
              <button
                onClick={() => {
                  setDirection('withdrawal');
                  setSelectedMethodId('');
                }}
                className={`flex-1 px-3 py-2 text-sm rounded-md transition-colors ${
                  direction === 'withdrawal'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {t('paymentMethodsPage.feeEstimator.directions.withdrawal')}
              </button>
            </div>
          </div>

          {/* Method */}
          <div className={SPACING.stack.compact}>
            <Label>{t('paymentMethodsPage.feeEstimator.labels.method')}</Label>
            <Select value={selectedMethodId} onValueChange={handleMethodChange}>
              <SelectTrigger>
                <SelectValue placeholder={t('paymentMethodsPage.feeEstimator.placeholders.selectMethod')} />
              </SelectTrigger>
              <SelectContent>
                {availableMethods.map(method => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name} ({method.fee})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className={SPACING.stack.compact}>
            <Label>{t('paymentMethodsPage.feeEstimator.labels.currency')}</Label>
            <Select 
              value={currency} 
              onValueChange={(value) => {
                setCurrency(value);
                setSelectedMethodId('');
              }}
              disabled={selectedMethod !== undefined}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map(curr => (
                  <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className={SPACING.stack.compact}>
            <Label>{t('paymentMethodsPage.feeEstimator.labels.amount')} ({currency})</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('paymentMethodsPage.feeEstimator.placeholders.enterAmount')}
              min="1"
            />
          </div>
        </motion.div>

        {/* Results */}
        {result && selectedMethod && (
          <motion.div 
            className="border rounded-lg p-4 bg-muted/20"
            variants={resultsVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <h4 className="font-medium mb-3">{t('paymentMethodsPage.feeEstimator.results.estimationFor')} {selectedMethod.name}</h4>
            
            <div className={`grid grid-cols-1 md:grid-cols-3 ${SPACING.gap.medium} mb-4`}>
              <div className="text-center p-3 bg-background rounded-md">
                <div className="text-sm text-muted-foreground">
                  {direction === 'deposit' ? t('paymentMethodsPage.feeEstimator.results.youPay') : t('paymentMethodsPage.feeEstimator.results.youRequest')}
                </div>
                <div className="text-lg font-bold">
                  {currency} {direction === 'deposit' ? result.totalCost.toFixed(2) : result.originalAmount.toFixed(2)}
                </div>
              </div>
              
              <div className="text-center p-3 bg-background rounded-md">
                <div className="text-sm text-muted-foreground">{t('paymentMethodsPage.feeEstimator.results.estimatedFee')}</div>
                <div className="text-lg font-bold text-red-600">
                  {currency} {result.feeAmount.toFixed(2)}
                </div>
              </div>
              
              <div className="text-center p-3 bg-primary/10 rounded-md">
                <div className="text-sm text-muted-foreground">
                  {direction === 'deposit' ? t('paymentMethodsPage.feeEstimator.results.youReceive') : t('paymentMethodsPage.feeEstimator.results.netWithdrawal')}
                </div>
                <div className="text-lg font-bold text-primary">
                  {currency} {result.netAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <motion.div 
              className={`flex flex-wrap ${SPACING.gap.small} mb-4`}
              variants={badgeContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={buildReveal("up", 15, { duration: 0.3 })}>
                <Badge variant="outline">
                  {t('paymentMethodsPage.feeEstimator.results.processing')}: {selectedMethod.processingTime}
                </Badge>
              </motion.div>
              <motion.div variants={buildReveal("up", 15, { duration: 0.3 })}>
                <Badge variant="outline">
                  {t('paymentMethodsPage.feeEstimator.results.min')}: {selectedMethod.minAmount}
                </Badge>
              </motion.div>
              <motion.div variants={buildReveal("up", 15, { duration: 0.3 })}>
                <Badge variant="outline">
                  {t('paymentMethodsPage.feeEstimator.results.max')}: {selectedMethod.maxAmount}
                </Badge>
              </motion.div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button onClick={handleCalculate} className="w-full" size="sm">
                {t('paymentMethodsPage.feeEstimator.results.proceedWith')} {selectedMethod.name}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {!result && amount && selectedMethod && (
          <div className="text-center py-4 text-muted-foreground">
            <p>{t('paymentMethodsPage.feeEstimator.validation.validAmount')}</p>
          </div>
        )}

        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
          <div className={`flex items-start ${SPACING.gap.small}`}>
            <AlertTriangle className={`w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0`} />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">{t('paymentMethodsPage.feeEstimator.disclaimer.title')}</p>
              <p>
                {t('paymentMethodsPage.feeEstimator.disclaimer.text')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
  );
}