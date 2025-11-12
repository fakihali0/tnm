import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SPACING } from "@/styles/spacing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  Clock, 
  DollarSign, 
  Shield, 
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { PaymentMethod } from "./PaymentMethodCard";
import { AUTH_URLS, trackButtonClick } from "@/utils/auth-redirects";

interface MethodDetailsDrawerProps {
  method: PaymentMethod | null;
  isOpen: boolean;
  onClose: () => void;
}

const getMethodIcon = (type: string) => {
  switch (type) {
    case 'card': return CreditCard;
    case 'bank': return Banknote;
    case 'wallet': return Smartphone;
    case 'crypto': return DollarSign;
    case 'local': return Banknote;
    default: return CreditCard;
  }
};

const getStepsForMethod = (method: PaymentMethod, direction: 'deposit' | 'withdrawal') => {
  if (direction === 'deposit') {
    switch (method.type) {
      case 'card':
        return [
          'Click "Deposit Now" and login to your account',
          'Select card payment method and enter amount',
          'Enter your card details securely',
          'Confirm the transaction',
          'Funds appear instantly in your account'
        ];
      case 'bank':
        return [
          'Click "Deposit Now" and login to your account',
          'Select bank transfer and get our banking details',
          'Transfer funds from your bank using provided reference',
          'Upload transfer confirmation (optional)',
          'Funds processed within 1-3 business days'
        ];
      case 'wallet':
        return [
          'Click "Deposit Now" and login to your account',
          'Select your e-wallet method',
          'Enter deposit amount and confirm',
          'Complete payment through your e-wallet',
          'Funds appear instantly in your account'
        ];
      case 'local':
        return [
          'Click "Deposit Now" and login to your account',
          'Select local payment method',
          'Get our local banking/transfer details',
          'Visit local agent or use online transfer',
          'Provide transaction reference to support'
        ];
      default:
        return ['Contact support for detailed instructions'];
    }
  } else {
    switch (method.type) {
      case 'card':
        return [
          'Login to your account and go to Withdrawals',
          'Select card withdrawal method',
          'Enter withdrawal amount (min/max limits apply)',
          'Confirm withdrawal request',
          'Funds processed back to your card within 1-3 days'
        ];
      case 'bank':
        return [
          'Login to your account and go to Withdrawals',
          'Add or select your bank account details',
          'Enter withdrawal amount and verify details',
          'Submit withdrawal request for processing',
          'Funds transferred to your bank within 1-3 business days'
        ];
      case 'wallet':
        return [
          'Login to your account and go to Withdrawals', 
          'Select your e-wallet method',
          'Enter your e-wallet account details',
          'Submit withdrawal request',
          'Funds processed to your e-wallet within 24 hours'
        ];
      case 'local':
        return [
          'Login to your account and go to Withdrawals',
          'Select local withdrawal method',
          'Provide your local account/pickup details',
          'Submit withdrawal request',
          'Collect funds from local agent or receive transfer'
        ];
      default:
        return ['Contact support for detailed instructions'];
    }
  }
};

