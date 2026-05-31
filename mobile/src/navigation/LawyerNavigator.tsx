import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LawyerDashboardScreen } from '../screens/lawyer/LawyerDashboardScreen';
import { LawyerAppointmentsScreen } from '../screens/lawyer/LawyerAppointmentsScreen';
import { LawyerScheduleScreen } from '../screens/lawyer/LawyerScheduleScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { ConversationScreen } from '../screens/shared/ConversationScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatList" component={ChatScreen} />
    <Stack.Screen name="Conversation" component={ConversationScreen} />
  </Stack.Navigator>
);

export const LawyerNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E8E8E8',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
      },
      tabBarActiveTintColor: '#0A0A0A',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={LawyerDashboardScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Appointments"
      component={LawyerAppointmentsScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Schedule"
      component={LawyerScheduleScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatStack}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
    />
  </Tab.Navigator>
);
