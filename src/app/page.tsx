
"use client";

import type { DateRange } from "react-day-picker";
import { useState, type ReactNode, useEffect } from "react";
import {
  addDays,
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  format,
  subDays,
  isValid, // Import isValid
  intervalToDuration,
} from "date-fns";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Cake } from "lucide-react"; // Use a relevant icon

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/date-input";
import { Separator } from "@/components/ui/separator";
import { AdSensePlaceholder } from "@/components/ads/adsense-placeholder"; // Import AdSense placeholder

// Schema for Date Difference Form
const dateDifferenceSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required.",
    invalid_type_error: "Invalid date format.",
   }).refine(isValid, { message: "Invalid date." }),
  endDate: z.date({
    required_error: "End date is required.",
    invalid_type_error: "Invalid date format.",
   }).refine(isValid, { message: "Invalid date." }),
}).refine(data => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after start date.",
    path: ["endDate"],
});


type DateDifferenceValues = z.infer<typeof dateDifferenceSchema>;

// Schema for Date Arithmetic Form
const dateArithmeticSchema = z.object({
  baseDate: z.date({
    required_error: "A date is required.",
    invalid_type_error: "Invalid date format.",
   }).refine(isValid, { message: "Invalid date." }),
  operation: z.enum(["add", "subtract"], {
    required_error: "Operation is required.",
  }), // Added operation to schema
  days: z.coerce
    .number({ invalid_type_error: "Must be a number." })
    .int("Must be an integer.")
    .min(1, "Must be at least 1 day."),
});

type DateArithmeticValues = z.infer<typeof dateArithmeticSchema>;

// Schema for Age Finder Form
const ageFinderSchema = z.object({
  dateOfBirth: z.date({
    required_error: "Date of birth is required.",
    invalid_type_error: "Invalid date format.",
  }).refine(isValid, { message: "Invalid date." })
    .refine(date => date <= new Date(), { message: "Date of birth cannot be in the future." }), // Ensure date is not in the future
});