export function MethodDetailsDrawer({ method, isOpen, onClose }: MethodDetailsDrawerProps) {
  if (!method) return null;

  const MethodIcon = getMethodIcon(method.type);

  const handleProceed = () => {
    trackButtonClick({
      buttonType: 'pm_method_proceed_drawer',
      buttonLocation: 'method-details'
    });
    window.open(AUTH_URLS.REGISTRATION, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className={`flex items-center ${SPACING.gap.button} ${SPACING.margin.paragraph}`}>
            <div className={`${SPACING.icon.xxl} rounded-lg bg-primary/10 flex items-center justify-center`}>
              <MethodIcon className={`${SPACING.icon.lg} text-primary`} />
            </div>
            <div>
              <SheetTitle className="text-xl">{method.name}</SheetTitle>
              <SheetDescription>
                {method.description || `Complete guide for ${method.name} transactions`}
              </SheetDescription>
            </div>
          </div>
          
          {/* Quick info badges */}
          <div className={`flex flex-wrap ${SPACING.gap.small} pt-2`}>
            <Badge variant="outline">{method.processingTime}</Badge>
            <Badge variant="outline">{method.fee} fee</Badge>
            <Badge variant={method.kyc === 'basic' ? 'secondary' : 'outline'}>
              {method.kyc} KYC
            </Badge>
            {method.regions.includes('global') ? (
              <Badge variant="secondary">Global</Badge>
            ) : (
              <Badge variant="outline">{method.regions.join(', ')}</Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="fees">Fees & Limits</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className={SPACING.stack.comfortable}>
            <div className={SPACING.stack.normal}>
              <h3 className="font-semibold">What is {method.name}?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {method.description || `${method.name} is a reliable payment method that allows you to fund your trading account securely.`}
              </p>
              
              <h4 className="font-medium mt-4">When to use:</h4>
              <ul className={`text-sm text-muted-foreground ${SPACING.stack.tight}`}>
                {method.type === 'card' && (
                  <>
                    <li>• For instant deposits and quick access to funds</li>
                    <li>• When you need immediate account funding</li>
                    <li>• For smaller to medium transaction amounts</li>
                  </>
                )}
                {method.type === 'bank' && (
                  <>
                    <li>• For large deposits with no fees</li>
                    <li>• When you prefer traditional banking methods</li>
                    <li>• For maximum security and verification</li>
                  </>
                )}
                {method.type === 'wallet' && (
                  <>
                    <li>• For fast, convenient transactions</li>
                    <li>• When you already use digital wallets</li>
                    <li>• For enhanced privacy and security</li>
                  </>
                )}
                {method.type === 'local' && (
                  <>
                    <li>• For deposits in local currency</li>
                    <li>• When using familiar local services</li>
                    <li>• For convenient regional access</li>
                  </>
                )}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="steps" className={SPACING.stack.comfortable}>
            <Tabs defaultValue="deposit" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="deposit" 
                  disabled={!method.directions.includes('deposit')}
                >
                  Deposit Steps
                </TabsTrigger>
                <TabsTrigger 
                  value="withdrawal"
                  disabled={!method.directions.includes('withdrawal')}
                >
                  Withdrawal Steps
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className={SPACING.stack.normal}>
                {method.directions.includes('deposit') ? (
                  <ol className={SPACING.stack.normal}>
                    {getStepsForMethod(method, 'deposit').map((step, index) => (
                      <li key={index} className={`flex ${SPACING.gap.button}`}>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">Deposits not available for this method.</p>
                )}
              </TabsContent>

              <TabsContent value="withdrawal" className={SPACING.stack.normal}>
                {method.directions.includes('withdrawal') ? (
                  <ol className={SPACING.stack.normal}>
                    {getStepsForMethod(method, 'withdrawal').map((step, index) => (
                      <li key={index} className={`flex ${SPACING.gap.button}`}>
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">Withdrawals not available for this method.</p>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="fees" className={SPACING.stack.comfortable}>
            <div className={`grid grid-cols-2 ${SPACING.gap.medium}`}>
              <div className={SPACING.stack.compact}>
                <h4 className={`font-medium flex items-center ${SPACING.gap.small}`}>
                  <DollarSign className={SPACING.icon.sm} />
                  Our Fee
                </h4>
                <p className="text-2xl font-bold">{method.fee}</p>
              </div>
              <div className={SPACING.stack.compact}>
                <h4 className={`font-medium flex items-center ${SPACING.gap.small}`}>
                  <Clock className={SPACING.icon.sm} />
                  Processing Time
                </h4>
                <p className="text-2xl font-bold">{method.processingTime}</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 ${SPACING.gap.medium} mt-6`}>
              <div className={SPACING.stack.compact}>
                <h4 className="font-medium">Transaction Limits</h4>
                <div className={`grid grid-cols-2 ${SPACING.gap.medium} text-sm`}>
                  <div>
                    <span className="text-muted-foreground">Min per transaction:</span>
                    <p className="font-medium">{method.minAmount}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max per transaction:</span>
                    <p className="font-medium">{method.maxAmount}</p>
                  </div>
                  {method.dailyLimit && (
                    <div>
                      <span className="text-muted-foreground">Daily limit:</span>
                      <p className="font-medium">{method.dailyLimit}</p>
                    </div>
                  )}
                  {method.monthlyLimit && (
                    <div>
                      <span className="text-muted-foreground">Monthly limit:</span>
                      <p className="font-medium">{method.monthlyLimit}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`bg-muted/30 ${SPACING.padding.cardSmall} rounded-lg`}>
              <div className={`flex items-start ${SPACING.gap.small}`}>
                <AlertTriangle className={`${SPACING.icon.sm} text-amber-500 mt-0.5 flex-shrink-0`} />
                <div className="text-sm">
                  <p className="font-medium">Additional Fees May Apply</p>
                  <p className="text-muted-foreground">
                    Third-party providers (banks, payment processors) may charge their own fees. 
                    Currency conversion fees may also apply.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className={SPACING.stack.comfortable}>
            <div className={SPACING.stack.comfortable}>
              <div>
                <h4 className={`font-medium flex items-center ${SPACING.gap.small} ${SPACING.margin.paragraph}`}>
                  <Shield className={SPACING.icon.sm} />
                  KYC Level: {method.kyc === 'basic' ? 'Basic' : 'Advanced'}
                </h4>
                <div className={`text-sm ${SPACING.stack.tight}`}>
                  {method.kyc === 'basic' ? (
                    <>
                      <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                        <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                        Identity verification (ID document)
                      </p>
                      <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                        <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                        Email and phone verification
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                        <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                        Full identity verification
                      </p>
                      <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                        <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                        Proof of address document
                      </p>
                      <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                        <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                        Source of funds verification
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h4 className={`font-medium ${SPACING.margin.paragraph}`}>Account Requirements</h4>
                <div className={`text-sm ${SPACING.stack.tight}`}>
                  <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                    <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                    Account must be in your name (same as trading account)
                  </p>
                  <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                    <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                    Supported currency and region
                  </p>
                  <p className={`flex items-center ${SPACING.gap.small} leading-tight`}>
                    <CheckCircle className={`${SPACING.icon.xs} text-primary flex-shrink-0 mt-0.5`} />
                    Sufficient funds for transaction and fees
                  </p>
                </div>
              </div>

              <div className={`bg-muted/30 ${SPACING.padding.cardSmall} rounded-lg`}>
                <div className={`flex items-start ${SPACING.gap.small}`}>
                  <HelpCircle className={`${SPACING.icon.sm} text-primary mt-0.5 flex-shrink-0`} />
                  <div className="text-sm">
                    <p className="font-medium">Need Help?</p>
                    <p className="text-muted-foreground">
                      Contact our support team if you need assistance with verification 
                      or have questions about requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-6 border-t">
          <Button onClick={handleProceed} className={`w-full ${SPACING.gap.small}`}>
            Proceed with {method.name}
            <ArrowUpRight className={SPACING.icon.sm} />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}