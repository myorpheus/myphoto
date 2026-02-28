import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeSupabaseService } from '@/services/supabase-complete';
import { Loader2 } from 'lucide-react';

interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute = ({ children }: AuthRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await completeSupabaseService.getCurrentUser();
    setIsAuthenticated(!!user);
    if (!user) navigate('/login');
    setIsLoading(false);
  };

  if (isLoading) return <Loader2 className="animate-spin" />;
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthRoute;
