import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { cn } from '@/lib/cn';

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const profile = useAuthStore((state) => state.profile);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-page-pattern">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[18rem_1fr]">
        <div className="hidden lg:block">
          <SidebarNav />
        </div>

        <div className="relative">
          <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
            <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Operations
                </p>
                <p className="font-display text-lg text-foreground">Admin Dashboard</p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="neutral">{profile?.username || 'admin'}</Badge>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-7xl gap-2 overflow-auto px-4 pb-3 sm:px-6 lg:hidden">
              {[
                { to: '/', label: 'Overview' },
                { to: '/analytics', label: 'Analytics' },
                { to: '/applications', label: 'Applications' },
                { to: '/disputes', label: 'Disputes' },
                { to: '/reports', label: 'Reports' },
                { to: '/refunds', label: 'Refunds' },
                { to: '/users', label: 'Users' },
                { to: '/activity', label: 'Activity' },
              ].map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-foreground/80',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
