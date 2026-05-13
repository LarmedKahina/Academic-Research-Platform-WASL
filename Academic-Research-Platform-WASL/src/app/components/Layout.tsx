import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, User, ChevronDown, Bell, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationsService';
import { getErrorMessage } from '../../services/errors';

type NotificationItem = {
  id: string;
  content: string;
  link?: string;
  read?: boolean;
  created_at?: string;
};

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const loadNotifications = async () => {
      try {
        const response = await getNotifications();
        setNotifications(response.data.notifications ?? response.data ?? []);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    try {
      if (!notification.read) {
        const response = await markNotificationRead(notification.id);
        setNotifications((current) => current.map((item) => item.id === notification.id ? response.data : item));
      }
      if (notification.link) navigate(notification.link);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
      toast.success('Notifications marked as read');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[#1e293b] text-white sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-lg flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            </div>
            <span className="text-xl tracking-tight" style={{ fontWeight: 700 }}>
              Wasl<span className="text-[#f97316]">DZ</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/"
              className={`transition-colors hover:text-[#f97316] ${isActive('/') ? 'text-[#f97316]' : ''}`}
              style={{ fontWeight: 500 }}
            >
              Home
            </Link>
            <Link
              to="/browse"
              className={`transition-colors hover:text-[#f97316] ${isActive('/browse') ? 'text-[#f97316]' : ''}`}
              style={{ fontWeight: 500 }}
            >
              Browse
            </Link>
            <Link
              to="/community"
              className={`transition-colors hover:text-[#f97316] ${isActive('/community') ? 'text-[#f97316]' : ''}`}
              style={{ fontWeight: 500 }}
            >
              Community
            </Link>
            <Link
              to="/topics"
              className={`transition-colors hover:text-[#f97316] ${isActive('/topics') ? 'text-[#f97316]' : ''}`}
              style={{ fontWeight: 500 }}
            >
              Topics
            </Link>
            <Link
              to="/about"
              className={`transition-colors hover:text-[#f97316] ${isActive('/about') ? 'text-[#f97316]' : ''}`}
              style={{ fontWeight: 500 }}
            >
              About
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative text-white hover:text-[#f97316] hover:bg-white/5">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#f97316] px-1 text-xs text-white">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white w-80">
                    <DropdownMenuItem onClick={handleMarkAllRead}>
                      Mark all as read
                    </DropdownMenuItem>
                    {notifications.length === 0 && (
                      <DropdownMenuItem>No notifications</DropdownMenuItem>
                    )}
                    {notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="items-start gap-2">
                        <button
                          className={`flex-1 text-left text-sm ${notification.read ? 'text-gray-600' : 'font-medium text-gray-900'}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          {notification.content}
                        </button>
                        <button onClick={() => handleDeleteNotification(notification.id)} aria-label="Delete notification">
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 text-white hover:text-[#f97316] hover:bg-white/5">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-full flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span>{user.name}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white">
                    <DropdownMenuItem onClick={() => {
                      if (user.role === 'student') navigate(`/profile/${user.id}`);
                      else if (user.role === 'professor') navigate(`/professor/${user.id}`);
                      else if (user.role === 'company') navigate(`/company/${user.id}`);
                    }}>
                      <User className="w-4 h-4 mr-2" />
                      My Profile & Dashboard
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <User className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-white hover:text-[#f97316] hover:bg-white/5"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/signup')}
                  className="bg-[#f97316] hover:bg-[#ea580c] text-white border-0"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-[#1e293b] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-[#f97316] to-[#fb923c] rounded-lg flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                </div>
                <span className="text-xl tracking-tight" style={{ fontWeight: 700 }}>
                  Wasl<span className="text-[#f97316]">DZ</span>
                </span>
              </div>
              <p className="text-white/70 leading-relaxed mb-6">
                Connecting Algerian students, professors, and companies to share innovative projects and build the future.
              </p>
              <div className="text-sm text-white/50">
                Ministry of Higher Education and Scientific Research - Algeria
              </div>
            </div>

            <div>
              <h4 className="mb-4" style={{ fontWeight: 600 }}>Platform</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><Link to="/browse" className="hover:text-[#f97316] transition-colors">Browse Content</Link></li>
                <li><Link to="/community" className="hover:text-[#f97316] transition-colors">Community</Link></li>
                <li><Link to="/topics" className="hover:text-[#f97316] transition-colors">Project Topics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4" style={{ fontWeight: 600 }}>Resources</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><Link to="/about" className="hover:text-[#f97316] transition-colors">About Us</Link></li>
                <li><Link to="/submit" className="hover:text-[#f97316] transition-colors">Submit Project</Link></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Guidelines</a></li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4" style={{ fontWeight: 600 }}>Support</h4>
              <ul className="space-y-3 text-sm text-white/70">
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-[#f97316] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center text-sm text-white/50">
            © 2026 WaslDZ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
