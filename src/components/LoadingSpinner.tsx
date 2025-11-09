import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AURORA_GRADIENT, NEUMORPHIC } from '../config'; // ✅ Removed THEME import

const LoadingSpinner: React.FC = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={AURORA_GRADIENT.cyan}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // ✅ FIXED: Used 'bgDarker' which exists in your colors.ts
    backgroundColor: NEUMORPHIC.bgDarker,
  },
});

export default LoadingSpinner;