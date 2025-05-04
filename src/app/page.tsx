
"use client";

import type { DateRange } from "react-day-picker";
import { useState, type ReactNode, useEffect } from "react";
import React from 'react'; // Import React
import {
  addDays,
  addYears, // Added for pregnancy calculation
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  format,
  isValid,
  intervalToDuration,
  isBefore, // Used for conception date validation
  subDays,
  subMonths, // Added for pregnancy calculation
  subYears,
} from "date-fns";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Cake, Baby, Info, Menu } from "lucide-react"; // Removed FlaskConical

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";

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
    .min(1, "Must be at least 1 day.")
    .optional() // Make optional to allow clearing
    .refine(val => val === undefined || val >= 1, {
        message: "Must be at least 1 day.",
    }), // Add refine check
});

const ageFinderSchema = z.object({
  dateOfBirth: z.date({
    required_error: "Date of birth is required.",
    invalid_type_error: "Invalid date format.",
  }).refine(isValid, { message: "Invalid date." })
    .refine(date => date <= new Date(), { message: "Date of birth cannot be in the future." }),
});

// Updated Schema for Pregnancy Due Date Form
const pregnancyDueDateSchema = z.object({
  calculationMethod: z.enum(['lmp', 'conception', 'ivf'], {
    required_error: "Please select a calculation method.",
  }),
  lastMenstrualPeriod: z.date({
    invalid_type_error: "Invalid date format.",
  }).optional(),
  conceptionDate: z.date({
    invalid_type_error: "Invalid date format.",
  }).optional(),
  ivfTransferDate: z.date({ // Added IVF transfer date
    invalid_type_error: "Invalid date format.",
  }).optional(),
  ivfEmbryoAge: z.enum(['day3', 'day5'], {
     errorMap: () => ({ message: 'Please select embryo age.' }),
  }).optional(),
}).superRefine((data, ctx) => {
  const now = new Date();
  const nineMonthsAgo = subMonths(now, 9); // Approximate conception window start

  if (data.calculationMethod === 'lmp') {
    if (!data.lastMenstrualPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last menstrual period date is required.",
        path: ["lastMenstrualPeriod"],
      });
    } else if (!isValid(data.lastMenstrualPeriod)) {
       ctx.addIssue({
        code: z.ZodIssueCode.invalid_date,
        message: "Invalid date.",
        path: ["lastMenstrualPeriod"],
      });
    } else if (isBefore(now, data.lastMenstrualPeriod)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "LMP date cannot be in the future.",
        path: ["lastMenstrualPeriod"],
      });
    }
     // Optional: Add check if LMP is too far in the past (e.g., > 2 years)
     else if (isBefore(data.lastMenstrualPeriod, subYears(now, 2))) {
       ctx.addIssue({
         code: z.ZodIssueCode.custom,
         message: "LMP date seems too old.",
         path: ["lastMenstrualPeriod"],
       });
     }
  } else if (data.calculationMethod === 'conception') {
    if (!data.conceptionDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Conception date is required.",
        path: ["conceptionDate"],
      });
    } else if (!isValid(data.conceptionDate)) {
        ctx.addIssue({
            code: z.ZodIssueCode.invalid_date,
            message: "Invalid date.",
            path: ["conceptionDate"],
        });
    } else if (isBefore(now, data.conceptionDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Conception date cannot be in the future.",
        path: ["conceptionDate"],
      });
    }
    // Check if conception date is reasonably within the last 9 months
    else if (isBefore(data.conceptionDate, nineMonthsAgo)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Conception date seems too old.",
            path: ["conceptionDate"],
        });
    }
  } else if (data.calculationMethod === 'ivf') { // Added IVF validation
      if (!data.ivfTransferDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "IVF transfer date is required.",
          path: ["ivfTransferDate"],
        });
      } else if (!isValid(data.ivfTransferDate)) {
          ctx.addIssue({
              code: z.ZodIssueCode.invalid_date,
              message: "Invalid date.",
              path: ["ivfTransferDate"],
          });
      } else if (isBefore(now, data.ivfTransferDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "IVF transfer date cannot be in the future.",
          path: ["ivfTransferDate"],
        });
      }
      // Check if transfer date is reasonably within the last 9 months
      else if (isBefore(data.ivfTransferDate, nineMonthsAgo)) {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "IVF transfer date seems too old.",
              path: ["ivfTransferDate"],
          });
      }

      if (!data.ivfEmbryoAge) {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Embryo age selection is required.",
              path: ["ivfEmbryoAge"],
          });
      }
  }
});


