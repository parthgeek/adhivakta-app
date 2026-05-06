import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";

// Types
type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  type: string;
  location: string;
  description: string;
  case: string;
};

// Event types with colors
const EVENT_TYPES = [
  { value: "hearing", label: "Court Hearing", color: "#3b82f6" },
  { value: "client_meeting", label: "Client Meeting", color: "#10b981" },
  { value: "case_filing", label: "Case Filing", color: "#ef4444" },
  {
    value: "evidence_submission",
    label: "Evidence Submission",
    color: "#a855f7",
  },
  { value: "court_visit", label: "Court Visit", color: "#eab308" },
];

// Get event color
const getEventColor = (type: string) => {
  const eventType = EVENT_TYPES.find((t) => t.value === type);
  return eventType ? eventType.color : "#6b7280";
};

// Event Type Modal
const EventTypeModal = ({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (type: string) => void;
  onClose: () => void;
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Event Type</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={EVENT_TYPES}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.typeItem}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <View
                  style={[
                    styles.typeIndicator,
                    { backgroundColor: item.color },
                  ]}
                />
                <Text style={styles.typeItemText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    time: "",
    type: "hearing",
    location: "",
    description: "",
    case: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Replace with actual API calls
      // const [casesData, eventsData] = await Promise.all([
      //   api.cases.getAll(),
      //   api.events.getAll()
      // ]);

      // Mock data
      const mockEvents: Event[] = [
        {
          id: "1",
          title: "Court Hearing",
          date: new Date().toISOString().split("T")[0],
          time: "10:00 AM",
          type: "hearing",
          location: "Court Room 3",
          description: "Initial hearing",
          case: "Smith v. Johnson",
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar generation
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push({ day: null, date: null });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateString = date.toISOString().split("T")[0];
    const dayEvents = events.filter((event) => event.date === dateString);

    calendarDays.push({
      day,
      date,
      dateString,
      events: dayEvents,
    });
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleDayPress = (date: Date) => {
    setNewEvent({ ...newEvent, date });
    setShowEventModal(true);
  };

  const handleAddEvent = async () => {
    // Validate and add event
    // await api.events.create(newEvent);
    // Refresh events
    setShowEventModal(false);
    // Reset form
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="calendar-outline" size={14} color="#c7d2fe" />
          <Text style={styles.heroBadgeText}>Schedule workspace</Text>
        </View>

        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={styles.monthNavButton}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.monthTitleBlock}>
            <Text style={styles.headerTitle}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <Text style={styles.headerSubtitle}>
              {events.length} scheduled event{events.length === 1 ? "" : "s"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={styles.monthNavButton}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowEventModal(true)}
        >
          <Ionicons name="add" size={18} color="#0f172a" />
          <Text style={styles.addButtonText}>Add Event</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendar}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Month View</Text>
          <Text style={styles.sectionHint}>Tap a date to add</Text>
        </View>

        <View style={styles.dayNamesRow}>
          {dayNames.map((day) => (
            <View key={day} style={styles.dayNameCell}>
              <Text style={styles.dayNameText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day.day === null && styles.emptyDayCell,
                day.dateString === new Date().toISOString().split("T")[0] &&
                  styles.todayCell,
              ]}
              onPress={() => day.date && handleDayPress(day.date)}
              disabled={day.day === null}
            >
              {day.day !== null && (
                <>
                  <Text
                    style={[
                      styles.dayNumber,
                      day.dateString ===
                        new Date().toISOString().split("T")[0] &&
                        styles.todayNumber,
                    ]}
                  >
                    {day.day}
                  </Text>
                  {day.events && day.events.length > 0 && (
                    <View style={styles.eventsContainer}>
                      {day.events.slice(0, 2).map((event) => (
                        <View
                          key={event.id}
                          style={[
                            styles.eventDot,
                            { backgroundColor: getEventColor(event.type) },
                          ]}
                        />
                      ))}
                      {day.events.length > 2 && (
                        <Text style={styles.moreEvents}>
                          +{day.events.length - 2}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.upcomingSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <Text style={styles.sectionHint}>Next on calendar</Text>
        </View>
        {events.length > 0 ? (
          events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View
                style={[
                  styles.eventIndicator,
                  { backgroundColor: getEventColor(event.type) },
                ]}
              />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <View style={styles.eventMeta}>
                  <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                  <Text style={styles.eventMetaText}>
                    {new Date(event.date).toLocaleDateString()} at {event.time}
                  </Text>
                </View>
                {event.location && (
                  <View style={styles.eventMeta}>
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#6b7280"
                    />
                    <Text style={styles.eventMetaText}>{event.location}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No upcoming events</Text>
          </View>
        )}
      </View>

      <Modal visible={showEventModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter event title"
                  value={newEvent.title}
                  onChangeText={(text) =>
                    setNewEvent({ ...newEvent, title: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10:30 AM"
                  value={newEvent.time}
                  onChangeText={(text) =>
                    setNewEvent({ ...newEvent, time: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Type</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowTypeModal(true)}
                >
                  <Text style={styles.selectButtonText}>
                    {EVENT_TYPES.find((t) => t.value === newEvent.type)?.label}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter location"
                  value={newEvent.location}
                  onChangeText={(text) =>
                    setNewEvent({ ...newEvent, location: text })
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description"
                  value={newEvent.description}
                  onChangeText={(text) =>
                    setNewEvent({ ...newEvent, description: text })
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddEvent}
              >
                <Text style={styles.submitButtonText}>Add Event</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <EventTypeModal
        visible={showTypeModal}
        onSelect={(type) => setNewEvent({ ...newEvent, type })}
        onClose={() => setShowTypeModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef4fb",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef4fb",
  },
  heroCard: {
    backgroundColor: "#0f2d5c",
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dbeafe",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthNavButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  monthTitleBlock: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#dbe7ff",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    shadowColor: "#8da2bf",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  dayNamesRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#edf2f7",
    paddingBottom: 8,
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: "center",
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 12,
  },
  emptyDayCell: {
    backgroundColor: "#f8fafc",
  },
  todayCell: {
    backgroundColor: "#eef4ff",
    borderColor: "#0f2d5c",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  todayNumber: {
    color: "#0f2d5c",
    fontWeight: "700",
  },
  eventsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    gap: 2,
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreEvents: {
    fontSize: 8,
    color: "#64748b",
    marginLeft: 2,
  },
  upcomingSection: {
    marginBottom: 20,
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
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    shadowColor: "#8da2bf",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  eventIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  eventMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  eventMetaText: {
    fontSize: 13,
    color: "#64748b",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    paddingVertical: 42,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dbe4f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 15,
    color: "#0f172a",
  },
  submitButton: {
    backgroundColor: "#0f2d5c",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  typeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  typeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  typeItemText: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
  },
});
