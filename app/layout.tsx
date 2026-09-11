import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import { DataProvider } from "@/lib/data/store";
import { IntegrationsProvider } from "@/lib/integrations/useIntegrations";
import { IntegrationProvider } from "@/lib/integrations/IntegrationProvider";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dayly — Daily Task & Project Tracker",
  description:
    "A mobile-first daily task and project tracker. Plan your day, log your work.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <IntegrationsProvider>
                <IntegrationProvider>
                  <AppShell>{children}</AppShell>
                </IntegrationProvider>
              </IntegrationsProvider>
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
