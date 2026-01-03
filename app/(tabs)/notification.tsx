import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Calendar,
  MessageSquare 
} from 'lucide-react-native';
import { useState } from 'react';

const notifications = [
  {
    id: 1,
    type: 'success',
    icon: CheckCircle,
    title: 'Document Signed',
    description: 'Client John Doe has signed the agreement',
    time: '10 min ago',
    read: false,
  },
  {
    id: 2,
    type: 'warning',
    icon: AlertCircle,
    title: 'Deadline Approaching',
    description: 'Case filing deadline in 2 days',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 3,
    type: 'info',
    icon: Info,
    title: 'New Message',
    description: 'You have a new message from Sarah Smith',
    time: '3 hours ago',
    read: true,
  },
  {
    id: 4,
    type: 'calendar',
    icon: Calendar,
    title: 'Meeting Reminder',
    description: 'Client meeting tomorrow at 10 AM',
    time: '1 day ago',
    read: true,
  },
  {
    id: 5,
    type: 'message',
    icon: MessageSquare,
    title: 'Document Reviewed',
    description: 'Your document has been reviewed by the team',
    time: '2 days ago',
    read: true,
  },
];

export default function NotificationsScreen() {
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filteredNotifications = unreadOnly 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Bell color="#007AFF" size={24} />
          <Text style={styles.title}>Notifications</Text>
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, unreadOnly && styles.filterButtonActive]}
          onPress={() => setUnreadOnly(!unreadOnly)}
        >
          <Text style={[styles.filterText, unreadOnly && styles.filterTextActive]}>
            Unread Only
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.notificationsList}>
        {filteredNotifications.map((notification) => (
          <TouchableOpacity 
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.read && styles.unreadNotification
            ]}
          >
            <View style={styles.notificationIcon}>
              <notification.icon 
                color={
                  notification.type === 'success' ? '#34C759' :
                  notification.type === 'warning' ? '#FF9500' :
                  notification.type === 'info' ? '#007AFF' :
                  notification.type === 'calendar' ? '#AF52DE' :
                  '#5856D6'
                } 
                size={24} 
              />
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                {!notification.read && (
                  <View style={styles.unreadBadge} />
                )}
              </View>
              <Text style={styles.notificationDescription}>
                {notification.description}
              </Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Bell color="#C7C7CC" size={64} />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              {unreadOnly 
                ? 'You have no unread notifications' 
                : 'You have no notifications'}
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.markAllButton}>
        <Text style={styles.markAllText}>Mark All as Read</Text>
      </TouchableOpacity>
    </View>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  notificationsList: {
    flex: 1,
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  unreadNotification: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  markAllButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  markAllText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});