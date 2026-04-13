'use client';

import { useRouter, usePathname } from 'next/navigation';
import { UserRound, LayoutDashboard, Calendar, Car } from 'lucide-react';

export default function UsersSidebar({ onSignOut }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: UserRound, active: pathname === '/admin/users' },
    { href: '#', label: 'Partners', icon: UserRound },
    { href: '#', label: 'Cars', icon: Car },
    { href: '#', label: 'Bookings', icon: Calendar },
  ];

  return (
    <div className="w-64 bg-gray-800 min-h-screen">
      <div className="p-4">
        <h2 className="text-white text-lg font-semibold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || item.active;
            
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-none transition-colors ${
                  isActive
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={onSignOut}
            className="w-full flex items-center space-x-3 text-gray-300 hover:text-white px-3 py-2 rounded-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

