import React from 'react';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, User, Mail } from 'lucide-react';

export const AuthTest: React.FC = () => {
  const { isAuthenticated, user, session } = useAuthStore();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAuthenticated ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          Authentication Status
        </CardTitle>
        <CardDescription>
          Current authentication state and user information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Status:</span>
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>
        
        {user && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">User ID: {user.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Email: {user.email}</span>
            </div>
          </div>
        )}
        
        {session && (
          <div className="text-xs text-muted-foreground">
            <p>Session expires: {new Date(session.expires_at! * 1000).toLocaleString()}</p>
          </div>
        )}
        
        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            Please sign in to access TNM AI features
          </p>
        )}
      </CardContent>
    </Card>
  );
};