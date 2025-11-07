import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'dark';
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  style,
  intensity = 'medium',
}) => {
  const intensityStyles = {
    light: styles.glassLight,
    medium: styles.glassMedium,
    dark: styles.glassDark,
  };

  return (
    <View style={[styles.glass, intensityStyles[intensity], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glass: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassLight: {
    backgroundColor: 'rgba(26, 31, 58, 0.25)',
  },
  glassMedium: {
    backgroundColor: 'rgba(26, 31, 58, 0.4)',
  },
  glassDark: {
    backgroundColor: 'rgba(26, 31, 58, 0.5)',
  },
});

export default GlassmorphicCard;
