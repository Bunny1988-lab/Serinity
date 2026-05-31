import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LoaderProvider } from "@/components/loader-context";
import { Toaster } from "sonner";

const fontSans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiet | Premium Network",
  description: "A calm, privacy-first social platform for intentional connection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LoaderProvider>
            {children}
            <Toaster position="bottom-center" toastOptions={{ className: 'font-sans' }} />
          </LoaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
