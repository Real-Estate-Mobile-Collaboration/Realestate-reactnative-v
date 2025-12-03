import React, { createContext, useContext, useState, useRef } from 'react';
import { Animated } from 'react-native';

interface TabBarContextType {
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  tabBarTranslateY: Animated.Value;
  handleScroll: (event: any) => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabBarVisible, setTabBarVisible] = useState(true);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollThreshold = 10;

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    // Only trigger if scroll amount exceeds threshold
    if (Math.abs(diff) < scrollThreshold) return;

    if (currentScrollY <= 0) {
      // At top, always show
      showTabBar();
    } else if (diff > 0 && tabBarVisible) {
      // Scrolling down, hide
      hideTabBar();
    } else if (diff < 0 && !tabBarVisible) {
      // Scrolling up, show
      showTabBar();
    }

    lastScrollY.current = currentScrollY;
  };

  const hideTabBar = () => {
    setTabBarVisible(false);
    Animated.spring(tabBarTranslateY, {
      toValue: 120,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  const showTabBar = () => {
    setTabBarVisible(true);
    Animated.spring(tabBarTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  };

  return (
    <TabBarContext.Provider value={{ tabBarVisible, setTabBarVisible, tabBarTranslateY, handleScroll }}>
      {children}
    </TabBarContext.Provider>
  );
};

export const useTabBar = () => {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
};
