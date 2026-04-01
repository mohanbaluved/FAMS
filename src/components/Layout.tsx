import * as React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  CreditCard, 
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const Layout = () => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Payments', path: '/payments', icon: CreditCard },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ name: 'Employees', path: '/employees', icon: Users });
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary">FAMS</h1>
            <p className="text-xs text-muted-foreground mt-1">Agency Management</p>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${location.pathname === item.path 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center p-2 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{profile?.name?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{profile?.name || user?.email}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{profile?.role || 'User'}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <button 
            className="lg:hidden p-2 text-gray-600"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-semibold text-gray-800">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;
