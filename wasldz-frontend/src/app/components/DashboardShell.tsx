import { ReactNode, useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Menu, X, Bell, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import type { ApiEnvelope } from '../types/api';
import { cn } from './ui/utils';

interface NavItem {
  href: string;
  label: string;
}

interface NotificationRow {
  id: string;
  content: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export function DashboardShell({
  children,
  navItems,
}: {
  children: ReactNode;
  navItems: NavItem[];
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await api.get<ApiEnvelope<NotificationRow[]>>('/api/notifications');
      if (res.data.success && res.data.data) setNotifications(res.data.data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      await loadNotifications();
    } catch {
      /* ignore */
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Sign in to access your dashboard.
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed z-50 inset-y-0 left-0 w-64 bg-[#1e3a8a] text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-[#f97316]">
            {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
            <AvatarFallback className="bg-[#f97316] text-white">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <Badge className="mt-1 bg-[#016257] hover:bg-[#016257] capitalize">{user.role || ''}</Badge>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <span className="text-[#1e3a8a] font-semibold">WaslDZ</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-2 relative">
                  <Bell className="h-4 w-4" />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#f97316] text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-80 overflow-auto">
                <div className="px-2 py-1.5 text-xs text-muted-foreground flex justify-between items-center">
                  <span>Notifications</span>
                  <button type="button" className="text-[#016257] hover:underline" onClick={markAllRead}>
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 && (
                  <div className="px-3 py-4 text-sm text-muted-foreground">No notifications</div>
                )}
                {notifications.slice(0, 15).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className="flex flex-col items-start gap-1 cursor-pointer"
                    onClick={async () => {
                      try {
                        await api.put(`/api/notifications/${n.id}/read`);
                        if (n.link) navigate(n.link);
                        await loadNotifications();
                      } catch {
                        /* */
                      }
                    }}
                  >
                    <span className={cn('text-sm', !n.read && 'font-medium')}>{n.content}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
