import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { THEME, NEUMORPHIC } from '../config';

export interface IconGridItem {
  id: string;
  icon: string;
  label: string;
  onPress: () => void;
}

interface IconGridProps {
  items: IconGridItem[];
  columns?: number;
  style?: ViewStyle;
}

const IconGrid: React.FC<IconGridProps> = ({
  items,
  columns = 3,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.gridItem,
            {
              width: `${100 / columns}%`,
            },
          ]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.iconCard}>
            <MaterialCommunityIcons
              name={item.icon as any}
              size={32}
              color="#00D9FF"
            />
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingVertical: THEME.spacing.lg,
  },
  gridItem: {
    alignItems: 'center',
    marginVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
  },
  iconCard: {
    width: 70,
    height: 70,
    borderRadius: THEME.radius.large,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  label: {
    color: NEUMORPHIC.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default IconGrid;
