'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();
  const [open, setOpen] = useState(false);

  // Handle opening the dropdown
  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    // Mark all as read when dropdown is opened
    if (isOpen && unreadCount > 0) {
      markAllAsRead();
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <div className="h-2 w-2 rounded-full bg-green-500" />;
      case 'error':
        return <div className="h-2 w-2 rounded-full bg-red-500" />;
      case 'warning':
        return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
      case 'info':
      default:
        return <div className="h-2 w-2 rounded-full bg-blue-500" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span className="font-semibold text-slate-900">Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-medium text-slate-600 hover:text-slate-900"
              onClick={clearNotifications}
            >
              Clear all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex cursor-default flex-col items-start p-4 hover:bg-slate-50 focus:bg-slate-50"
                onSelect={() => markAsRead(notification.id)}
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {getNotificationIcon(notification.type)}
                    <span className="font-medium text-slate-900">{notification.title}</span>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {notification.message}
                </p>
                {!notification.read && (
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    New
                  </div>
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-medium">No notifications</p>
              <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}