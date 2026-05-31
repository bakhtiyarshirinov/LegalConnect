import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { ClientNavigator } from './ClientNavigator';
import { LawyerNavigator } from './LawyerNavigator';
import { AdminNavigator } from './AdminNavigator';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const AppNavigator = () => {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen />;
  }

  const getNavigator = () => {
    if (!user) return <AuthNavigator />;
    if (user.role === 'Lawyer') return <LawyerNavigator />;
    if (user.role === 'Admin') return <AdminNavigator />;
    return <ClientNavigator />;
  };

  return (
    <NavigationContainer>
      {getNavigator()}
    </NavigationContainer>
  );
};
