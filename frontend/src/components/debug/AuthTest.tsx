import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const AuthTest: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async   () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthStatus('No token found in localStorage');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuthStatus(`Authenticated as: ${data.user?.name || 'Unknown'} (ID: ${data.user?.id})`);
      } else {
        const errorData = await response.json();
        setAuthStatus(`Token invalid: ${errorData.message}`);
      }
    } catch (error) {
      setAuthStatus(`Auth check failed: ${error}`);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{authStatus}</p>
        <Button onClick={checkAuth}>Recheck Auth</Button>
      </CardContent>
    </Card>
  );
};
