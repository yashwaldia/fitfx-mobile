import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AURORA_GRADIENT, NEUMORPHIC, THEME } from '../config';

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
    backgroundColor: NEUMORPHIC.darkBase,
  },
});

export default LoadingSpinner;
