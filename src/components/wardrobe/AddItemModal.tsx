import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';

import { THEME, NEUMORPHIC } from '../../config';

interface AddItemModalProps {
  visible: boolean;
  image: string | null;
  material: string;
  color: string;
  uploading: boolean;
  onMaterialChange: (text: string) => void;
  onColorChange: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  image,
  material,
  color,
  uploading,
  onMaterialChange,
  onColorChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Wardrobe Item</Text>

          {image && (
            <Image source={{ uri: image }} style={styles.previewImage} />
          )}

          <TextInput
            style={styles.input}
            placeholder="Material (e.g., Cotton T-Shirt)"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={material}
            onChangeText={onMaterialChange}
            editable={!uploading}
          />

          <TextInput
            style={styles.input}
            placeholder="Color (e.g., Blue)"
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={color}
            onChangeText={onColorChange}
            editable={!uploading}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onCancel}
              disabled={uploading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={onConfirm}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Add Item</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: NEUMORPHIC.bgDarker,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'cover',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#00CED1',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AddItemModal;
