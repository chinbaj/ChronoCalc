
"use client";

import type { DateRange } from "react-day-picker";
import { useState, type ReactNode, useEffect } from "react";
import {
  addDays,
  addYears, // Added for pregnancy calculation
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  format,
  subDays,
  subMonths, // Added for pregnancy calculation
  isValid,
  intervalToDuration,
} from "date-fns";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Cake, Baby } from "lucide-react"; // Added Baby icon

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
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/date-input";
import { Separator } from "@/components/ui/separator";
import { AdSensePlaceholder } from "@/components/ads/adsense-placeholder";

// --- Schemas ---

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

const dateArithmeticSchema = z.object({
  baseDate: z.date({
    required_error: "A date is required.",
    invalid_type_error: "Invalid date format.",
   }).refine(isValid, { message: "Invalid date." }),
  operation: z.enum(["add", "subtract"], {
    required_error: "Operation is required.",
  }),
  days: z.coerce
    .number({ invalid_type_error: "Must be a number." })
    .int("Must be an integer.")
    .min(1, "Must be at least 1 day."),
});

const ageFinderSchema = z.object({
  dateOfBirth: z.date({
    required_error: "Date of birth is required.",
    invalid_type_error: "Invalid date format.",
  }).refine(isValid, { message: "Invalid date." })
    .refine(date => date <= new Date(), { message: "Date of birth cannot be in the future." }),
});

// Schema for Pregnancy Due Date Form
const pregnancyDueDateSchema = z.object({
  lastMenstrualPeriod: z.date({
    required_error: "Last menstrual period date is required.",
    invalid_type_error: "Invalid date format.",
  }).refine(isValid, { message: "Invalid date." })
    .refine(date => date <= new Date(), { message: "LMP date cannot be in the future." }), // Ensure date is not in the future
});

// --- Types ---

type DateDifferenceValues = z.infer<typeof dateDifferenceSchema>;
type DateArithmeticValues = z.infer<typeof dateArithmeticSchema>;
type AgeFinderValues = z.infer<typeof ageFinderSchema>;
type PregnancyDueDateValues = z.infer<typeof pregnancyDueDateSchema>; // Type for new form

// --- Components ---

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

// --- Main Component ---

