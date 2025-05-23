
import React from 'react';
import { cn } from "@/lib/utils";
import { DollarSign } from 'lucide-react';

interface AdSensePlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  width: number;
  height: number;
}

export function AdSensePlaceholder({ width, height, className, ...props }: AdSensePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-border bg-muted/50 text-muted-foreground rounded-lg",
        className
      )}
      style={{ width: `${width}px`, height: `${height}px` }}
      role="complementary" // Indicate this is supplementary content
      aria-label="Advertisement Placeholder"
      {...props}
    >
      <DollarSign className="w-8 h-8 mb-2" aria-hidden="true" />
      <span className="text-sm text-center px-2">Advertisement ({width}x{height})</span>
    </div>
  );
}
