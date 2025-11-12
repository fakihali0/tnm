import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  PieChart, 
  BarChart3,
  TrendingUp,
  Calculator,
  FileSpreadsheet
} from 'lucide-react';
import { format } from 'date-fns';

interface ReportConfig {
  type: 'pdf' | 'excel' | 'csv';
  dateRange: {
    from: Date;
    to: Date;
  };
  sections: string[];
  format: 'summary' | 'detailed';
}

const reportSections = [
  { id: 'performance', label: 'Performance Overview', icon: TrendingUp },
  { id: 'trades', label: 'Trade History', icon: BarChart3 },
  { id: 'analytics', label: 'Analytics & Insights', icon: PieChart },
  { id: 'risk', label: 'Risk Assessment', icon: Calculator },
  { id: 'tax', label: 'Tax Report', icon: FileText }
];

export function ReportGenerator() {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>({
    type: 'pdf',
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      to: new Date()
    },
    sections: ['performance', 'trades'],
    format: 'summary'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'from' | 'to' | null>(null);

  const handleSectionToggle = (sectionId: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(sectionId)
        ? prev.sections.filter(id => id !== sectionId)
        : [...prev.sections, sectionId]
    }));
  };

  const generateReport = async () => {
    if (config.sections.length === 0) {
      toast({
        title: "No sections selected",
        description: "Please select at least one report section",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Report Generated",
        description: `${config.type.toUpperCase()} report has been downloaded successfully`,
      });
      
      // In a real implementation, this would trigger the actual file download
      const filename = `trading-report-${format(config.dateRange.from, 'yyyy-MM-dd')}-to-${format(config.dateRange.to, 'yyyy-MM-dd')}.${config.type}`;
      console.log(`Generating report: ${filename}`);
      
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportIcon = () => {
    switch (config.type) {
      case 'pdf': return FileText;
      case 'excel': return FileSpreadsheet;
      case 'csv': return FileSpreadsheet;
    }
  };

  const ReportIcon = getReportIcon();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Format</label>
          <Select value={config.type} onValueChange={(value: 'pdf' | 'excel' | 'csv') => 
            setConfig(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Report
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel Workbook
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV Data
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover open={showDatePicker === 'from'} onOpenChange={(open) => 
              setShowDatePicker(open ? 'from' : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(config.dateRange.from, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={config.dateRange.from}
                  onSelect={(date) => {
                    if (date) {
                      setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: date }
                      }));
                      setShowDatePicker(null);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover open={showDatePicker === 'to'} onOpenChange={(open) => 
              setShowDatePicker(open ? 'to' : null)}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(config.dateRange.to, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={config.dateRange.to}
                  onSelect={(date) => {
                    if (date) {
                      setConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: date }
                      }));
                      setShowDatePicker(null);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Report Sections */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Include Sections</label>
          <div className="grid grid-cols-1 gap-3">
            {reportSections.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={config.sections.includes(section.id)}
                    onCheckedChange={() => handleSectionToggle(section.id)}
                  />
                  <label
                    htmlFor={section.id}
                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Detail Level */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Detail Level</label>
          <Select value={config.format} onValueChange={(value: 'summary' | 'detailed') => 
            setConfig(prev => ({ ...prev, format: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary Report</SelectItem>
              <SelectItem value="detailed">Detailed Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={generateReport} 
            disabled={isGenerating || config.sections.length === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-4 w-4 mr-2"
              >
                <Download className="h-4 w-4" />
              </motion.div>
            ) : (
              <ReportIcon className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating Report...' : `Generate ${config.type.toUpperCase()} Report`}
          </Button>
        </motion.div>

        {/* Quick Export Options */}
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Quick CSV
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Tax Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}