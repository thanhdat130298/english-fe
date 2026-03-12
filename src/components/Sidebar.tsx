import { useState } from 'react';
import {
  Languages,
  BookOpen,
  List,
  BarChart2,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X } from
'lucide-react';
export type Page =
'translate' |
'vocabulary' |
'wordlists' |
'progress' |
'profile';
type SidebarProps = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
};
export function Sidebar({ currentPage, onNavigate, onLogout, isOpen = true, onClose }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Close drawer on mobile when navigating
  const handleNavigate = (page: Page) => {
    onNavigate(page);
    // Close drawer on mobile after navigation
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };
  const navItems = [
  {
    id: 'translate',
    label: 'Translate',
    icon: Languages
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: BookOpen
  },
  {
    id: 'wordlists',
    label: 'Wordlists',
    icon: List
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: BarChart2
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User
  }] as
  const;
  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {onClose && (
        <div
          className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col z-50
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${onClose ? 'md:translate-x-0' : ''}
          ${onClose && isOpen ? 'translate-x-0' : onClose ? '-translate-x-full' : ''}
        `}>

        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100">
          <div className="w-8 h-8 bg-[#213A58] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span
            className={`ml-3 font-semibold text-gray-900 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>

            English App
          </span>
          {/* Mobile Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto md:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close menu">
              <X size={20} />
            </button>
          )}
        </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors group relative ${isActive ? 'bg-[#E6FAF2] text-[#0C6478]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              title={isCollapsed ? item.label : undefined}>

              <Icon
                size={20}
                className={`flex-shrink-0 ${isActive ? 'text-[#0C6478]' : 'text-gray-500 group-hover:text-gray-700'}`} />

              <span
                className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>

                {item.label}
              </span>

              {/* Active Indicator */}
              {isActive &&
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#0C6478] rounded-l-full opacity-0 sm:opacity-100" />
              }
            </button>);

        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex w-full items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>

          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <button
          onClick={() => {
            onLogout();
            if (onClose) {
              onClose();
            }
          }}
          className="w-full flex items-center px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors group">
          <LogOut
            size={20}
            className="flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
          <span
            className={`ml-3 font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
    </>);

}