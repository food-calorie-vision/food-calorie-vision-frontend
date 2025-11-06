'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MobileNav = () => {
  const pathname = usePathname();

  const navItems = [
    { 
      name: '홈', 
      href: '/dashboard', 
      icon: '🏠',
      activeIcon: '🏠'
    },
    { 
      name: '식사일기', 
      href: '/meal-diary/analysis', 
      icon: '📸',
      activeIcon: '📸'
    },
    { 
      name: '추천', 
      href: '/recommend', 
      icon: '🍽️',
      activeIcon: '🍽️'
    },
    { 
      name: '문의', 
      href: '/contact', 
      icon: '💬',
      activeIcon: '💬'
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-green-600'
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <span className="text-2xl mb-1">{isActive ? item.activeIcon : item.icon}</span>
              <span className={`text-xs font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;

