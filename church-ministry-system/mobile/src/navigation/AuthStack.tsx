import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ContextSwitcherScreen from '../screens/auth/ContextSwitcherScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack({ initialRoute = 'Login' }: { initialRoute?: string }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ContextSwitcher" component={ContextSwitcherScreen} />
    </Stack.Navigator>
  );
}
