'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Menu, User, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Header({ onMenuClick }) {
  const { user, loading, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
  };
  
  // While auth is initializing, show a loading placeholder
  if (loading) {
    return (
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center">
              <Button
                  variant="ghost"
                  size="icon"
                  className="mr-3 md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  onClick={onMenuClick}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-slate-900 md:hidden">
                Quaxt
              </h1>
            </div>
            {/* Skeleton avatar while loading */}
            <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </header>
    );
  }
  
  return (
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center">
            <Button
                variant="ghost"
                size="icon"
                className="mr-3 md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-slate-900 md:hidden">
              Quaxt
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                            src={user.avatar}
                            alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                        />
                        <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-medium">
                          {getInitials(user.name || `${user.firstName} ${user.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name || `${user.firstName} ${user.lastName}`.trim() || 'User'}
                        </p>
                        <p className="text-xs leading-none text-slate-600">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                // Optional: if somehow user is null but not loading (e.g., race condition)
                <div className="h-8 w-8 rounded-full bg-slate-200" />
            )}
          </div>
        </div>
      </header>
  );
}