import { PaymentMethod } from "@/components/payments/PaymentMethodCard";

export interface PaymentMethodFilters {
  direction: 'deposit' | 'withdrawal' | 'all';
  region: string;
  currency: string;
  speed: 'all' | 'instant' | 'same-day' | '1-3-days';
  maxFee: number;
}

export const paymentMethodsData: PaymentMethod[] = [
  // Bank Transfers
  {
    id: "local-bank",
    name: "Local Bank Transfer",
    type: "bank",
    directions: ["deposit", "withdrawal"],
    regions: ["middle-east", "lebanon"],
    currencies: ["USD"],
    processingTime: "1-3 business days",
    fee: "Depends on bank",
    minAmount: "$25",
    maxAmount: "$25,000",
    dailyLimit: "$50,000",
    kyc: "basic",
    description: "Convenient local bank transfers"
  },

  // Local Lebanon Methods
  {
    id: "omt",
    name: "OMT (Optimum Money Transfer)",
    type: "local",
    directions: ["deposit", "withdrawal"],
    regions: ["lebanon"],
    currencies: ["USD"],
    processingTime: "Same day",
    fee: "0%",
    minAmount: "$25",
    maxAmount: "$5,000",
    dailyLimit: "$10,000",
    kyc: "basic",
    description: "Popular Lebanese money transfer service"
  },
  {
    id: "wish-money",
    name: "Whish Money",
    type: "local",
    directions: ["deposit", "withdrawal"],
    regions: ["lebanon"],
    currencies: ["USD"],
    processingTime: "Instant",
    fee: "0%",
    minAmount: "$25",
    maxAmount: "$5,000",
    dailyLimit: "$10,000",
    kyc: "basic",
    description: "Trusted Lebanese payment solution"
  },
  {
    id: "vision-express",
    name: "Vision Express",
    type: "local",
    directions: ["deposit", "withdrawal"],
    regions: ["lebanon"],
    currencies: ["USD"],
    processingTime: "Same day",
    fee: "0%",
    minAmount: "$25",
    maxAmount: "$3,000",
    dailyLimit: "$5,000",
    kyc: "basic",
    description: "Fast local payment service in Lebanon"
  },
  {
    id: "bob-finance",
    name: "Bob Finance",
    type: "local",
    directions: ["deposit", "withdrawal"],
    regions: ["lebanon"],
    currencies: ["USD"],
    processingTime: "Same day",
    fee: "0%",
    minAmount: "$25",
    maxAmount: "$5,000",
    dailyLimit: "$10,000",
    kyc: "basic",
    description: "Modern Lebanese fintech solution"
  },

  // Crypto
  {
    id: "crypto-usdt",
    name: "USDT (Tether)",
    type: "crypto",
    directions: ["deposit", "withdrawal"],
    regions: ["global"],
    currencies: ["USDT"],
    processingTime: "Instant",
    fee: "0%",
    minAmount: "$20",
    maxAmount: "$50,000",
    dailyLimit: "$100,000",
    kyc: "advanced",
    description: "Stable cryptocurrency pegged to USD"
  }
];

export const filterMethods = (methods: PaymentMethod[], filters: PaymentMethodFilters) => {
  return methods.filter(method => {
    // Direction filter
    if (filters.direction !== 'all' && !method.directions.includes(filters.direction)) {
      return false;
    }

    // Region filter
    if (filters.region !== 'all' && !method.regions.includes(filters.region) && !method.regions.includes('global')) {
      return false;
    }

    // Currency filter
    if (filters.currency !== 'all' && !method.currencies.includes(filters.currency)) {
      return false;
    }

    // Speed filter
    if (filters.speed !== 'all') {
      const speed = method.processingTime.toLowerCase();
      switch (filters.speed) {
        case 'instant':
          if (!speed.includes('instant')) return false;
          break;
        case 'same-day':
          if (!speed.includes('same') && !speed.includes('instant')) return false;
          break;
        case '1-3-days':
          if (!speed.includes('day') && !speed.includes('business')) return false;
          break;
      }
    }

    // Fee filter (simplified - assumes "0%" = 0, "1.9%" = 1.9, etc.)
    const methodFee = parseFloat(method.fee.replace('%', '')) || 0;
    if (methodFee > filters.maxFee) {
      return false;
    }

    return true;
  });
};