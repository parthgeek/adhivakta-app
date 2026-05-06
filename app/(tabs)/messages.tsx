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
  RefreshControl,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

type Group = {
  _id: string;
  name: string;
  lastMessage?: string;
  updatedAt: string;
  members?: { user?: string; email?: string; role?: string }[];
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

type ApiGroup = {
  _id: string;
  name?: string;
  updatedAt?: string;
  members?: { user?: string; email?: string; role?: string }[];
};

type ApiMessage = {
  _id: string;
  text?: string;
  sender?: { _id?: string; name?: string } | string;
  createdAt?: string;
};

const mapMessageFromApi = (message: ApiMessage): Message => {
  const senderObject =
    typeof message.sender === "object" && message.sender !== null
      ? message.sender
      : undefined;

  return {
    _id: message._id,
    text: message.text || "",
    sender: {
      _id:
        senderObject?._id ||
        (typeof message.sender === "string" ? message.sender : ""),
      name: senderObject?.name || "Unknown",
    },
    createdAt: message.createdAt || new Date().toISOString(),
  };
};

export default function MessagesScreen() {
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [view, setView] = useState<"groups" | "chat">("groups");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      setErrorMessage("");
      const result = await api.chat.getGroups();

      if (result?.error) {
        setErrorMessage(result.error);
        setGroups([]);
        return;
      }

      const apiGroups: ApiGroup[] = Array.isArray(result?.data)
        ? result.data
        : [];

      const groupsWithPreview = await Promise.all(
        apiGroups.map(async (group) => {
          let lastMessage = "";
          try {
            const messagesResult = await api.chat.getMessages(group._id, {
              page: "0",
              limit: "1",
            });

            if (!messagesResult?.error && Array.isArray(messagesResult?.data)) {
              lastMessage = messagesResult.data[0]?.text || "";
            }
          } catch {
            // Keep group visible even if preview fetch fails.
          }

          return {
            _id: group._id,
            name: group.name || "Untitled Group",
            lastMessage,
            updatedAt: group.updatedAt || new Date().toISOString(),
            members: group.members || [],
            unreadCount: 0,
          };
        })
      );

      setGroups(groupsWithPreview);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setErrorMessage("Failed to load messages. Please try again.");
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const loadMessages = async (groupId: string) => {
    setMessagesLoading(true);
    try {
      const result = await api.chat.getMessages(groupId, {
        page: "0",
        limit: "100",
      });

      if (result?.error) {
        setErrorMessage(result.error);
        return;
      }

      const apiMessages: ApiMessage[] = Array.isArray(result?.data)
        ? result.data
        : [];
      const normalizedMessages = apiMessages.map(mapMessageFromApi);

      setMessages(normalizedMessages);
      setActiveGroup(groupId);
      setView("chat");

      setGroups((prev) =>
        prev.map((group) =>
          group._id === groupId ? { ...group, unreadCount: 0 } : group
        )
      );
    } catch (error) {
      console.error("Error loading messages:", error);
      setErrorMessage("Failed to load chat messages.");
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeGroup) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      const result = await api.chat.sendMessage(activeGroup, { text: messageText });

      if (result?.error) {
        throw new Error(result.error);
      }

      const createdMessage = result?.data
        ? mapMessageFromApi(result.data)
        : {
            _id: Date.now().toString(),
            text: messageText,
            sender: { _id: user?.id || "", name: user?.name || "You" },
            createdAt: new Date().toISOString(),
          };

      setMessages((prev) => [...prev, createdMessage]);
      setGroups((prev) =>
        prev.map((group) =>
          group._id === activeGroup
            ? {
                ...group,
                lastMessage: createdMessage.text,
                updatedAt: createdMessage.createdAt,
              }
            : group
        )
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage("Failed to send message. Please try again.");
      setNewMessage(messageText);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
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

  if (view === "groups") {
    return (
      <View style={styles.container}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.groupsListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.groupsHeaderBlock}>
              <View style={styles.heroCard}>
                <View style={styles.heroBadge}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={14}
                    color="#c7d2fe"
                  />
                  <Text style={styles.heroBadgeText}>Inbox workspace</Text>
                </View>

                <Text style={styles.headerTitle}>Messages</Text>
                <Text style={styles.headerSubtitle}>
                  {groups.length} conversation{groups.length === 1 ? "" : "s"} in
                  your workspace
                </Text>

                <View style={styles.summaryRow}>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryValue}>{groups.length}</Text>
                    <Text style={styles.summaryLabel}>Groups</Text>
                  </View>
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryValue}>
                      {groups.filter((group) => (group.unreadCount || 0) > 0).length}
                    </Text>
                    <Text style={styles.summaryLabel}>Unread</Text>
                  </View>
                </View>
              </View>

              {!!errorMessage && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Conversations</Text>
                <Text style={styles.sectionHint}>Tap to open</Text>
              </View>
            </View>
          }
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
                {errorMessage
                  ? "Please pull to refresh and try again."
                  : "Create a case to start chatting with your team"}
              </Text>
            </View>
          }
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backButton}
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
            {groups.find((group) => group._id === activeGroup)?.name}
          </Text>
          <Text style={styles.chatHeaderSubtitle}>
            {(groups.find((group) => group._id === activeGroup)?.members?.length ||
              0) + " members"}
          </Text>
        </View>
      </View>

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
          ListHeaderComponent={
            <View style={styles.chatBanner}>
              <Text style={styles.chatBannerTitle}>
                {groups.find((group) => group._id === activeGroup)?.name}
              </Text>
              <Text style={styles.chatBannerText}>
                Conversation stays linked to the case workspace.
              </Text>
            </View>
          }
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
                      {(item.sender.name || "?").charAt(0).toUpperCase()}
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
    backgroundColor: "#eef4fb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef4fb",
  },
  groupsListContent: {
    padding: 16,
    paddingBottom: 120,
  },
  groupsHeaderBlock: {
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: "#0f2d5c",
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
  },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dbeafe",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#dbe7ff",
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  summaryPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "700",
    color: "#c7d8f8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  sectionHint: {
    fontSize: 12,
    color: "#64748b",
  },
  groupItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    marginBottom: 10,
    shadowColor: "#8da2bf",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#0f2d5c",
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
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
  },
  groupTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  groupFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupLastMessage: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  unreadMessage: {
    fontWeight: "700",
    color: "#0f172a",
  },
  unreadBadge: {
    backgroundColor: "#0f2d5c",
    borderRadius: 999,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    paddingVertical: 56,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#eef4fb",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  chatHeaderSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  chatBanner: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    padding: 14,
    marginBottom: 18,
  },
  chatBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  chatBannerText: {
    fontSize: 13,
    color: "#64748b",
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
    backgroundColor: "#0f2d5c",
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
    borderRadius: 20,
    padding: 12,
  },
  messageBubbleLeft: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
  },
  messageBubbleRight: {
    backgroundColor: "#0f2d5c",
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#eef4fb",
    gap: 12,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0f172a",
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0f2d5c",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
