import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * Custom hook to get color scheme (light/dark)
 * Wraps React Native's useColorScheme hook
 */
export function useColorScheme() {
  return useRNColorScheme();
}
