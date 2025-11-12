import { PaymentMethod } from "@/components/payments/PaymentMethodCard";
import { TFunction } from "i18next";

// Translation mapping for payment method names
export const getTranslatedMethodName = (methodId: string, t: TFunction): string => {
  const translations: Record<string, string> = {
    "local-bank": t('paymentMethodsPage.paymentMethods.localBank'),
    "omt": t('paymentMethodsPage.paymentMethods.omt'),
    "wish-money": t('paymentMethodsPage.paymentMethods.whishMoney'),
    "vision-express": t('paymentMethodsPage.paymentMethods.visionExpress'),
    "bob-finance": t('paymentMethodsPage.paymentMethods.bobFinance'),
    "crypto-usdt": t('paymentMethodsPage.paymentMethods.cryptoUsdt'),
  };
  
  return translations[methodId] || methodId;
};

// Translation mapping for processing times
export const getTranslatedProcessingTime = (processingTime: string, t: TFunction): string => {
  const lowerTime = processingTime.toLowerCase();
  
  if (lowerTime.includes('instant')) {
    return t('paymentMethodsPage.paymentMethods.processingTimes.instant');
  }
  if (lowerTime.includes('same')) {
    return t('paymentMethodsPage.paymentMethods.processingTimes.sameDay');
  }
  if (lowerTime.includes('business') || lowerTime.includes('1-3')) {
    return t('paymentMethodsPage.paymentMethods.processingTimes.businessDays');
  }
  
  return processingTime;
};

// Translation mapping for fees
export const getTranslatedFee = (fee: string, t: TFunction): string => {
  if (fee === "Depends on bank") {
    return t('paymentMethodsPage.paymentMethods.fees.dependsOnBank');
  }
  if (fee === "0%") {
    return t('paymentMethodsPage.paymentMethods.fees.zeroPercent');
  }
  
  return fee;
};

// Translation mapping for descriptions
export const getTranslatedDescription = (methodId: string, t: TFunction): string => {
  const translations: Record<string, string> = {
    "local-bank": t('paymentMethodsPage.paymentMethods.descriptions.localBank'),
    "omt": t('paymentMethodsPage.paymentMethods.descriptions.omt'),
    "wish-money": t('paymentMethodsPage.paymentMethods.descriptions.whishMoney'),
    "vision-express": t('paymentMethodsPage.paymentMethods.descriptions.visionExpress'),
    "bob-finance": t('paymentMethodsPage.paymentMethods.descriptions.bobFinance'),
    "crypto-usdt": t('paymentMethodsPage.paymentMethods.descriptions.cryptoUsdt'),
  };
  
  return translations[methodId] || '';
};

// Get fully translated payment method
export const getTranslatedPaymentMethod = (method: PaymentMethod, t: TFunction): PaymentMethod => {
  return {
    ...method,
    name: getTranslatedMethodName(method.id, t),
    processingTime: getTranslatedProcessingTime(method.processingTime, t),
    fee: getTranslatedFee(method.fee, t),
    description: getTranslatedDescription(method.id, t),
  };
};