import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types';
import { COLORS } from '../config';

// Navigators
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ExplorePropertyDetailsScreen from '../screens/ExplorePropertyDetailsScreen';
import PropertyDetailsScreen from '../screens/PropertyDetailsScreen';
import CreatePropertyScreen from '../screens/CreatePropertyScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';
import ChatScreen from '../screens/ChatScreen';
import MapViewScreen from '../screens/MapViewScreen';
import SearchScreen from '../screens/SearchScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: 'rgba(139, 69, 19, 0.92)',
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 20,
          },
          headerShadowVisible: true,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Explore"
              component={ExploreScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ExplorePropertyDetails"
              component={ExplorePropertyDetailsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Auth"
              component={AuthNavigator}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PropertyDetails"
              component={PropertyDetailsScreen}
              options={{ title: 'Property Details' }}
            />
            <Stack.Screen
              name="CreateProperty"
              component={CreatePropertyScreen}
              options={{ title: 'Create Listing' }}
            />
            <Stack.Screen
              name="EditProperty"
              component={EditPropertyScreen}
              options={{ title: 'Edit Listing' }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({
                title: route.params?.userName || 'Chat',
              })}
            />
            <Stack.Screen
              name="MapView"
              component={MapViewScreen}
              options={{ title: 'Map View' }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: 'Search Properties' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
