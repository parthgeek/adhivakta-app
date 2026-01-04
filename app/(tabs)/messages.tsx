import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Types
type Group = {
  _id: string;
  name: string;
  lastMessage?: string;
  updatedAt: string;
  members?: any[];
  unreadCount?: number;
};

type Message = {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

export default function MessagesScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [view, setView] = useState<"groups" | "chat">("groups");

  useEffect(() => {
    loadUser();
    fetchGroups();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      // Replace with actual API call
      // const data = await api.chat.getGroups();

      // Mock data
      const mockGroups: Group[] = [
        {
          _id: "1",
          name: "Smith v. Johnson Team",
          lastMessage: "Meeting scheduled for tomorrow",
          updatedAt: new Date().toISOString(),
          members: [],
          unreadCount: 2,
        },
        {
          _id: "2",
          name: "Estate of Williams",
          lastMessage: "Documents received",
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          members: [],
          unreadCount: 0,
        },
      ];

      setGroups(mockGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (groupId: string) => {
    setMessagesLoading(true);
    try {
      // Replace with actual API call
      // const data = await api.chat.getMessages(groupId);

      // Mock data
      const mockMessages: Message[] = [
        {
          _id: "1",
          text: "Hello, team!",
          sender: { _id: "2", name: "John Doe" },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: "2",
          text: "Hi John! Ready for the meeting?",
          sender: { _id: user?.id || "1", name: user?.name || "You" },
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ];

      setMessages(mockMessages);
      setActiveGroup(groupId);
      setView("chat");

      // Clear unread count
      setGroups((prev) =>
        prev.map((g) => (g._id === groupId ? { ...g, unreadCount: 0 } : g))
      );
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeGroup) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      // Replace with actual API call
      // await api.chat.sendMessage(activeGroup, { text: messageText });

      // Mock: Add message locally
      const newMsg: Message = {
        _id: Date.now().toString(),
        text: messageText,
        sender: { _id: user?.id || "1", name: user?.name || "You" },
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd();
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageText);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Groups List View
  if (view === "groups") {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>{groups.length} group(s)</Text>
        </View>

        <FlatList
          data={groups}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.groupItem}
              onPress={() => loadMessages(item._id)}
              activeOpacity={0.7}
            >
              <View style={styles.groupIconContainer}>
                <Ionicons name="people" size={24} color="#fff" />
              </View>
              <View style={styles.groupInfo}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{item.name}</Text>
                  <Text style={styles.groupTime}>
                    {getRelativeTime(item.updatedAt)}
                  </Text>
                </View>
                <View style={styles.groupFooter}>
                  <Text
                    style={[
                      styles.groupLastMessage,
                      item.unreadCount && item.unreadCount > 0
                        ? styles.unreadMessage
                        : {},
                    ]}
                    numberOfLines={1}
                  >
                    {item.lastMessage || "No messages yet"}
                  </Text>
                  {item.unreadCount && item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {item.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyStateTitle}>No chat groups</Text>
              <Text style={styles.emptyStateText}>
                Create a case to start chatting with your team
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  // Chat View
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => {
            setView("groups");
            setActiveGroup(null);
            setMessages([]);
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>
            {groups.find((g) => g._id === activeGroup)?.name}
          </Text>
          <Text style={styles.chatHeaderSubtitle}>
            {(groups.find((g) => g._id === activeGroup)?.members?.length || 0) +
              " members"}
          </Text>
        </View>
      </View>

      {/* Messages List */}
      {messagesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => {
            const isCurrentUser = item.sender._id === user?.id;
            return (
              <View
                style={[
                  styles.messageWrapper,
                  isCurrentUser
                    ? styles.messageWrapperRight
                    : styles.messageWrapperLeft,
                ]}
              >
                {!isCurrentUser && (
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {item.sender.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isCurrentUser
                      ? styles.messageBubbleRight
                      : styles.messageBubbleLeft,
                  ]}
                >
                  {!isCurrentUser && (
                    <Text style={styles.senderName}>{item.sender.name}</Text>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      isCurrentUser
                        ? styles.messageTextRight
                        : styles.messageTextLeft,
                    ]}
                  >
                    {item.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      isCurrentUser
                        ? styles.messageTimeRight
                        : styles.messageTimeLeft,
                    ]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyChatText}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
        />
      )}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  groupItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    flex: 1,
  },
  groupTime: {
    fontSize: 12,
    color: "#9ca3af",
  },
  groupFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupLastMessage: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "700",
    color: "#111",
  },
  unreadBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  chatHeaderSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  messagesContainer: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  messageWrapperLeft: {
    alignSelf: "flex-start",
  },
  messageWrapperRight: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#6b7280",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
  },
  messageBubbleLeft: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  messageBubbleRight: {
    backgroundColor: "#3b82f6",
  },
  senderName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextLeft: {
    color: "#111",
  },
  messageTextRight: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageTimeLeft: {
    color: "#9ca3af",
  },
  messageTimeRight: {
    color: "#dbeafe",
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyChatText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 12,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
