import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SPACING } from "@/styles/spacing";
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Clock, 
  DollarSign, 
  Shield,
  ArrowUpRight,
  HelpCircle,
  Download,
  Upload
} from "lucide-react";
import { trackButtonClick, AUTH_URLS } from "@/utils/auth-redirects";

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'wallet' | 'crypto' | 'local';
  directions: ('deposit' | 'withdrawal')[];
  regions: string[];
  currencies: string[];
  processingTime: string;
  fee: string;
  minAmount: string;
  maxAmount: string;
  dailyLimit?: string;
  monthlyLimit?: string;
  kyc: 'basic' | 'advanced';
  logo?: string;
  description?: string;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onViewDetails: (method: PaymentMethod) => void;
  className?: string;
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

export function PaymentMethodCard({ method, onViewDetails, className }: PaymentMethodCardProps) {
  const MethodIcon = getMethodIcon(method.type);

  const handleUseMethod = () => {
    trackButtonClick({
      buttonType: 'pm_method_proceed',
      buttonLocation: 'method-card'
    });
    window.open(AUTH_URLS.REGISTRATION, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="group relative overflow-hidden border border-border/20 hover:border-primary/20 hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-0">
        {/* Header Section */}
        <div className={`${SPACING.padding.card} ${SPACING.stack.comfortable}`}>
          {/* Icon and Name */}
          <div className={`flex items-start ${SPACING.gap.medium}`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
              <MethodIcon className={`${SPACING.icon.lg} text-primary`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground mb-1 truncate">{method.name}</h3>
              <div className={SPACING.stack.tight}>
                <p className="text-sm text-muted-foreground">
                  {method.regions.includes('global') ? 'Available Globally' : method.regions.join(', ')}
                </p>
                <div className={`flex items-center ${SPACING.gap.small}`}>
                  <div className={`flex items-center ${SPACING.gap.iconButton} text-xs text-muted-foreground`}>
                    <Clock className={SPACING.icon.xs} />
                    {method.processingTime}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                  <Badge variant="outline" className="text-xs font-medium border-primary/20 text-primary">
                    {method.fee}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Directions */}
          <div className={`flex ${SPACING.gap.small}`}>
            {method.directions.map((direction) => (
              <div key={direction} className={`flex items-center ${SPACING.gap.iconButton} px-3 py-1 rounded-full bg-muted/50 text-xs font-medium`}>
                {direction === 'deposit' ? (
                  <Download className={`${SPACING.icon.xs} text-green-600`} />
                ) : (
                  <Upload className={`${SPACING.icon.xs} text-blue-600`} />
                )}
                {direction === 'deposit' ? 'Deposit' : 'Withdrawal'}
              </div>
            ))}
          </div>

          {/* Action Button */}
          <Button 
            onClick={handleUseMethod} 
            className={`w-full ${SPACING.gap.small} font-semibold group/btn`}
            size="lg"
          >
            Get Started
            <ArrowUpRight className={`${SPACING.icon.sm} transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}