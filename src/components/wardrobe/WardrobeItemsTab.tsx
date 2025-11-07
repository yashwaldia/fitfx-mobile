import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GlassmorphicCard from '../GlassmorphicCard';
import NeuButton from '../NeuButton';
import { THEME, NEUMORPHIC } from '../../config';
import type { Garment, WardrobeStatus } from '../../types';

interface WardrobeItemsTabProps {
  wardrobe: Garment[];
  status: WardrobeStatus | null;
  showOptionsMenu: number | null;
  setShowOptionsMenu: (index: number | null) => void;
  onEdit: (item: Garment, index: number) => void;
  onDelete: (index: number) => void;
  onAddItem: () => void;
  onNavigate: (screen: string) => void;
}

const WardrobeItemsTab: React.FC<WardrobeItemsTabProps> = ({
  wardrobe,
  status,
  showOptionsMenu,
  setShowOptionsMenu,
  onEdit,
  onDelete,
  onAddItem,
  onNavigate,
}) => {
  if (wardrobe.length === 0) {
    return (
      <>
        <GlassmorphicCard style={styles.emptyCard} intensity="medium">
          <Ionicons name="shirt-outline" size={64} color={NEUMORPHIC.textSecondary} />
          <Text style={styles.emptyTitle}>No Items Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start building your digital wardrobe by adding your first item
          </Text>
          <NeuButton
            title="Add Your First Item"
            onPress={onAddItem}
            size="medium"
            style={styles.firstItemButton}
          />
        </GlassmorphicCard>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {/* Upgrade Warning (if needed) */}
      {status && status.hiddenCount > 0 && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={18} color="#FFA500" />
          <Text style={styles.warningText}>
            {status.hiddenCount} items hidden. Upgrade for full access!
          </Text>
          <TouchableOpacity onPress={() => onNavigate('upgrade')}>
            <Text style={styles.upgradeLink}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Items Grid */}
      <View style={styles.grid}>
        {wardrobe.slice(0, status?.accessible).map((item, index) => (
          <GlassmorphicCard
            key={item.id || index}
            style={styles.itemCard}
            intensity="medium"
          >
            {/* Three Dots Menu */}
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => setShowOptionsMenu(showOptionsMenu === index ? null : index)}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Options Menu Dropdown */}
            {showOptionsMenu === index && (
              <View style={styles.optionsMenu}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => onEdit(item, index)}
                >
                  <Ionicons name="create-outline" size={18} color="#00CED1" />
                  <Text style={styles.optionText}>Edit</Text>
                </TouchableOpacity>
                <View style={styles.optionDivider} />
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => onDelete(index)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                  <Text style={styles.optionText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Item Image - Portrait Style */}
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.itemImagePortrait}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.itemImagePlaceholder}>
                <Ionicons name="shirt-outline" size={50} color={NEUMORPHIC.textSecondary} />
              </View>
            )}

            {/* Item Info Overlay */}
            <View style={styles.itemInfoOverlay}>
              <Text style={styles.itemMaterial} numberOfLines={1}>
                {item.material || 'Unknown'}
              </Text>
              <Text style={styles.itemColor} numberOfLines={1}>
                {item.color || 'Color'}
              </Text>
            </View>
          </GlassmorphicCard>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 400,
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: THEME.spacing.sm,
    borderRadius: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  warningText: {
    color: '#FFA500',
    fontSize: 13,
    marginLeft: THEME.spacing.sm,
    flex: 1,
  },
  upgradeLink: {
    color: '#00CED1',
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyCard: {
    padding: THEME.spacing.xxl,
    alignItems: 'center',
    marginTop: THEME.spacing.xl,
  },
  emptyTitle: {
    fontSize: THEME.typography.heading3.fontSize,
    fontWeight: THEME.typography.heading3.fontWeight,
    color: NEUMORPHIC.textPrimary,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
  },
  emptySubtitle: {
    fontSize: THEME.typography.body.fontSize,
    color: NEUMORPHIC.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.lg,
  },
  firstItemButton: {
    marginTop: THEME.spacing.md,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 80,
  },

  // Item Card - Portrait Style
  itemCard: {
    width: '48%',
    marginBottom: THEME.spacing.md,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImagePortrait: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  itemImagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  itemInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(10px)',
    padding: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  itemMaterial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  itemColor: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Options Button & Menu
  optionsButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  optionsMenu: {
    position: 'absolute',
    top: 45,
    right: 8,
    backgroundColor: 'rgba(20, 22, 25, 0.98)',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
    minWidth: 120,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  optionDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
});

export default WardrobeItemsTab;
