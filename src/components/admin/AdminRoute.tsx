import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSupabaseService } from '@/services/supabase-complete';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      console.log('🔒 AdminRoute: Checking admin access...');
      
      // Check if user is authenticated
      const user = await completeSupabaseService.getCurrentUser();
      
      if (!user) {
        console.log('❌ AdminRoute: User not authenticated, redirecting to login');
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access admin features.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      console.log('✅ AdminRoute: User authenticated:', user.email);

      // Check user roles
      const userRoles = await completeSupabaseService.getUserRoles(user.id);
      console.log('🏷️ AdminRoute: User roles:', userRoles);

      const isAdmin = userRoles.includes('admin') || userRoles.includes('super_admin');
      
      if (!isAdmin) {
        console.log('❌ AdminRoute: User does not have admin privileges, redirecting to overview');
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access admin features.',
          variant: 'destructive',
        });
        navigate('/overview');
        return;
      }

      console.log('✅ AdminRoute: Admin access granted');
      setIsAuthorized(true);
    } catch (error) {
      console.error('❌ AdminRoute: Error checking admin access:', error);
      toast({
        title: 'Access Check Failed',
        description: 'Unable to verify admin permissions. Please try again.',
        variant: 'destructive',
      });
      navigate('/overview');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking permissions
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Only render children if user is authorized admin
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Return null if not authorized (user will be redirected)
  return null;
};

export default AdminRoute;