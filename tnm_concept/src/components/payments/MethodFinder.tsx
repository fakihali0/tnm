import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPACING } from "@/styles/spacing";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Filter, RefreshCw } from "lucide-react";
import { trackButtonClick } from "@/utils/auth-redirects";
import { cn } from "@/lib/utils";

export interface PaymentFilters {
  direction: 'deposit' | 'withdrawal';
  region: string;
  currency: string;
  speed: string;
  maxFee: number;
}

interface MethodFinderProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
  className?: string;
}

const regions = [
  { value: "all", label: "All Regions" },
  { value: "global", label: "Global" },
  { value: "europe", label: "Europe" },
  { value: "middle-east", label: "Middle East" },
  { value: "lebanon", label: "Lebanon" },
  { value: "north-america", label: "North America" }
];

const currencies = [
  { value: "all", label: "All Currencies" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "LBP", label: "LBP" },
  { value: "AED", label: "AED" }
];

const speeds = [
  { value: "all", label: "Any Speed" },
  { value: "instant", label: "Instant" },
  { value: "same-day", label: "Same Day" },
  { value: "1-3-days", label: "1-3 days" }
];

export function MethodFinder({ filters, onFiltersChange, className }: MethodFinderProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Load saved filters from localStorage
    const savedFilters = localStorage.getItem('paymentFilters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        onFiltersChange({ ...filters, ...parsed });
      } catch (e) {
        // Failed to parse saved filters, using defaults
      }
    }
  }, []);

  const handleFilterChange = <K extends keyof PaymentFilters>(key: K, value: PaymentFilters[K]) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    localStorage.setItem('paymentFilters', JSON.stringify(newFilters));
    
    trackButtonClick({
      buttonType: 'pm_filter_apply',
      buttonLocation: 'method-finder'
    });
  };

  const resetFilters = () => {
    const defaultFilters: PaymentFilters = {
      direction: 'deposit',
      region: 'all',
      currency: 'all', 
      speed: 'all',
      maxFee: 5
    };
    onFiltersChange(defaultFilters);
    localStorage.removeItem('paymentFilters');
    
    trackButtonClick({
      buttonType: 'pm_filter_reset',
      buttonLocation: 'method-finder'
    });
  };

  return (
    <Card className={cn("border-0 bg-muted/20", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full justify-between ${SPACING.padding.card} h-auto`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className={`flex items-center ${SPACING.gap.small}`}>
              <Filter className={SPACING.icon.md} />
              <span className="font-medium">Method Finder</span>
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v !== 'all' && v !== 5).length} active
              </Badge>
            </div>
            <ChevronDown className={cn(SPACING.icon.sm, "transition-transform", isOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-6">
            <div className={`grid grid-cols-1 md:grid-cols-5 ${SPACING.gap.medium}`}>
              {/* Direction Toggle */}
              <div className={SPACING.stack.compact}>
                <label className="text-sm font-medium">Direction</label>
                <div className="flex rounded-lg border p-1">
                  <button
                    onClick={() => handleFilterChange('direction', 'deposit')}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-md transition-colors",
                      filters.direction === 'deposit'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => handleFilterChange('direction', 'withdrawal')}
                    className={cn(
                      "flex-1 px-3 py-2 text-sm rounded-md transition-colors",
                      filters.direction === 'withdrawal'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    Withdrawal
                  </button>
                </div>
              </div>

              {/* Region */}
              <div className={SPACING.stack.compact}>
                <label className="text-sm font-medium">Region/Country</label>
                <Select value={filters.region} onValueChange={(value) => handleFilterChange('region', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className={SPACING.stack.compact}>
                <label className="text-sm font-medium">Currency</label>
                <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Speed */}
              <div className={SPACING.stack.compact}>
                <label className="text-sm font-medium">Speed</label>
                <Select value={filters.speed} onValueChange={(value) => handleFilterChange('speed', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent>
                    {speeds.map((speed) => (
                      <SelectItem key={speed.value} value={speed.value}>
                        {speed.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Fee Slider */}
              <div className={SPACING.stack.compact}>
                <label className="text-sm font-medium">Max Fee: {filters.maxFee}%</label>
                <div className="pt-2">
                  <Slider
                    value={[filters.maxFee]}
                    onValueChange={([value]) => handleFilterChange('maxFee', value)}
                    max={5}
                    min={0}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0%</span>
                    <span>2.5%</span>
                    <span>5%+</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={`flex ${SPACING.gap.small} mt-4 pt-4 border-t`}>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className={SPACING.gap.small}
              >
                <RefreshCw className={SPACING.icon.sm} />
                Reset
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}