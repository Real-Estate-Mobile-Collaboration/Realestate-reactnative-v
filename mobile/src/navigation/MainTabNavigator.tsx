import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Platform, Animated } from 'react-native';
import { MainTabParamList } from '../types';
import { Icon } from '../components';
import { COLORS } from '../config';
import { useTabBar } from '../context';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreatePropertyScreen from '../screens/CreatePropertyScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const AnimatedTabBar = ({ state, descriptors, navigation }: any) => {
  const { tabBarTranslateY } = useTabBar();

  return (
    <Animated.View
      style={[
        styles.tabBarContainer,
        {
          transform: [{ translateY: tabBarTranslateY }],
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;

        let iconName: string;
        switch (route.name) {
          case 'Home':
            iconName = isFocused ? 'home' : 'home-outline';
            break;
          case 'Search':
            iconName = isFocused ? 'search' : 'search-outline';
            break;
          case 'AddProperty':
            iconName = isFocused ? 'add-circle' : 'add-circle-outline';
            break;
          case 'Messages':
            iconName = isFocused ? 'chatbubbles' : 'chatbubbles-outline';
            break;
          case 'Profile':
            iconName = isFocused ? 'person' : 'person-outline';
            break;
          default:
            iconName = 'ellipse';
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Animated.View
            key={route.key}
            style={styles.tabItem}
          >
            <Animated.View
              style={[
                styles.tabButton,
                isFocused && styles.tabButtonActive,
              ]}
            >
              <View
                style={{ alignItems: 'center' }}
                onTouchEnd={onPress}
              >
                <Icon
                  name={iconName}
                  size={isFocused ? 26 : 22}
                  color={isFocused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)'}
                />
                <Animated.Text
                  style={[
                    styles.tabLabel,
                    isFocused && styles.tabLabelActive,
                  ]}
                >
                  {label}
                </Animated.Text>
              </View>
            </Animated.View>
          </Animated.View>
        );
      })}
    </Animated.View>
  );
};

const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerTitle: 'Real Estate',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          headerTitle: 'Search Properties',
        }}
      />
      <Tab.Screen
        name="AddProperty"
        component={CreatePropertyScreen}
        options={{
          title: 'Post',
          headerTitle: 'Create Listing',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: 'Message',
          headerTitle: 'Messages',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(80, 40, 10, 0.80)',
    borderRadius: 28,
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default MainTabNavigator;
