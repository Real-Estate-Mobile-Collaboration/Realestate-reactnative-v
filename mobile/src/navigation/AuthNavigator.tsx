import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AuthStackParamList, RootStackParamList } from '../types';
import { COLORS } from '../config';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

type AuthScreenRouteProp = RouteProp<RootStackParamList, 'Auth'>;

const AuthNavigator: React.FC = () => {
  const route = useRoute<AuthScreenRouteProp>();
  const initialScreen = route.params?.screen === 'Register' ? 'Register' : 'Login';

  return (
    <Stack.Navigator
      initialRouteName={initialScreen}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
