import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminShell } from '@/components/layout/admin-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import { isAdminProfile, useAuthStore } from '@/store/auth-store';
import { useAdminProfileQuery } from '@/hooks/use-admin-profile';

function AuthLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page-pattern p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Checking admin access</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full animate-pulse rounded-full bg-secondary" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ProtectedShell() {
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setProfile = useAuthStore((state) => state.setProfile);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const profileQuery = useAdminProfileQuery();

  const handleForcedSignOut = async () => {
    await supabase.auth.signOut();
    clearAuth();
  };

  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data, setProfile]);

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profileQuery.isLoading) {
    return <AuthLoadingState />;
  }

  if (profileQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-pattern p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Session check failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {getApiErrorMessage(profileQuery.error)}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => profileQuery.refetch()}>Retry</Button>
              <Button variant="outline" onClick={handleForcedSignOut}>
                Return to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdminProfile(profileQuery.data ?? null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-pattern p-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge variant="danger">Admin role required</Badge>
            <p className="text-sm text-muted-foreground">
              Your account is authenticated but not authorized for the admin console.
            </p>
            <Button variant="outline" onClick={handleForcedSignOut}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
