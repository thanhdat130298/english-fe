import React from 'react';
import { User, Settings, LogOut, Shield, Bell } from 'lucide-react';
type ProfilePageProps = {
  onLogout: () => void;
};
export function ProfilePage({ onLogout }: ProfilePageProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account settings</p>
      </header>

      {/* User Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-2xl font-semibold">
          JD
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">John Doe</h2>
          <p className="text-gray-500">@johndoe</p>
          <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E6FAF2] text-[#0C6478]">
            Pro Member
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">General Settings</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <User size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Display Name
                  </p>
                  <p className="text-xs text-gray-500">John Doe</p>
                </div>
              </div>
              <button className="text-sm text-[#0C6478] font-medium hover:text-[#213A58]">
                Edit
              </button>
            </div>
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <Bell size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Notifications
                  </p>
                  <p className="text-xs text-gray-500">
                    Daily reminders enabled
                  </p>
                </div>
              </div>
              <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out bg-[#0C6478] rounded-full cursor-pointer">
                <span className="absolute left-0 inline-block w-6 h-6 bg-white border-2 border-[#0C6478] rounded-full transform translate-x-4"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-medium text-gray-900">Security</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <Shield size={20} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">
                    Last changed 3 months ago
                  </p>
                </div>
              </div>
              <button className="text-sm text-[#0C6478] font-medium hover:text-[#213A58]">
                Update
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full p-4 bg-white border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors flex items-center justify-center shadow-sm">

          <LogOut size={20} className="mr-2" />
          Sign Out
        </button>
      </div>
    </div>);

}