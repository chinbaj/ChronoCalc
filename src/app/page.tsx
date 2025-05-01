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
} from "date-fns";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Schema for Date Difference Form
const dateDifferenceSchema = z.object({
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
});

type DateDifferenceValues = z.infer<typeof dateDifferenceSchema>;

// Schema for Date Arithmetic Form
const dateArithmeticSchema = z.object({
  baseDate: z.date({ required_error: "A date is required." }),
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
  });

  // Date Arithmetic Form
  const dateArithmeticForm = useForm<DateArithmeticValues>({
    resolver: zodResolver(dateArithmeticSchema),
    defaultValues: {
      operation: "add", // Default operation
    },
  });

  // Handlers
  const handleDateDifferenceSubmit: SubmitHandler<DateDifferenceValues> = (
    data
  ) => {
    const { startDate, endDate } = data;
    if (startDate && endDate) {
      const days = differenceInDays(endDate, startDate);
      const weeks = differenceInWeeks(endDate, startDate);
      const months = differenceInMonths(endDate, startDate);
      const years = differenceInYears(endDate, startDate);
      setDateDifferenceResult({ days, weeks, months, years });
      setArithmeticResult(null); // Clear other result
    }
  };

  const handleDateArithmeticSubmit = (operation: "add" | "subtract") => {
    dateArithmeticForm.setValue("operation", operation); // Set operation before trigger
    setArithmeticOperation(operation);
    dateArithmeticForm.handleSubmit((data) => {
      const { baseDate, days } = data;
      if (baseDate && days) {
        const resultDate =
          operation === "add"
            ? addDays(baseDate, days)
            : subDays(baseDate, days);
        setArithmeticResult(resultDate);
        setDateDifferenceResult(null); // Clear other result
      }
    })(); // Trigger validation and submission
  };

  // Reset results when tab changes
  const handleTabChange = () => {
    setDateDifferenceResult(null);
    setArithmeticResult(null);
    setArithmeticOperation(null);
    dateDifferenceForm.reset();
    dateArithmeticForm.reset({ operation: "add" }); // Reset with default operation
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
        <CardContent>
          <Tabs defaultValue="difference" className="w-full" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="difference">Date Difference</TabsTrigger>
              <TabsTrigger value="arithmetic">Date Arithmetic</TabsTrigger>
            </TabsList>

            {/* Date Difference Tab */}
            <TabsContent value="difference">
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
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
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
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < (dateDifferenceForm.getValues("startDate") || new Date("1900-01-01"))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
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
            </TabsContent>

            {/* Date Arithmetic Tab */}
            <TabsContent value="arithmetic">
              <Form {...dateArithmeticForm}>
                <form
                  // We don't use onSubmit here directly, buttons trigger specific handlers
                  className="space-y-6"
                  onSubmit={(e) => e.preventDefault()} // Prevent default form submission
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <FormField
                        control={dateArithmeticForm.control}
                        name="baseDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                   disabled={(date) => date < new Date("1900-01-01")}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
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
                              <Input type="number" placeholder="Enter number of days" {...field} min="1" step="1" />
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
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Days
                    </Button>
                    <Button
                      type="button" // Important: Change type to button
                      onClick={() => handleDateArithmeticSubmit("subtract")}
                      variant="outline"
                      className="w-full border-accent text-accent hover:bg-accent/10"
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
