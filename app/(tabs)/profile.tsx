import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  Settings,
  Shield,
  Star,
  User
} from 'lucide-react-native';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const menuItems = [
  { icon: User, title: 'Edit Profile', route: '/edit-profile' },
  { icon: Settings, title: 'Account Settings', route: '/account-settings' },
  { icon: Shield, title: 'Privacy & Security', route: '/privacy' },
  { icon: Bell, title: 'Notification Settings', route: '/notification-settings' },
  { icon: FileText, title: 'My Documents', route: '/my-documents' },
  { icon: CreditCard, title: 'Billing & Subscription', route: '/billing' },
  { icon: Star, title: 'Rate App', route: '/rate' },
  { icon: HelpCircle, title: 'Help & Support', route: '/help' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.email}>john.doe@example.com</Text>
            <Text style={styles.role}>Premium Member</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>15</Text>
          <Text style={styles.statLabel}>Cases</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <item.icon color="#007AFF" size={20} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
            </View>
            <ChevronRight color="#C7C7CC" size={20} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <LogOut color="#FF3B30" size={20} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileDetails: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  role: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 5,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 1,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  menu: {
    backgroundColor: 'white',
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
  },
  version: {
    fontSize: 14,
    color: '#8E8E93',
  },
});