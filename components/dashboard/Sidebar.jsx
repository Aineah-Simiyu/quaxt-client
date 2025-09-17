'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  FileText,
  Home,
  Settings,
  Users,
  X,
  LogOut,
  BarChart,
  School,
  UserCheck,
  GraduationCap,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROLES, isInstructorOrAdmin, isAdmin, isSchoolAdmin, getRoleDisplayName } from '@/lib/constants';

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Get role display info
  const getRoleInfo = () => {
    switch (user?.role) {
      case ROLES.ADMIN:
        return { label: 'System Administrator', icon: User };
      case ROLES.SCHOOL_ADMIN:
        return { label: 'School Administrator', icon: User };
      case ROLES.TRAINER:
        return { label: 'Trainer', icon: UserCheck };
      case ROLES.STUDENT:
        return { label: 'Student', icon: GraduationCap };
      default:
        return { label: 'User', icon: User };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo.icon;

  // Define navigation items based on user role
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'Assignments',
      href: '/assignments',
      icon: FileText,
    },
  ];

  // Add school admin specific items
  if (isSchoolAdmin(user)) {
    navItems.push(
      {
        name: 'Trainers',
        href: '/trainers',
        icon: UserCheck,
      },
      {
        name: 'Cohorts',
        href: '/cohorts',
        icon: Users,
      },
      {
        name: 'Students',
        href: '/students',
        icon: GraduationCap,
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart,
      }
    );
  }
  // Add instructor/admin specific items (but not school admin to avoid duplication)
  else if (isInstructorOrAdmin(user)) {
    navItems.push(
      {
        name: 'Students',
        href: '/students',
        icon: Users,
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart,
      }
    );
  }
  
  // Add admin-only items
  if (isAdmin(user)) {
    navItems.push(
      {
        name: 'School Management',
        href: '/school-management',
        icon: School,
      }
    );
  }

  // Add common items at the end
  navItems.push(
    {
      name: 'Resources',
      href: '/resources',
      icon: BookOpen,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    }
  );

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <RoleIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-slate-900">Quaxt</span>
              <p className="text-sm text-slate-600 font-medium">
                {roleInfo.label}
              </p>
            </div>
          </Link>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
                  isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`mr-3 h-4 w-4 flex-shrink-0 ${
                  isActive ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'
                }`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg py-2 px-3 transition-colors duration-150"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <span className="font-medium">Sign out</span>
        </Button>
      </div>
    </div>
  );
}