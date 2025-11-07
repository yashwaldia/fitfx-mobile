import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { NEUMORPHIC, AURORA_GRADIENT } from '@/src/config';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is a modal</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: NEUMORPHIC.bg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: AURORA_GRADIENT.cyan,
    marginBottom: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: AURORA_GRADIENT.pink,
    textDecorationLine: 'underline',
  },
});
