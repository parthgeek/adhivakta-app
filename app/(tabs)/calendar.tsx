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
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

type CaseItem = {
  id: string;
  _id?: string;
  title: string;
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
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
      const mockCases: CaseItem[] = [
        { id: "1", title: "Smith v. Johnson" },
        { id: "2", title: "Estate of Williams" },
      ];

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

      setCases(mockCases);
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
    setSelectedDate(date);
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <Ionicons name="chevron-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowEventModal(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Event</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendar}>
        {/* Day names */}
        <View style={styles.dayNamesRow}>
          {dayNames.map((day) => (
            <View key={day} style={styles.dayNameCell}>
              <Text style={styles.dayNameText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar days */}
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

      {/* Upcoming Events */}
      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
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

      {/* Add Event Modal */}
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
    backgroundColor: "#f9fafb",
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dayNamesRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
    marginBottom: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: "center",
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  emptyDayCell: {
    backgroundColor: "#f9fafb",
  },
  todayCell: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
  },
  todayNumber: {
    color: "#3b82f6",
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
    color: "#6b7280",
    marginLeft: 2,
  },
  upcomingSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    fontWeight: "600",
    color: "#111",
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
    color: "#6b7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontWeight: "600",
    color: "#111",
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
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
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: "#111",
  },
  submitButton: {
    backgroundColor: "#000",
    borderRadius: 8,
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
    fontSize: 16,
    color: "#111",
  },
});
