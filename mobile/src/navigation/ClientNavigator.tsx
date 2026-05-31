import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/client/HomeScreen';
import { LawyersScreen } from '../screens/client/LawyersScreen';
import { LawyerProfileScreen } from '../screens/client/LawyerProfileScreen';
import { AppointmentsScreen } from '../screens/client/AppointmentsScreen';
import { ChatScreen } from '../screens/client/ChatScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { ConversationScreen } from '../screens/shared/ConversationScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LawyersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LawyersList" component={LawyersScreen} />
    <Stack.Screen name="LawyerProfile" component={LawyerProfileScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="LawyerProfile" component={LawyerProfileScreen} />
  </Stack.Navigator>
);

const ChatStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatList" component={ChatScreen} />
    <Stack.Screen name="Conversation" component={ConversationScreen} />
  </Stack.Navigator>
);

export const ClientNavigator = () => (
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
      name="Home"
      component={HomeStack}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Lawyers"
      component={LawyersStack}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} /> }}
    />
    <Tab.Screen
      name="Appointments"
      component={AppointmentsScreen}
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }}
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
