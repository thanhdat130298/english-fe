import React, { useState } from 'react';
import { Sidebar, Page } from './Sidebar';
import { Menu } from 'lucide-react';

type AppLayoutProps = {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
};

export function AppLayout({
  children,
  currentPage,
  onNavigate,
  onLogout
}: AppLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed top-4 left-4 z-30 md:hidden p-2 bg-white rounded-lg shadow-md text-gray-700 hover:bg-gray-50 transition-colors"
        aria-label="Open menu">
        <Menu size={24} />
      </button>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 transition-all duration-300 ease-in-out p-4 md:p-8 pt-16 md:pt-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}