
"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, type CalendarProps } from "@/components/ui/calendar";
import { Input, type InputProps } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateInputProps extends Omit<InputProps, 'value' | 'onChange' | 'defaultValue'> {
  value?: Date | null;
  onChange?: (date: Date | undefined) => void;
  calendarProps?: Omit<CalendarProps, 'mode' | 'selected' | 'onSelect' | 'initialFocus'>;
  dateFormat?: string;
  placeholder?: string;
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    { value, onChange, calendarProps, dateFormat = "MM/dd/yyyy", placeholder, className, ...props },
    ref
  ) => {
    const [inputValue, setInputValue] = React.useState<string>("");
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    // Update input value when the external value changes
    React.useEffect(() => {
      if (value && isValid(value)) {
        setInputValue(format(value, dateFormat));
      } else {
        setInputValue(""); // Clear input if value is null, undefined, or invalid
      }
    }, [value, dateFormat]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const typedValue = e.target.value;
      setInputValue(typedValue);

      // Try to parse the input value
      const parsedDate = parse(typedValue, dateFormat, new Date());

      if (isValid(parsedDate)) {
         // Check if the formatted date matches the input to avoid partial date updates
        if (format(parsedDate, dateFormat) === typedValue) {
          onChange?.(parsedDate);
        } else {
          // Keep the invalid input but don't update the form state yet
          // Or potentially clear the form state if desired: onChange?.(undefined);
        }
      } else {
        // If parsing fails, clear the form state for this field
        onChange?.(undefined);
      }
    };

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const typedValue = e.target.value;
        const parsedDate = parse(typedValue, dateFormat, new Date());

        if (isValid(parsedDate) && format(parsedDate, dateFormat) === typedValue) {
            // If valid and fully typed, ensure external state is updated
            if (value?.getTime() !== parsedDate.getTime()) {
                 onChange?.(parsedDate);
            }
        } else if (typedValue === "" && value !== undefined) {
            // Handle clearing the input
            onChange?.(undefined);
        } else if (value) {
             // If input is invalid or incomplete on blur, revert to the last valid value
             setInputValue(format(value, dateFormat));
        }
         // Call original onBlur if provided
        props.onBlur?.(e);
    };


    const handleDateSelect = (selectedDate: Date | undefined) => {
      if (selectedDate) {
        setInputValue(format(selectedDate, dateFormat));
        onChange?.(selectedDate);
        setIsPopoverOpen(false); // Close popover on date selection
      }
    };

    return (
      <div className={cn("relative flex items-center", className)}>
        <Input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder ?? dateFormat.toUpperCase()}
          className="pr-10" // Add padding to make space for the button
          {...props}
        />
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Open calendar"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ?? undefined} // Ensure Calendar gets Date or undefined
              onSelect={handleDateSelect}
              initialFocus
              {...calendarProps}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
DateInput.displayName = "DateInput";

export { DateInput };