type AgeFinderValues = z.infer<typeof ageFinderSchema>;

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
  const [ageResult, setAgeResult] = useState<{
    years?: number;
    months?: number;
    days?: number;
  } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

   // Set current date on client mount to avoid hydration issues
   useEffect(() => {
    setCurrentDate(new Date());
   }, []);

  // Date Difference Form
  const dateDifferenceForm = useForm<DateDifferenceValues>({
    resolver: zodResolver(dateDifferenceSchema),
    mode: 'onChange', // Trigger validation on change
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
    }
  });

  // Date Arithmetic Form
  const dateArithmeticForm = useForm<DateArithmeticValues>({
    resolver: zodResolver(dateArithmeticSchema),
    mode: 'onChange', // Trigger validation on change for button state
    defaultValues: {
      operation: "add", // Default operation
      baseDate: undefined,
      days: undefined,
    },
  });

   // Age Finder Form
   const ageFinderForm = useForm<AgeFinderValues>({
    resolver: zodResolver(ageFinderSchema),
    mode: 'onChange',
    defaultValues: {
        dateOfBirth: undefined,
    }
   });

  // Handlers
  const handleDateDifferenceSubmit: SubmitHandler<DateDifferenceValues> = (
    data
  ) => {
    const { startDate, endDate } = data;
    const days = differenceInDays(endDate, startDate);
    const weeks = differenceInWeeks(endDate, startDate);
    const months = differenceInMonths(endDate, startDate);
    const years = differenceInYears(endDate, startDate);
    setDateDifferenceResult({ days, weeks, months, years });
    setArithmeticResult(null);
    setArithmeticOperation(null);
    setAgeResult(null); // Clear age result
  };

  // Updated handler for Date Arithmetic form submission
  const handleDateArithmeticSubmit: SubmitHandler<DateArithmeticValues> = (
    data
  ) => {
    const { baseDate, days, operation } = data;
    const resultDate =
      operation === "add"
        ? addDays(baseDate, days)
        : subDays(baseDate, days);
    setArithmeticResult(resultDate);
    setArithmeticOperation(operation); // Set the operation type for display
    setDateDifferenceResult(null); // Clear other result
    setAgeResult(null); // Clear age result
  };

  // Handler for Age Finder form submission
  const handleAgeFinderSubmit: SubmitHandler<AgeFinderValues> = (data) => {
    const { dateOfBirth } = data;
    if (currentDate) {
        const duration = intervalToDuration({ start: dateOfBirth, end: currentDate });
        setAgeResult(duration);
        setDateDifferenceResult(null);
        setArithmeticResult(null);
        setArithmeticOperation(null);
    }
  };


  return (
     <main className="flex min-h-screen justify-center p-4 bg-background">
      <div className="flex w-full max-w-7xl justify-center gap-8"> {/* Increased max-width and added gap */}

        {/* Left Ad Placeholder */}
        <aside className="hidden lg:block w-40 flex-shrink-0 sticky top-4 h-fit">
          <AdSensePlaceholder width={160} height={600} />
        </aside>

        {/* Main Content Card */}
        <Card className="w-full max-w-2xl shadow-lg flex-grow">
           <CardHeader className="text-center px-6 pt-6 pb-4"> {/* Reduced padding-bottom */}
            <CardTitle className="text-2xl font-bold text-primary"> {/* Reduced font size */}
              Date-Arithmetic Boss
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-4"> {/* Adjusted top padding */}
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
                                        date > (currentDate || new Date()) || date < new Date("1900-01-01"),
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
                                        date < (dateDifferenceForm.getValues("startDate") || new Date("1900-01-01")) || date > (currentDate || new Date()), // Also disable future dates
                                    }}
                                    placeholder="mm/dd/yyyy"
                                />
                             </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!dateDifferenceForm.formState.isValid || dateDifferenceForm.formState.isSubmitting}>
                      Calculate Difference
                    </Button>
                  </form>
                </Form>

                {dateDifferenceResult && (
                  <Card className="mt-6 bg-secondary border-border">
                    <CardHeader>
                      <CardTitle className="text-xl">Difference Result</CardTitle>
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
                    onSubmit={dateArithmeticForm.handleSubmit(handleDateArithmeticSubmit)} // Use onSubmit on the form
                    className="space-y-6"
                  >
                    {/* Fields stacked vertically */}
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
                                            date < new Date("1900-01-01") || date > new Date("2200-01-01"), // Allow future dates for arithmetic
                                      }}
                                      placeholder="mm/dd/yyyy"
                                  />
                               </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                       {/* New Select Field for Operation */}
                       <FormField
                         control={dateArithmeticForm.control}
                         name="operation"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Operation</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                               <FormControl>
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select operation" />
                                 </SelectTrigger>
                               </FormControl>
                               <SelectContent>
                                 <SelectItem value="add">Add</SelectItem>
                                 <SelectItem value="subtract">Subtract</SelectItem>
                               </SelectContent>
                             </Select>
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

                    {/* Single Calculate Button */}
                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={!dateArithmeticForm.formState.isValid || dateArithmeticForm.formState.isSubmitting} // Disable if form invalid or submitting
                    >
                      <CalendarDays className="mr-2 h-4 w-4" /> Calculate New Date
                    </Button>
                  </form>
                </Form>

                {arithmeticResult && arithmeticOperation && (
                   <Card className="mt-6 bg-secondary border-border">
                    <CardHeader>
                      <CardTitle className="text-xl">Arithmetic Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ResultDisplay
                          title={`${arithmeticOperation === 'add' ? 'New Date (Added)' : 'New Date (Subtracted)'}`}
                          value={format(arithmeticResult, 'PPP')} // Use a more readable format like 'MMM d, yyyy'
                          unit=""
                        />
                    </CardContent>
                  </Card>
                )}
            </div>

            <Separator className="my-8" />

            {/* Find Age Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Find Age</h3>
              <Form {...ageFinderForm}>
                <form
                  onSubmit={ageFinderForm.handleSubmit(handleAgeFinderSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4">
                     <FormField
                      control={ageFinderForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <DateInput
                              value={field.value}
                              onChange={field.onChange}
                              calendarProps={{
                                disabled: (date) =>
                                  date > (currentDate || new Date()) || date < new Date("1900-01-01"), // Disable future dates and very old dates
                                 captionLayout: "dropdown-buttons", // Add year/month dropdowns
                                 fromYear: 1900, // Set earliest year
                                 toYear: currentDate ? currentDate.getFullYear() : new Date().getFullYear(), // Set latest year to current year
                              }}
                              placeholder="mm/dd/yyyy"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!ageFinderForm.formState.isValid || ageFinderForm.formState.isSubmitting || !currentDate}>
                      <Cake className="mr-2 h-4 w-4" /> Calculate Age
                   </Button>
                </form>
              </Form>

              {ageResult && (
                  <Card className="mt-6 bg-secondary border-border">
                    <CardHeader>
                      <CardTitle className="text-xl">Age Result</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <ResultDisplay title="Years" value={ageResult.years ?? 0} unit="years" />
                      <ResultDisplay title="Months" value={ageResult.months ?? 0} unit="months" />
                      <ResultDisplay title="Days" value={ageResult.days ?? 0} unit="days" />
                    </CardContent>
                  </Card>
                )}

            </div>

          </CardContent>
        </Card>

        {/* Right Ad Placeholder */}
         <aside className="hidden lg:block w-40 flex-shrink-0 sticky top-4 h-fit">
            <AdSensePlaceholder width={160} height={600} />
         </aside>

      </div>
    </main>
  );
}
