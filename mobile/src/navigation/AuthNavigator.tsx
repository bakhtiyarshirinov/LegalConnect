import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterClientScreen } from '../screens/auth/RegisterClientScreen';
import { RegisterLawyerScreen } from '../screens/auth/RegisterLawyerScreen';
import { VerifyOtpScreen } from '../screens/auth/VerifyOtpScreen';

const Stack = createStackNavigator();

export const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="RegisterClient" component={RegisterClientScreen} />
    <Stack.Screen name="RegisterLawyer" component={RegisterLawyerScreen} />
    <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
  </Stack.Navigator>
);