// --- Types ---

type DateDifferenceValues = z.infer<typeof dateDifferenceSchema>;
type DateArithmeticValues = z.infer<typeof dateArithmeticSchema>;
type AgeFinderValues = z.infer<typeof ageFinderSchema>;
type PregnancyDueDateValues = z.infer<typeof pregnancyDueDateSchema>;

// --- Components ---

interface ResultDisplayProps {
  title: string;
  value: ReactNode;
  unit: string;
}

function ResultDisplay({ title, value, unit }: ResultDisplayProps) {
  // Assign unique IDs for accessibility relationships
  const valueId = React.useId();
  const titleId = `${valueId}-title`;
  const unitId = `${valueId}-unit`;

  return (
    <div
      className="flex items-baseline gap-2 rounded-md bg-secondary p-3 text-secondary-foreground shadow-sm"
      role="group" // Group related information
      aria-labelledby={titleId}
    >
      <span id={titleId} className="text-sm font-medium text-muted-foreground">{title}:</span>
      <span id={valueId} className="text-lg font-semibold" aria-describedby={unit ? unitId : undefined}>{value}</span>
      {unit && <span id={unitId} className="text-sm text-muted-foreground">{unit}</span>}
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
  const [pregnancyDueDateResult, setPregnancyDueDateResult] = useState<{date: Date, method: string} | null>(null);
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

   const pregnancyDueDateForm = useForm<PregnancyDueDateValues>({
       resolver: zodResolver(pregnancyDueDateSchema),
       mode: 'onChange',
       defaultValues: {
           calculationMethod: 'lmp',
           lastMenstrualPeriod: undefined,
           conceptionDate: undefined,
           ivfTransferDate: undefined,
           ivfEmbryoAge: undefined,
       }
   });

   const calculationMethod = pregnancyDueDateForm.watch('calculationMethod');

  // --- Handlers ---

  const handleDateDifferenceSubmit: SubmitHandler<DateDifferenceValues> = (data) => {
    const { startDate, endDate } = data;
    if (startDate && endDate) {
        const days = differenceInDays(endDate, startDate);
        const weeks = differenceInWeeks(endDate, startDate);
        const months = differenceInMonths(endDate, startDate);
        const years = differenceInYears(endDate, startDate);
        setDateDifferenceResult({ days, weeks, months, years });
        setArithmeticResult(null);
        setArithmeticOperation(null);
        setAgeResult(null);
        setPregnancyDueDateResult(null);
    }
  };

  const handleDateArithmeticSubmit: SubmitHandler<DateArithmeticValues> = (data) => {
    const { baseDate, days, operation } = data;
    if (baseDate && days !== undefined && days >= 1) {
        const resultDate =
            operation === "add"
                ? addDays(baseDate, days)
                : subDays(baseDate, days);
        setArithmeticResult(resultDate);
        setArithmeticOperation(operation);
        setDateDifferenceResult(null);
        setAgeResult(null);
        setPregnancyDueDateResult(null);
    } else {
        setArithmeticResult(null);
        setArithmeticOperation(null);
    }
  };

  const handleAgeFinderSubmit: SubmitHandler<AgeFinderValues> = (data) => {
    const { dateOfBirth } = data;
    if (currentDate && dateOfBirth) {
        const duration = intervalToDuration({ start: dateOfBirth, end: currentDate });
        setAgeResult(duration);
        setDateDifferenceResult(null);
        setArithmeticResult(null);
        setArithmeticOperation(null);
        setPregnancyDueDateResult(null);
    }
  };

  const handlePregnancyDueDateSubmit: SubmitHandler<PregnancyDueDateValues> = (data) => {
      const { calculationMethod, lastMenstrualPeriod, conceptionDate, ivfTransferDate, ivfEmbryoAge } = data;
      let dueDate: Date | null = null;
      let methodUsed: string = calculationMethod;

      try {
          if (calculationMethod === 'lmp' && lastMenstrualPeriod && isValid(lastMenstrualPeriod)) {
            dueDate = addDays(lastMenstrualPeriod, 280);
            methodUsed = "LMP (Naegele's rule)";
          } else if (calculationMethod === 'conception' && conceptionDate && isValid(conceptionDate)) {
            dueDate = addDays(conceptionDate, 266);
            methodUsed = "conception date";
          } else if (calculationMethod === 'ivf' && ivfTransferDate && isValid(ivfTransferDate) && ivfEmbryoAge) {
            const daysToAdd = ivfEmbryoAge === 'day3' ? 263 : 261;
            dueDate = addDays(ivfTransferDate, daysToAdd);
            methodUsed = `IVF transfer date (${ivfEmbryoAge === 'day3' ? 'Day-3' : 'Day-5'} embryo)`;
          }

          if (dueDate && isValid(dueDate)) {
             setPregnancyDueDateResult({ date: dueDate, method: methodUsed });
          } else {
             setPregnancyDueDateResult(null);
             // Optionally show an error message if due date couldn't be calculated
             console.error("Could not calculate valid due date.");
          }
      } catch (error) {
          console.error("Error calculating due date:", error);
          setPregnancyDueDateResult(null);
          // Optionally show a generic error message to the user
      }


      // Clear other results regardless of success/failure
      setDateDifferenceResult(null);
      setArithmeticResult(null);
      setArithmeticOperation(null);
      setAgeResult(null);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // --- Render ---

  return (
     <main className="flex min-h-screen justify-center p-4 bg-background" role="main">
      <div className="flex w-full max-w-7xl justify-center gap-8">

        {/* Left Ad Placeholder */}
        <aside className="hidden lg:block w-40 flex-shrink-0 sticky top-4 h-fit" aria-label="Advertisements Left">
          <AdSensePlaceholder width={160} height={600} />
        </aside>

        {/* Main Content Card - Wrapped with TooltipProvider */}
        <TooltipProvider>
          <Card className="w-full max-w-2xl shadow-lg flex-grow relative"> {/* Added relative positioning */}
            {/* Navigation Dropdown */}
            <div className="absolute top-2 left-2 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                           variant="ghost"
                           size="icon"
                           className="bg-primary text-primary-foreground hover:bg-warning hover:text-warning-foreground"
                           aria-label="Navigation Menu"
                        >
                            <Menu className="h-5 w-5" aria-hidden="true" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); scrollToSection('date-difference'); }}>
                            Date Difference
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); scrollToSection('date-arithmetic'); }}>
                            Date Arithmetic
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); scrollToSection('find-age'); }}>
                            Find Age
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); scrollToSection('estimate-due-date'); }}>
                            Estimate Due Date
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

             <CardHeader className="text-center px-6 pt-6 pb-4">
              {/* Changed to h1 for main page title */}
              <CardTitle as="h1" className="text-2xl font-bold text-primary mt-6">
                Date-Arithmetic Boss
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">

              {/* Date Difference Section */}
              <section id="date-difference" aria-labelledby="date-difference-heading">
                 <h2 id="date-difference-heading" className="text-xl font-semibold mb-4 text-center">Date Difference</h2>
                  <Form {...dateDifferenceForm}>
                    <form
                      onSubmit={dateDifferenceForm.handleSubmit(
                        handleDateDifferenceSubmit
                      )}
                      className="space-y-6"
                      aria-labelledby="date-difference-heading" // Associate form with heading
                    >
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          control={dateDifferenceForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel htmlFor={`${field.name}-input`}>Start Date</FormLabel>
                               <FormControl>
                                 <DateInput
                                    value={field.value}
                                    onChange={field.onChange}
                                    calendarProps={{
                                        disabled: (date) =>
                                          date > new Date("2200-01-01") || date < new Date("1900-01-01"),
                                    }}
                                    placeholder="mm/dd/yyyy"
                                    suppressHydrationWarning // Keep hydration warning suppression
                                    aria-required="true" // Mark as required for accessibility
                                    id={`${field.name}-input`} // Add unique ID
                                    aria-label="Start Date" // Add specific label
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
                              <FormLabel htmlFor={`${field.name}-input`}>End Date</FormLabel>
                              <FormControl>
                                  <DateInput
                                      value={field.value}
                                      onChange={field.onChange}
                                      calendarProps={{
                                           disabled: (date) =>
                                            date < (dateDifferenceForm.getValues("startDate") || new Date("1900-01-01")) || date > new Date("2200-01-01"),
                                      }}
                                      placeholder="mm/dd/yyyy"
                                      suppressHydrationWarning // Keep hydration warning suppression
                                      aria-required="true" // Mark as required
                                      id={`${field.name}-input`} // Add unique ID
                                      aria-label="End Date" // Add specific label
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
                    <Alert className="mt-6" aria-live="polite" aria-atomic="true">
                        <AlertTitle className="text-lg font-semibold">Difference Result</AlertTitle>
                        <AlertDescription>
                             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-2">
                               <ResultDisplay title="Years" value={dateDifferenceResult.years} unit="years" />
                               <ResultDisplay title="Months" value={dateDifferenceResult.months} unit="months" />
                               <ResultDisplay title="Weeks" value={dateDifferenceResult.weeks} unit="weeks" />
                               <ResultDisplay title="Days" value={dateDifferenceResult.days} unit="days" />
                             </div>
                        </AlertDescription>
                    </Alert>
                  )}
              </section>

              <Separator className="my-8" />

               {/* Date Arithmetic Section */}
               <section id="date-arithmetic" aria-labelledby="date-arithmetic-heading">
                 <h2 id="date-arithmetic-heading" className="text-xl font-semibold mb-4 text-center">Date Arithmetic</h2>
                  <Form {...dateArithmeticForm}>
                    <form
                      onSubmit={dateArithmeticForm.handleSubmit(handleDateArithmeticSubmit)}
                      className="space-y-6"
                      aria-labelledby="date-arithmetic-heading"
                    >
                        <FormField
                          control={dateArithmeticForm.control}
                          name="baseDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel htmlFor={`${field.name}-input`}>Date</FormLabel>
                               <FormControl>
                                  <DateInput
                                      value={field.value}
                                      onChange={field.onChange}
                                      calendarProps={{
                                          disabled: (date) =>
                                            date < new Date("1900-01-01") || date > new Date("2200-01-01"),
                                      }}
                                      placeholder="mm/dd/yyyy"
                                      suppressHydrationWarning // Keep hydration warning suppression
                                      aria-required="true"
                                      id={`${field.name}-input`}
                                      aria-label="Base Date"
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
                               <Select onValueChange={field.onChange} defaultValue={field.value} aria-required="true">
                                 <FormControl>
                                   <SelectTrigger suppressHydrationWarning aria-label="Select Operation: Add or Subtract Days">
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
                              <FormLabel htmlFor={`${field.name}-input`}>Number of Days</FormLabel>
                              <FormControl>
                                <Input
                                    type="number"
                                    placeholder="Enter number of days"
                                    {...field}
                                    onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)}
                                    value={field.value ?? ''}
                                    min="1"
                                    step="1"
                                    suppressHydrationWarning // Keep hydration warning suppression
                                    aria-required="true"
                                    id={`${field.name}-input`}
                                    aria-label="Number of Days"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      <Button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90"
                        disabled={!dateArithmeticForm.formState.isValid || dateArithmeticForm.formState.isSubmitting}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" /> Calculate New Date
                      </Button>
                    </form>
                  </Form>

                  {arithmeticResult && arithmeticOperation && (
                     <Alert className="mt-6" aria-live="polite" aria-atomic="true"> {/* Announce results */}
                      <AlertTitle className="text-lg font-semibold">Arithmetic Result</AlertTitle>
                      <AlertDescription>
                          <div className="mt-2">
                             <ResultDisplay
                                title={`${arithmeticOperation === 'add' ? 'New Date (Added)' : 'New Date (Subtracted)'}`}
                                value={format(arithmeticResult, 'PPP')}
                                unit=""
                              />
                          </div>
                       </AlertDescription>
                    </Alert>
                  )}
              </section>

              <Separator className="my-8" />

              {/* Find Age Section */}
              <section id="find-age" aria-labelledby="find-age-heading">
                <h2 id="find-age-heading" className="text-xl font-semibold mb-4 text-center">Find Age</h2>
                <Form {...ageFinderForm}>
                  <form
                    onSubmit={ageFinderForm.handleSubmit(handleAgeFinderSubmit)}
                    className="space-y-6"
                    aria-labelledby="find-age-heading"
                  >
                    <div className="grid grid-cols-1 gap-4">
                       <FormField
                        control={ageFinderForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel htmlFor={`${field.name}-input`}>Date of Birth</FormLabel>
                            <FormControl>
                              <DateInput
                                value={field.value}
                                onChange={field.onChange}
                                calendarProps={{
                                  disabled: (date) =>
                                    date > (currentDate || new Date()) || date < subYears(new Date(), 150), // Limit to reasonable past date
                                   captionLayout: "dropdown-buttons",
                                   fromYear: currentDate ? currentDate.getFullYear() - 150 : new Date().getFullYear() - 150,
                                   toYear: currentDate ? currentDate.getFullYear() : new Date().getFullYear(),
                                }}
                                placeholder="mm/dd/yyyy"
                                suppressHydrationWarning // Keep hydration warning suppression
                                aria-required="true"
                                id={`${field.name}-input`}
                                aria-label="Date of Birth"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!ageFinderForm.formState.isValid || ageFinderForm.formState.isSubmitting || !currentDate}>
                        <Cake className="mr-2 h-4 w-4" aria-hidden="true" /> Calculate Age
                     </Button>
                  </form>
                </Form>

                {ageResult && (
                    <Alert className="mt-6" aria-live="polite" aria-atomic="true"> {/* Announce results */}
                      <AlertTitle className="text-lg font-semibold">Age Result</AlertTitle>
                      <AlertDescription>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-2">
                            <ResultDisplay title="Years" value={ageResult.years ?? 0} unit="years" />
                            <ResultDisplay title="Months" value={ageResult.months ?? 0} unit="months" />
                            <ResultDisplay title="Days" value={ageResult.days ?? 0} unit="days" />
                          </div>
                      </AlertDescription>
                    </Alert>
                  )}

              </section>

              <Separator className="my-8" />

              {/* Estimate Pregnancy Due Date Section */}
              <section id="estimate-due-date" aria-labelledby="estimate-due-date-heading">
                <h2 id="estimate-due-date-heading" className="text-xl font-semibold mb-4 text-center">Estimate Pregnancy Due Date</h2>
                <Form {...pregnancyDueDateForm}>
                  <form
                    onSubmit={pregnancyDueDateForm.handleSubmit(handlePregnancyDueDateSubmit)}
                    className="space-y-6"
                    aria-labelledby="estimate-due-date-heading"
                  >
                     <FormField
                       control={pregnancyDueDateForm.control}
                       name="calculationMethod"
                       render={({ field }) => (
                         <FormItem className="space-y-3">
                           <FormLabel asChild>
                                <legend className={cn("text-sm font-medium leading-none", field.value ? "" : "text-destructive")}>Calculate based on:</legend>
                           </FormLabel>
                           <FormControl>
                             <RadioGroup
                               onValueChange={(value) => {
                                    field.onChange(value);
                                    pregnancyDueDateForm.reset({
                                        calculationMethod: value as 'lmp' | 'conception' | 'ivf',
                                        lastMenstrualPeriod: undefined,
                                        conceptionDate: undefined,
                                        ivfTransferDate: undefined,
                                        ivfEmbryoAge: undefined,
                                    });
                                    setPregnancyDueDateResult(null);
                                }}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1 sm:flex-row sm:flex-wrap sm:space-y-0 sm:gap-x-4 sm:gap-y-2"
                                aria-required="true"
                                aria-labelledby="estimate-due-date-heading" // Group label
                             >
                               <FormItem className="flex items-center space-x-3 space-y-0">
                                 <FormControl>
                                   <RadioGroupItem value="lmp" id="lmp" aria-label="Last Menstrual Period"/>
                                 </FormControl>
                                 <FormLabel htmlFor="lmp" className="font-normal flex items-center gap-1 cursor-pointer">
                                   LMP
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-auto w-auto p-0 m-0" aria-label="More information about LMP calculation">
                                           <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" aria-hidden="true" />
                                        </Button>
                                     </TooltipTrigger>
                                     <TooltipContent side="top" align="start" className="max-w-xs">
                                       <p className="text-sm">Your LMP plus 280 days (40 weeks) is the most used method to estimate due date.</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 </FormLabel>
                               </FormItem>
                               <FormItem className="flex items-center space-x-3 space-y-0">
                                 <FormControl>
                                   <RadioGroupItem value="conception" id="conception" aria-label="Conception Date"/>
                                 </FormControl>
                                 <FormLabel htmlFor="conception" className="font-normal flex items-center gap-1 cursor-pointer">
                                   Conception Date
                                   <Tooltip>
                                       <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-auto w-auto p-0 m-0" aria-label="More information about Conception Date calculation">
                                               <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" aria-hidden="true" />
                                            </Button>
                                       </TooltipTrigger>
                                       <TooltipContent side="top" align="start" className="max-w-xs">
                                           <p className="text-sm">Your conception date plus 266 days gives a fairly good estimate of your due date.</p>
                                       </TooltipContent>
                                   </Tooltip>
                                 </FormLabel>
                               </FormItem>
                               <FormItem className="flex items-center space-x-3 space-y-0">
                                   <FormControl>
                                       <RadioGroupItem value="ivf" id="ivf" aria-label="IVF Transfer Date"/>
                                   </FormControl>
                                   <FormLabel htmlFor="ivf" className="font-normal flex items-center gap-1 cursor-pointer">
                                       IVF Transfer Date
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <Button variant="ghost" size="icon" className="h-auto w-auto p-0 m-0" aria-label="More information about IVF Transfer Date calculation">
                                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" aria-hidden="true"/>
                                                 </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="start" className="max-w-xs">
                                                <p className="text-sm">Calculate based on the date of embryo transfer during an In Vitro Fertilization (IVF) cycle.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                   </FormLabel>
                               </FormItem>
                             </RadioGroup>
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )}
                     />

                     {/* Conditional Fields */}
                     {calculationMethod === 'lmp' && (
                       <FormField
                         control={pregnancyDueDateForm.control}
                         name="lastMenstrualPeriod"
                         render={({ field }) => (
                           <FormItem className="flex flex-col">
                             <FormLabel htmlFor={`${field.name}-input`}>First Day of Last Menstrual Period (LMP)</FormLabel>
                             <FormControl>
                               <DateInput
                                 value={field.value}
                                 onChange={field.onChange}
                                 calendarProps={{
                                   disabled: (date) =>
                                     date > (currentDate || new Date()) || date < subYears(new Date(), 2),
                                   captionLayout: "dropdown-buttons",
                                   fromYear: currentDate ? currentDate.getFullYear() - 2 : new Date().getFullYear() - 2,
                                   toYear: currentDate ? currentDate.getFullYear() : new Date().getFullYear(),
                                 }}
                                 placeholder="mm/dd/yyyy"
                                 suppressHydrationWarning // Keep hydration warning suppression
                                 aria-required="true"
                                 id={`${field.name}-input`}
                                 aria-label="First Day of Last Menstrual Period"
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     )}

                     {calculationMethod === 'conception' && (
                       <FormField
                         control={pregnancyDueDateForm.control}
                         name="conceptionDate"
                         render={({ field }) => (
                           <FormItem className="flex flex-col">
                             <FormLabel htmlFor={`${field.name}-input`}>Estimated Conception Date</FormLabel>
                             <FormControl>
                               <DateInput
                                 value={field.value}
                                 onChange={field.onChange}
                                 calendarProps={{
                                   disabled: (date) =>
                                     date > (currentDate || new Date()) || date < subMonths(new Date(), 9),
                                   captionLayout: "dropdown-buttons",
                                   fromYear: currentDate ? currentDate.getFullYear() - 1 : new Date().getFullYear() - 1,
                                   toYear: currentDate ? currentDate.getFullYear() : new Date().getFullYear(),
                                 }}
                                 placeholder="mm/dd/yyyy"
                                 suppressHydrationWarning // Keep hydration warning suppression
                                 aria-required="true"
                                 id={`${field.name}-input`}
                                 aria-label="Estimated Conception Date"
                               />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                     )}

                     {calculationMethod === 'ivf' && (
                        <div className="space-y-6">
                           <FormField
                             control={pregnancyDueDateForm.control}
                             name="ivfTransferDate"
                             render={({ field }) => (
                               <FormItem className="flex flex-col">
                                 <FormLabel htmlFor={`${field.name}-input`}>Date of Transfer</FormLabel>
                                 <FormControl>
                                   <DateInput
                                     value={field.value}
                                     onChange={field.onChange}
                                     calendarProps={{
                                       disabled: (date) =>
                                         date > (currentDate || new Date()) || date < subMonths(new Date(), 9),
                                       captionLayout: "dropdown-buttons",
                                       fromYear: currentDate ? currentDate.getFullYear() - 1 : new Date().getFullYear() - 1,
                                       toYear: currentDate ? currentDate.getFullYear() : new Date().getFullYear(),
                                     }}
                                     placeholder="mm/dd/yyyy"
                                     suppressHydrationWarning // Keep hydration warning suppression
                                     aria-required="true"
                                     id={`${field.name}-input`}
                                     aria-label="IVF Date of Transfer"
                                   />
                                 </FormControl>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                           <FormField
                             control={pregnancyDueDateForm.control}
                             name="ivfEmbryoAge"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel>Embryo Age at Transfer</FormLabel>
                                 <Select onValueChange={field.onChange} defaultValue={field.value} aria-required="true">
                                   <FormControl>
                                     <SelectTrigger suppressHydrationWarning aria-label="Select Embryo Age at Transfer">
                                       <SelectValue placeholder="Select embryo age" />
                                     </SelectTrigger>
                                   </FormControl>
                                   <SelectContent>
                                     <SelectItem value="day3">Day-3 Embryo Transfer</SelectItem>
                                     <SelectItem value="day5">Day-5 Embryo Transfer</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <FormMessage />
                               </FormItem>
                             )}
                           />
                        </div>
                     )}


                     <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={!pregnancyDueDateForm.formState.isValid || pregnancyDueDateForm.formState.isSubmitting || !currentDate}>
                      <Baby className="mr-2 h-4 w-4" aria-hidden="true" /> Estimate Due Date
                     </Button>
                  </form>
                </Form>

                {pregnancyDueDateResult && (
                  <Alert className="mt-6" aria-live="polite" aria-atomic="true"> {/* Announce results */}
                    <AlertTitle className="text-lg font-semibold">Estimated Due Date</AlertTitle>
                    <AlertDescription>
                        <div className="mt-2 space-y-2">
                            <ResultDisplay
                                title="Due Date"
                                value={format(pregnancyDueDateResult.date, 'PPP')} // e.g., Jun 20, 2024
                                unit=""
                            />
                           <p className="text-xs text-muted-foreground">
                             Note: This is an estimate based on the {pregnancyDueDateResult.method}. Consult your healthcare provider for confirmation.
                           </p>
                        </div>
                     </AlertDescription>
                  </Alert>
                )}
              </section>


            </CardContent>
          </Card>
        </TooltipProvider>

        {/* Right Ad Placeholder */}
         <aside className="hidden lg:block w-40 flex-shrink-0 sticky top-4 h-fit" aria-label="Advertisements Right">
            <AdSensePlaceholder width={160} height={600} />
         </aside>

      </div>
    </main>
  );
}

