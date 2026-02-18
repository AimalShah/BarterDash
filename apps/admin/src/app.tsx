import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedShell } from '@/components/auth/protected-shell';
import { supabase } from '@/lib/supabase';
import { LoginPage } from '@/pages/login-page';
import { ApplicationsPage } from '@/pages/applications-page';
import { ActivityPage } from '@/pages/activity-page';
import { ActivityFeedPage } from '@/pages/activity-feed-page';
import { AnalyticsPage } from '@/pages/analytics-page';
import { DisputesPage } from '@/pages/disputes-page';
import { OverviewPage } from '@/pages/overview-page';
import { RefundsPage } from '@/pages/refunds-page';
import { ReportsPage } from '@/pages/reports-page';
import { SystemHealthPage } from '@/pages/system-health-page';
import { UsersPage } from '@/pages/users-page';
import { useAuthStore } from '@/store/auth-store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AuthBootstrap() {
  const setSession = useAuthStore((state) => state.setSession);
  const markBooting = useAuthStore((state) => state.markBooting);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      markBooting();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(session);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [markBooting, setSession]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap />
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedShell />}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/disputes" element={<DisputesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/refunds" element={<RefundsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/activity-feed" element={<ActivityFeedPage />} />
            <Route path="/system-health" element={<SystemHealthPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
