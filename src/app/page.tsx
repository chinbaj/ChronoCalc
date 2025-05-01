
"use client";

import type { DateRange } from "react-day-picker";
import { useState, type ReactNode } from "react";
import {
  addDays,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  format,
  subDays,
  isValid, // Import isValid
} from "date-fns";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/date-input"; // Import the new component
import { Separator } from "@/components/ui/separator"; // Import Separator

// Schema for Date Difference Form
const dateDifferenceSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required.",
    invalid_type_error: "Invalid date format.",
   }).refine(isValid, { message: "Invalid date." }), // Add refine for better validation
  endDate: z.date({
    required_error: "End date is required.",
    invalid_type_error: "Invalid date format.",
   }).refine(isValid, { message: "Invalid date." }), // Add refine for better validation
}).refine(data => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after start date.",
    path: ["endDate"], // Attach error to endDate field
});


type DateDifferenceValues = z.infer<typeof dateDifferenceSchema>;

// Schema for Date Arithmetic Form
const dateArithmeticSchema = z.object({
  baseDate: z.date({
    required_error: "A date is required.",
    invalid_type_error: "Invalid date format.",
   }).refine(isValid, { message: "Invalid date." }), // Add refine for better validation
  days: z.coerce
    .number({ invalid_type_error: "Must be a number." })
    .int("Must be an integer.")
    .min(1, "Must be at least 1 day."),
  operation: z.enum(["add", "subtract"]),
});

type DateArithmeticValues = z.infer<typeof dateArithmeticSchema>;

interface ResultDisplayProps {
  title: string;
  value: ReactNode;
  unit: string;
}

function ResultDisplay({ title, value, unit }: ResultDisplayProps) {
  return (
    <div className="flex items-baseline gap-2 rounded-md bg-secondary p-3 text-secondary-foreground shadow-sm">
      <span className="text-sm font-medium text-muted-foreground">{title}:</span>
      <span className="text-lg font-semibold">{value}</span>
      <span className="text-sm text-muted-foreground">{unit}</span>
    </div>
  );
}

