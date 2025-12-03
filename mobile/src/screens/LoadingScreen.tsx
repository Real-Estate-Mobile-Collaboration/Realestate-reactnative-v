import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LoadingSpinner } from '../components';
import { COLORS } from '../config';

const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <LoadingSpinner size="large" text="Loading..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingScreen;
