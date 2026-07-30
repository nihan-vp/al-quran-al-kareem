/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Home, BrainCircuit, Target, Bookmark, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const pathname = location.pathname;

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: Home,
      exact: true,
    },
    {
      label: 'Memorize',
      path: '/memorize',
      icon: BrainCircuit,
      exact: false,
    },
    {
      label: 'Plans',
      path: '/plans',
      icon: Target,
      exact: false,
    },
    {
      label: 'Bookmarks',
      path: '/bookmarks',
      icon: Bookmark,
      exact: false,
    },
    {
      label: user ? 'Profile' : 'Login',
      path: user ? '/profile' : '/login',
      icon: User,
      exact: false,
      isAuth: true,
    },
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation" 
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.path
            : pathname.startsWith(item.path) || (item.isAuth && (pathname === '/login' || pathname === '/signup' || pathname === '/profile'));
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.path}
              className="relative flex flex-1 flex-col items-center justify-center py-1.5 transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-x-1 inset-y-1 rounded-xl bg-brand-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`relative z-10 flex flex-col items-center gap-0.5 ${
                  isActive ? 'text-brand-primary font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110 text-brand-primary' : ''}`} />
                <span className="text-[10px] leading-tight tracking-tight">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
