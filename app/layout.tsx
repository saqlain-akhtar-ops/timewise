import type { Metadata } from "next";
import "./globals.css";
import { TimewiseProvider } from "@/hooks/use-timewise";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const metadata: Metadata = {
  title: "TIMEWISE — Plan Smarter. Focus Better. Achieve More.",
  description:
    "Student Productivity and Self-Regulated Learning Platform aligned with UN SDG 4 (Quality Education).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 antialiased">
        <ErrorBoundary>
          <TimewiseProvider>{children}</TimewiseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
