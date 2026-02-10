import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import AdBanner from "@/components/ads/AdBanner";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="p-6">
          {children}
          <AdBanner adSlot="8859292246" className="mt-6" />
        </div>
      </main>
    </div>
  );
}
