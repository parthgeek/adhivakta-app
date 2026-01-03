import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <X color="#333" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Info color="#007AFF" size={24} />
            <Text style={styles.sectionTitle}>About This Modal</Text>
          </View>
          <Text style={styles.description}>
            This is a modal screen that can be used to display additional information, 
            settings, or any content that should appear on top of your current view.
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <CheckCircle color="#34C759" size={20} />
            <Text style={styles.featureText}>Clean design</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle color="#34C759" size={20} />
            <Text style={styles.featureText}>Smooth animations</Text>
          </View>
          <View style={styles.featureItem}>
            <CheckCircle color="#34C759" size={20} />
            <Text style={styles.featureText}>Easy to close</Text>
          </View>
        </View>

        <View style={styles.note}>
          <AlertTriangle color="#FF9500" size={20} />
          <Text style={styles.noteText}>
            You can dismiss this modal by tapping the X button or swiping down.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>Got It</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  features: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF3CD',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});