export default function Home() {
  const [dateDifferenceResult, setDateDifferenceResult] = useState<{
    days: number;
    weeks: number;
    months: number;
    years: number;
  } | null>(null);
  const [arithmeticResult, setArithmeticResult] = useState<Date | null>(null);
  const [arithmeticOperation, setArithmeticOperation] = useState<
    "add" | "subtract" | null
  >(null);

  // Date Difference Form
  const dateDifferenceForm = useForm<DateDifferenceValues>({
    resolver: zodResolver(dateDifferenceSchema),
    defaultValues: {
      startDate: undefined, // Initialize dates as undefined
      endDate: undefined,
    }
  });

  // Date Arithmetic Form
  const dateArithmeticForm = useForm<DateArithmeticValues>({
    resolver: zodResolver(dateArithmeticSchema),
    defaultValues: {
      operation: "add", // Default operation
      baseDate: undefined, // Initialize date as undefined
      days: undefined,
    },
  });

  // Handlers
  const handleDateDifferenceSubmit: SubmitHandler<DateDifferenceValues> = (
    data
  ) => {
    const { startDate, endDate } = data;
    // Form validation ensures dates are valid here
    const days = differenceInDays(endDate, startDate);
    const weeks = differenceInWeeks(endDate, startDate);
    const months = differenceInMonths(endDate, startDate);
    const years = differenceInYears(endDate, startDate);
    setDateDifferenceResult({ days, weeks, months, years });
    setArithmeticResult(null); // Clear other result
    setArithmeticOperation(null);
     // Optionally reset the other form
    // dateArithmeticForm.reset({ operation: "add", baseDate: undefined, days: undefined });
  };

  const handleDateArithmeticSubmit = (operation: "add" | "subtract") => {
    dateArithmeticForm.setValue("operation", operation); // Set operation before trigger
    setArithmeticOperation(operation);
    dateArithmeticForm.handleSubmit((data) => {
      const { baseDate, days } = data;
       // Form validation ensures date and days are valid
      const resultDate =
        operation === "add"
          ? addDays(baseDate, days)
          : subDays(baseDate, days);
      setArithmeticResult(resultDate);
      setDateDifferenceResult(null); // Clear other result
      // Optionally reset the other form
      // dateDifferenceForm.reset({ startDate: undefined, endDate: undefined });

    })(); // Trigger validation and submission
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-secondary">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">
            ChronoCalc
          </CardTitle>
          <CardDescription>
            Your friendly neighborhood date calculator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Date Difference Section */}
          <div>
             <h3 className="text-xl font-semibold mb-4 text-center">Date Difference</h3>
              <Form {...dateDifferenceForm}>
                <form
                  onSubmit={dateDifferenceForm.handleSubmit(
                    handleDateDifferenceSubmit
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={dateDifferenceForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                           <FormControl>
                             <DateInput
                                value={field.value}
                                onChange={field.onChange}
                                calendarProps={{
                                    disabled: (date) =>
                                      date > new Date() || date < new Date("1900-01-01"),
                                }}
                                placeholder="mm/dd/yyyy"
                              />
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dateDifferenceForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                              <DateInput
                                  value={field.value}
                                  onChange={field.onChange}
                                  calendarProps={{
                                      disabled: (date) =>
                                      date < (dateDifferenceForm.getValues("startDate") || new Date("1900-01-01")) || date > new Date(), // Also disable future dates
                                  }}
                                  placeholder="mm/dd/yyyy"
                              />
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                    Calculate Difference
                  </Button>
                </form>
              </Form>

              {dateDifferenceResult && (
                <Card className="mt-6 bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-xl">Result</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <ResultDisplay title="Years" value={dateDifferenceResult.years} unit="years" />
                    <ResultDisplay title="Months" value={dateDifferenceResult.months} unit="months" />
                    <ResultDisplay title="Weeks" value={dateDifferenceResult.weeks} unit="weeks" />
                    <ResultDisplay title="Days" value={dateDifferenceResult.days} unit="days" />
                  </CardContent>
                </Card>
              )}
          </div>

          <Separator className="my-8" />

           {/* Date Arithmetic Section */}
           <div>
             <h3 className="text-xl font-semibold mb-4 text-center">Date Arithmetic</h3>
              <Form {...dateArithmeticForm}>
                <form
                  // We don't use onSubmit here directly, buttons trigger specific handlers
                  className="space-y-6"
                  onSubmit={(e) => e.preventDefault()} // Prevent default form submission
                >
                  {/* Changed grid layout to always use 1 column for vertical alignment */}
                  <div className="grid grid-cols-1 gap-4">
                     <FormField
                        control={dateArithmeticForm.control}
                        name="baseDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                             <FormControl>
                                <DateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    calendarProps={{
                                        disabled: (date) =>
                                          date < new Date("1900-01-01") || date > new Date(), // Also disable future dates
                                    }}
                                    placeholder="mm/dd/yyyy"
                                />
                             </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={dateArithmeticForm.control}
                        name="days"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Days</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter number of days" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} value={field.value ?? ''} min="1" step="1" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>


                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Button
                      type="button" // Important: Change type to button
                      onClick={() => handleDateArithmeticSubmit("add")}
                      className="w-full bg-accent hover:bg-accent/90"
                       disabled={!dateArithmeticForm.formState.isValid} // Disable if form invalid
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Days
                    </Button>
                    <Button
                      type="button" // Important: Change type to button
                      onClick={() => handleDateArithmeticSubmit("subtract")}
                      variant="outline"
                      className="w-full border-accent text-accent hover:bg-accent/10"
                      disabled={!dateArithmeticForm.formState.isValid} // Disable if form invalid
                    >
                      <Minus className="mr-2 h-4 w-4" /> Subtract Days
                    </Button>
                  </div>
                </form>
              </Form>

              {arithmeticResult && arithmeticOperation && (
                 <Card className="mt-6 bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-xl">Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <ResultDisplay
                        title={`${arithmeticOperation === 'add' ? 'New Date (Added)' : 'New Date (Subtracted)'}`}
                        value={format(arithmeticResult, 'PPP')}
                        unit=""
                      />
                  </CardContent>
                </Card>
              )}
          </div>

        </CardContent>
      </Card>
    </main>
  );
}

