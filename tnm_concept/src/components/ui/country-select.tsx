import React, { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { countries, type Country } from '@/data/countries';

interface CountrySelectProps {
  value?: Country;
  onValueChange: (country: Country) => void;
  placeholder?: string;
  className?: string;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select country",
  className,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {value ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{value.flag}</span>
              <span>{value.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup>
            <CommandList className="max-h-64">
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onValueChange(country);
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
                      value?.code === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};