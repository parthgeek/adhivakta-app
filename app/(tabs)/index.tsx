import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image 
} from 'react-native';
import { Link } from 'expo-router';
import { 
  ChevronRight, 
  FileText, 
  Users, 
  Calendar,
  MessageSquare 
} from 'lucide-react-native';

const features = [
  { id: 1, icon: FileText, title: 'Documents', color: '#007AFF', route: '/documents' },
  { id: 2, icon: Users, title: 'Clients', color: '#34C759', route: '/clients' },
  { id: 3, icon: Calendar, title: 'Calendar', color: '#FF9500', route: '/calendar' },
  { id: 4, icon: MessageSquare, title: 'Messages', color: '#AF52DE', route: '/messages' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning,</Text>
        <Text style={styles.name}>John Doe</Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {features.map((feature) => (
            <Link key={feature.id} href={feature.route} asChild>
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.iconContainer, { backgroundColor: `${feature.color}20` }]}>
                  <feature.icon color={feature.color} size={24} />
                </View>
                <Text style={styles.actionTitle}>{feature.title}</Text>
                <ChevronRight color="#8E8E93" size={16} />
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>

      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <FileText color="#007AFF" size={20} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Document {item} reviewed</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Link href="/modal" asChild>
        <TouchableOpacity style={styles.modalButton}>
          <Text style={styles.modalButtonText}>Open Modal</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  greeting: {
    fontSize: 14,
    color: '#8E8E93',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    gap: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  recentActivity: {
    padding: 20,
    paddingTop: 0,
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  activityTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  modalButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});