import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure we only access the store after React is fully ready
    const timer = setTimeout(() => {
      try {
        const { initialize } = useAuthStore.getState();
        initialize();
        setIsReady(true);
      } catch (error) {
        console.error('Auth store initialization failed:', error);
        setIsReady(true); // Still render children even if auth fails
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Don't render children until auth store is ready
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};