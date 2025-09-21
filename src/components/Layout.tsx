import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Car, LogOut, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  const isAdmin = profile?.role === 'admin';
  const isEmployee = profile?.role === 'employee';

  const adminNavItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/employees', label: 'Employees' },
    { to: '/admin/customers', label: 'Customers' },
    { to: '/admin/jobs', label: 'Jobs' },
    { to: '/admin/edit-requests', label: 'Edit Requests' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="bg-primary p-2 rounded-lg">
                  <Car className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Lumak Motors</h1>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">{profile?.username}</span>
                <span className="text-muted-foreground">({profile?.role})</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          {isAdmin && (
            <nav className="mt-4 flex space-x-1">
              {adminNavItems.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={location.pathname === item.to ? "default" : "ghost"}
                    size="sm"
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}