import { Button } from "@/components/ui/button";

interface SimpleDirectionFilterProps {
  direction: string;
  onDirectionChange: (direction: string) => void;
  className?: string;
}

export const SimpleDirectionFilter = ({ 
  direction, 
  onDirectionChange, 
  className = "" 
}: SimpleDirectionFilterProps) => {
  const directions = [
    { value: "all", label: "All Methods" },
    { value: "deposit", label: "Deposit" },
    { value: "withdrawal", label: "Withdrawal" }
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {directions.map((dir) => (
        <Button
          key={dir.value}
          variant={direction === dir.value ? "default" : "outline"}
          onClick={() => onDirectionChange(dir.value)}
          className="px-6 py-2"
        >
          {dir.label}
        </Button>
      ))}
    </div>
  );
};