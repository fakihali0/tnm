import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { countries, type Country } from '@/data/countries';

interface PhoneInputProps {
  value: string;
  onValueChange: (value: string) => void;
  countryCode: Country;
  onCountryCodeChange: (country: Country) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onValueChange,
  countryCode,
  onCountryCodeChange,
  placeholder = "Phone number",
  className,
  required,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("flex w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-12 w-24 shrink-0 rounded-r-none border-r-0 px-3"
          >
            <span className="text-sm">{countryCode.flag}</span>
            <span className="text-xs text-muted-foreground ml-1">{countryCode.dialCode}</span>
            <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              <CommandList className="max-h-64">
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dialCode} ${country.code}`}
                    onSelect={() => {
                      onCountryCodeChange(country);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-muted-foreground text-sm">{country.dialCode}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        countryCode.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-l-none flex-1 h-12"
      />
    </div>
  );
};