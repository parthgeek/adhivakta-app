import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch,
  TouchableOpacity 
} from 'react-native';
import { 
  Moon, 
  Bell, 
  Shield, 
  Globe,
  Palette,
  Download,
  Database,
  HelpCircle,
  ChevronRight
} from 'lucide-react-native';
import { useState } from 'react';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const settingsSections = [
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        {
          icon: Moon,
          title: 'Dark Mode',
          type: 'switch',
          value: darkMode,
          onValueChange: setDarkMode,
        },
        {
          icon: Palette,
          title: 'Theme',
          type: 'link',
          value: 'Light',
        },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          icon: Bell,
          title: 'Push Notifications',
          type: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
        {
          icon: Bell,
          title: 'Notification Sounds',
          type: 'switch',
          value: true,
        },
        {
          icon: Bell,
          title: 'Email Notifications',
          type: 'switch',
          value: true,
        },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          icon: Shield,
          title: 'Biometric Login',
          type: 'switch',
          value: biometric,
          onValueChange: setBiometric,
        },
        {
          icon: Database,
          title: 'Auto Backup',
          type: 'switch',
          value: autoSave,
          onValueChange: setAutoSave,
        },
        {
          icon: Shield,
          title: 'Privacy Settings',
          type: 'link',
        },
      ],
    },
    {
      title: 'General',
      icon: Globe,
      items: [
        {
          icon: Globe,
          title: 'Language',
          type: 'link',
          value: 'English',
        },
        {
          icon: Download,
          title: 'Data & Storage',
          type: 'link',
        },
        {
          icon: HelpCircle,
          title: 'Help & Support',
          type: 'link',
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
      </View>

      {settingsSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <View style={styles.sectionHeader}>
            <section.icon color="#007AFF" size={20} />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <View 
                key={itemIndex} 
                style={[
                  styles.settingItem,
                  itemIndex === section.items.length - 1 && styles.lastItem
                ]}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <item.icon color="#007AFF" size={20} />
                  </View>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                </View>
                
                {item.type === 'switch' ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onValueChange}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                  />
                ) : (
                  <TouchableOpacity style={styles.settingRight}>
                    <Text style={styles.settingValue}>{item.value || ''}</Text>
                    <ChevronRight color="#C7C7CC" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.aboutSection}>
        <Text style={styles.aboutTitle}>About</Text>
        <View style={styles.aboutContent}>
          <Text style={styles.aboutText}>
            Adhivakta App v1.0.0
          </Text>
          <Text style={styles.aboutSubtext}>
            A comprehensive legal management solution
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.advancedButton}>
        <Text style={styles.advancedButtonText}>Advanced Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 5,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  aboutSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  aboutContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
  },
  aboutText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  aboutSubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  advancedButton: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  advancedButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 30,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});