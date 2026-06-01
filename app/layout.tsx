import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/AppLayout";
import { RoleProvider } from "@/lib/RoleContext";
import { Toaster } from "@/components/ui/Toaster";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Real Estate Management System",
  description: "Interactive real estate property management platform with full site map and block details.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <RoleProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </RoleProvider>
        <Toaster />
      </body>
    </html>
  );
}