export default function Home() {
  // State for results
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
  const [pregnancyDueDateResult, setPregnancyDueDateResult] = useState<Date | null>(null); // State for pregnancy due date
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

   // Set current date on client mount
   useEffect(() => {
    setCurrentDate(new Date());
   }, []);

  // --- Forms ---

  const dateDifferenceForm = useForm<DateDifferenceValues>({
    resolver: zodResolver(dateDifferenceSchema),
    mode: 'onChange',
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
    }
  });

  const dateArithmeticForm = useForm<DateArithmeticValues>({
    resolver: zodResolver(dateArithmeticSchema),
    mode: 'onChange',
    defaultValues: {
      operation: "add",
      baseDate: undefined,
      days: undefined,
    },
  });

   const ageFinderForm = useForm<AgeFinderValues>({
    resolver: zodResolver(ageFinderSchema),
    mode: 'onChange',
    defaultValues: {
        dateOfBirth: undefined,
    }
   });

   // Pregnancy Due Date Form
   const pregnancyDueDateForm = useForm<PregnancyDueDateValues>({
       resolver: zodResolver(pregnancyDueDateSchema),
       mode: 'onChange',
       defaultValues: {
           lastMenstrualPeriod: undefined,
       }
   });

  // --- Handlers ---

  const handleDateDifferenceSubmit: SubmitHandler<DateDifferenceValues> = (data) => {
    const { startDate, endDate } = data;
    const days = differenceInDays(endDate, startDate);
    const weeks = differenceInWeeks(endDate, startDate);
    const months = differenceInMonths(endDate, startDate);
    const years = differenceInYears(endDate, startDate);
    setDateDifferenceResult({ days, weeks, months, years });
    setArithmeticResult(null);
    setArithmeticOperation(null);
    setAgeResult(null);
    setPregnancyDueDateResult(null); // Clear pregnancy due date result
  };

  const handleDateArithmeticSubmit: SubmitHandler<DateArithmeticValues> = (data) => {
    const { baseDate, days, operation } = data;
    const resultDate =
      operation === "add"
        ? addDays(baseDate, days)
        : subDays(baseDate, days);
    setArithmeticResult(resultDate);
    setArithmeticOperation(operation);
    setDateDifferenceResult(null);
    setAgeResult(null);
    setPregnancyDueDateResult(null); // Clear pregnancy due date result
  };

  const handleAgeFinderSubmit: SubmitHandler<AgeFinderValues> = (data) => {
    const { dateOfBirth } = data;
    if (currentDate) {
        const duration = intervalToDuration({ start: dateOfBirth, end: currentDate });
        setAgeResult(duration);
        setDateDifferenceResult(null);
        setArithmeticResult(null);
        setArithmeticOperation(null);
        setPregnancyDueDateResult(null); // Clear pregnancy due date result
    }
  };

  // Handler for Pregnancy Due Date form submission
  const handlePregnancyDueDateSubmit: SubmitHandler<PregnancyDueDateValues> = (data) => {
      const { lastMenstrualPeriod } = data;
      // Naegele's Rule: LMP + 1 year - 3 months + 7 days
      let dueDate = addYears(lastMenstrualPeriod, 1);
      dueDate = subMonths(dueDate, 3);
      dueDate = addDays(dueDate, 7);
      setPregnancyDueDateResult(dueDate);
      setDateDifferenceResult(null);
      setArithmeticResult(null);
      setArithmeticOperation(null);
      setAgeResult(null);
  };

  // --- Render ---

  return (
     <main className="flex min-h-screen justify-center p-4 bg-background">
      <div className="flex w-full max-w-7xl justify-center gap-8">

        {/* Left Ad Placeholder */}
        <aside className="hidden lg:block w-40 flex-shrink-0 sticky top-4 h-fit">
          <AdSensePlaceholder width={160} height={600} />
        </aside>

        {/* Main Content Card */}
        <Card className="w-full max-w-2xl shadow-lg flex-grow">
           <CardHeader className="text-center px-6 pt-6 pb-4">
            <CardTitle className="text-2xl font-bold text-primary">
              Date-Arithmetic Boss
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
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
                                        date > new Date("2200-01-01") || date < new Date("1900-01-01"),
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
                                        date < (dateDifferenceForm.getValues("startDate") || new Date("1900-01-01")) || date > new Date("2200-01-01"), // Allow future dates
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
                    onSubmit={dateArithmeticForm.handleSubmit(handleDateArithmeticSubmit)}
                    className="space-y-6"
                  >
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
                                            date < new Date("1900-01-01") || date > new Date("2200-01-01"),
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
                                 <SelectItem value="add">Add Days</SelectItem>
                                 <SelectItem value="subtract">Subtract Days</SelectItem>
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

                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={!dateArithmeticForm.formState.isValid || dateArithmeticForm.formState.isSubmitting}
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
                          value={format(arithmeticResult, 'PPP')}
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
                                  date > (currentDate || new Date()) || date < new Date("1900-01-01"),
                                 captionLayout: "dropdown-buttons",
                                 fromYear: 1900,
                                 toYear: currentDate ? currentDate.getFullYear() : new Date().getFullYear(),
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

            <Separator className="my-8" /> {/* Added Separator */}

            {/* Estimate Pregnancy Due Date Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4 text-center">Estimate Pregnancy Due Date</h3>
              <Form {...pregnancyDueDateForm}>
                <form
                  onSubmit={pregnancyDueDateForm.handleSubmit(handlePregnancyDueDateSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={pregnancyDueDateForm.control}
                      name="lastMenstrualPeriod"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>First Day of Last Menstrual Period (LMP)</FormLabel>
                          <FormControl>
                            <DateInput
                              value={field.value}
                              onChange={field.onChange}
                              calendarProps={{
                                disabled: (date) =>
                                  date > (currentDate || new Date()) || date < subYears(new Date(), 2), // Disable future dates and dates older than 2 years
                                captionLayout: "dropdown-buttons",
                                fromYear: currentDate ? currentDate.getFullYear() - 2 : new Date().getFullYear() - 2, // Start 2 years ago
                                toYear: currentDate ? currentDate.getFullYear() : new Date().getFullYear(), // End at current year
                              }}
                              placeholder="mm/dd/yyyy"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!pregnancyDueDateForm.formState.isValid || pregnancyDueDateForm.formState.isSubmitting || !currentDate}>
                    <Baby className="mr-2 h-4 w-4" /> Estimate Due Date
                  </Button>
                </form>
              </Form>

              {pregnancyDueDateResult && (
                <Card className="mt-6 bg-secondary border-border">
                  <CardHeader>
                    <CardTitle className="text-xl">Estimated Due Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResultDisplay
                      title="Due Date"
                      value={format(pregnancyDueDateResult, 'PPP')} // e.g., Jun 20, 2024
                      unit=""
                    />
                     <p className="text-xs text-muted-foreground mt-2">Note: This is an estimate based on Naegele's rule. Consult your healthcare provider for confirmation.</p>
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

    