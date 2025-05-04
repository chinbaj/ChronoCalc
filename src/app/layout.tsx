
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { ThemeProvider } from '@/components/theme/theme-provider'; // Import ThemeProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Date-Arithmetic Boss: Date Calculator for Date Difference, Add or Subtract days to or From a date, Find Age, Due Dates, etc.',
  description: 'Your go-to date calculator. Easily find the difference between two dates, add or subtract days from a date, calculate age from date of birth, and estimate pregnancy due dates (LMP, Conception, IVF).',
  keywords: 'date calculator, date difference, date arithmetic, add days to date, subtract days from date, age calculator, pregnancy due date calculator, due date estimator, LMP calculator, conception date calculator, IVF due date calculator, time calculator',
  authors: [{ name: 'Date-Arithmetic Boss Team' }], // Optional: Add author info
  // Open Graph / Facebook
  openGraph: {
    title: 'Date-Arithmetic Boss: Date Calculator for Date Difference, Add or Subtract days to or From a date, Find Age, Due Dates, etc.',
    description: 'Easily find date differences, add/subtract days, calculate age, and estimate pregnancy due dates.',
    type: 'website',
     url: 'https://date-calculator-boss.com/', // Optional: Add your site's URL
    // images: [ // Optional: Add an image URL for social sharing
    //   {
    //     url: 'YOUR_IMAGE_URL',
    //     width: 1200,
    //     height: 630,
    //     alt: 'Date-Arithmetic Boss App Screenshot',
    //   },
    // ],
  },
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Date-Arithmetic Boss: Calculator for Dates, Age & Due Dates',
    description: 'Easily find date differences, add/subtract days, calculate age, and estimate pregnancy due dates.',
    // site: '@yourtwitterhandle', // Optional: Add your Twitter handle
    // creator: '@creatorhandle', // Optional: Add creator's Twitter handle
    // images: ['YOUR_IMAGE_URL'], // Optional: Add an image URL for Twitter card
  },
  robots: { // Ensure search engines can crawl
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Optional: Add canonical URL if applicable
  // alternates: {
  //   canonical: 'YOUR_CANONICAL_URL',
  // },
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Date-Arithmetic Boss',
  description: 'A web application to calculate date differences, perform date arithmetic, find age, and estimate pregnancy due dates.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any', // Web-based
  browserRequirements: 'Requires Javascript',
  featureList: [
    'Calculate difference between two dates (years, months, weeks, days)',
    'Add days to a date',
    'Subtract days from a date',
    'Calculate age based on date of birth',
    'Estimate pregnancy due date based on Last Menstrual Period (LMP)',
    'Estimate pregnancy due date based on Conception Date',
    'Estimate pregnancy due date based on IVF Transfer Date',
    'Option to use in dark or light or system mode'
  ],
  keywords: 'date calculator, date difference, date arithmetic, add days to a date, subtract days from a date, age calculator, pregnancy due date calculator, due date estimator',
  url: 'https://date-calculator-boss.com/', // Optional: Add your site's URL
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-4834196234787374" />
        {/* Add JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
         </ThemeProvider>
      </body>
    </html>
  );
}
