import { Bell, Calendar, ChevronRight, FileText, MessageSquare } from 'lucide-react-native';
import React from 'react';
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const notifications = [
    {
        id: '1',
        type: 'case',
        title: 'New Case Update',
        message: 'A new document has been added to the Sharma vs. State case.',
        time: '2 hours ago',
        icon: FileText,
        color: '#007AFF',
    },
    {
        id: '2',
        type: 'calendar',
        title: 'Scheduled Hearing',
        message: 'Your hearing for the Malhotra property case is tomorrow at 10:00 AM.',
        time: '5 hours ago',
        icon: Calendar,
        color: '#FF9500',
    },
    {
        id: '3',
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Adv. Rakesh Mehta regarding the settlement.',
        time: '1 day ago',
        icon: MessageSquare,
        color: '#34C759',
    },
    {
        id: '4',
        type: 'system',
        title: 'Subscription Renewed',
        message: 'Your premium membership has been successfully renewed for another month.',
        time: '2 days ago',
        icon: Bell,
        color: '#5856D6',
    },
];

export default function NotificationsScreen() {
    const renderItem = ({ item }: { item: typeof notifications[0] }) => (
        <TouchableOpacity style={styles.notificationItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                <item.icon color={item.color} size={24} />
            </View>
            <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.time}>{item.time}</Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                </Text>
            </View>
            <ChevronRight color="#C7C7CC" size={18} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Bell color="#C7C7CC" size={64} />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listContent: {
        paddingVertical: 8,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        marginRight: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    time: {
        fontSize: 12,
        color: '#8E8E93',
    },
    message: {
        fontSize: 14,
        color: '#3A3A3C',
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#8E8E93',
    },
});
