import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Copy, Filter } from "lucide-react";
import { PaymentMethod } from "./PaymentMethodCard";
import { trackButtonClick } from "@/utils/auth-redirects";
import { SPACING } from "@/styles/spacing";

interface FeesLimitsMatrixProps {
  methods: PaymentMethod[];
  className?: string;
}

export function FeesLimitsMatrix({ methods, className }: FeesLimitsMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");

  const filteredMethods = methods.filter(method => {
    const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDirection = directionFilter === "all" || method.directions.includes(directionFilter as any);
    const matchesCurrency = currencyFilter === "all" || method.currencies.includes(currencyFilter);
    
    return matchesSearch && matchesDirection && matchesCurrency;
  });

  const handleCopyToClipboard = () => {
    const tableData = filteredMethods.map(method => 
      `${method.name}\t${method.directions.join('/')}\t${method.fee}\t${method.minAmount}\t${method.maxAmount}\t${method.processingTime}`
    ).join('\n');
    
    const headers = "Method\tDirection\tFee\tMin\tMax\tProcessing Time\n";
    navigator.clipboard.writeText(headers + tableData);
    
    trackButtonClick({
      buttonType: 'pm_fee_matrix_copy',
      buttonLocation: 'fees-matrix'
    });
  };

  const handleDownloadPDF = () => {
    trackButtonClick({
      buttonType: 'pm_fee_matrix_download',
      buttonLocation: 'fees-matrix'
    });
    // This would typically generate a PDF
    // PDF generation would be implemented here
  };

  const currencies = Array.from(new Set(methods.flatMap(m => m.currencies)));

  return (
    <Card id="fees" className={className}>
      <CardHeader>
        <div className={`flex flex-col md:flex-row md:items-center justify-between ${SPACING.gap.medium}`}>
          <div>
            <CardTitle className="text-2xl">Fees & Limits Matrix</CardTitle>
            <p className="text-muted-foreground">
              Complete breakdown of all payment methods, fees, and transaction limits
            </p>
          </div>
          
          <div className={`flex ${SPACING.gap.small}`}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className={SPACING.gap.small}
            >
              <Copy className={`${SPACING.icon.sm} w-4`} />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className={SPACING.gap.small}
            >
              <Download className={`${SPACING.icon.sm} w-4`} />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={SPACING.stack.comfortable}>
        {/* Filters */}
        <div className={`flex flex-col md:flex-row ${SPACING.gap.medium}`}>
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${SPACING.icon.sm} text-muted-foreground`} />
            <Input
              placeholder="Search payment methods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="deposit">Deposit Only</SelectItem>
              <SelectItem value="withdrawal">Withdrawal Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {currencies.map(currency => (
                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[150px]">Method</TableHead>
                  <TableHead className="text-center">Direction</TableHead>
                  <TableHead className="text-center">Fee</TableHead>
                  <TableHead className="text-center">Min/Max per Transaction</TableHead>
                  <TableHead className="text-center">Daily Limit</TableHead>
                  <TableHead className="text-center">Processing Time</TableHead>
                  <TableHead className="min-w-[200px]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMethods.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{method.name}</div>
                        <div className={`text-xs text-muted-foreground`}>
                          {method.regions.includes('global') ? 'Global' : method.regions.join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`flex ${SPACING.gap.iconButton} justify-center`}>
                        {method.directions.map(direction => (
                          <Badge key={direction} variant="outline" className="text-xs">
                            {direction === 'deposit' ? 'D' : 'W'}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {method.fee}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <div>{method.minAmount}</div>
                        <div className="text-muted-foreground">to {method.maxAmount}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {method.dailyLimit || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {method.processingTime}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className={SPACING.stack.tight}>
                        <div>KYC: {method.kyc}</div>
                        <div>Currencies: {method.currencies.slice(0, 3).join(', ')}{method.currencies.length > 3 ? '...' : ''}</div>
                        {method.type === 'card' && <div>3D Secure required</div>}
                        {method.type === 'bank' && <div>Reference code required</div>}
                        {method.type === 'crypto' && <div>Network fees apply</div>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {filteredMethods.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className={`${SPACING.icon.huge} w-12 mx-auto ${SPACING.margin.heading} opacity-50`} />
            <p>No payment methods match your filters.</p>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg">
          <p className="font-medium mb-2">Important Notes:</p>
          <ul className="space-y-1">
            <li>• Fees shown are our charges - third-party providers may add their own fees</li>
            <li>• Processing times are estimates and may vary due to bank hours, holidays, or verification requirements</li>
            <li>• Limits may be higher for verified accounts - contact support for details</li>
            <li>• Currency conversion fees may apply when depositing/withdrawing in different currencies</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}