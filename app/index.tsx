import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function LandingScreen() {
  const router = useRouter();

  const features = [
    {
      title: "User Roles: Lawyer & Client",
      description:
        "Distinct dashboards and permissions for lawyers and clients, ensuring secure and relevant access for every user.",
      icon: "people-outline",
    },
    {
      title: "Comprehensive Case Management",
      description:
        "Upload and manage cases with all details: court, parties, lawyers, clients, and more. Keep everything organized in one place.",
      icon: "briefcase-outline",
    },
    {
      title: "Document Upload & Management",
      description:
        "Attach, organize, and manage documents for each case. Secure storage and easy access for authorized users.",
      icon: "document-text-outline",
    },
    {
      title: "Share Cases & Documents",
      description:
        "Easily share case and document details with other users in the application, with full control over access.",
      icon: "share-social-outline",
    },
    {
      title: "Event Alerts & Notifications",
      description:
        "Get alerts for next hearings, deadlines, and custom events. Stay updated with in-app notifications, email, and (soon) WhatsApp.",
      icon: "notifications-outline",
    },
    {
      title: "Custom Events & Reminders",
      description:
        "Set your own events and reminders for any case. Never miss an important date or deadline again.",
      icon: "alarm-outline",
    },
  ];

  const testimonials = [
    {
      quote:
        "Adhivakta has revolutionized my workflow, saving hours with its intuitive case and document management tools.",
      author: "Rajesh Sharma",
      title: "Senior Advocate, Bangalore High Court",
      rating: 5,
    },
    {
      quote:
        "The client portal enhances transparency, significantly reducing client inquiries and boosting satisfaction.",
      author: "Priya Patel",
      title: "Family Law Attorney",
      rating: 5,
    },
    {
      quote:
        "As a growing firm, Adhivakta's scalable solutions have been a perfect fit for our needs.",
      author: "Vikram Singh",
      title: "Managing Partner, Singh & Associates",
      rating: 4,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../assets/adhi_logo_main.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push("/auth/login")}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => router.push("/auth/register")}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require("../assets/images/bg_main.png")}
            style={styles.heroBackground}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                Elevate Your{"\n"}
                <Text style={styles.heroTitleGray}>Legal Practice</Text>
                {"\n"}with Precision
              </Text>
              <Text style={styles.heroSubtitle}>
                Adhivakta offers a sophisticated platform to manage cases,
                streamline documents, and enhance client communication with
                unmatched efficiency.
              </Text>
              <View style={styles.heroButtons}>
                <TouchableOpacity
                  style={styles.heroPrimaryButton}
                  onPress={() => router.push("/auth/register")}
                >
                  <Text style={styles.heroPrimaryButtonText}>
                    Start Free Trial
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.heroSecondaryButton}>
                  <Text style={styles.heroSecondaryButtonText}>
                    Discover More
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.heroFooterText}>
                No credit card required. 30-day free trial for all plans.
              </Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Core Features for Modern Legal Practice
          </Text>
          <Text style={styles.sectionSubtitle}>
            Adhivakta is designed for both Lawyers and Clients, providing
            seamless case management, document handling, and secure
            collaboration.
          </Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={32} color="#000" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={[styles.section, styles.testimonialsSection]}>
          <Text style={styles.sectionTitle}>Voices of Trust</Text>
          <Text style={styles.sectionSubtitle}>
            Discover how Adhivakta has transformed the practices of legal
            professionals across the globe.
          </Text>
          <View style={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <View key={index} style={styles.testimonialCard}>
                <View style={styles.starsContainer}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Ionicons key={i} name="star" size={20} color="#000" />
                  ))}
                </View>
                <Text style={styles.testimonialQuote}>
                  "{testimonial.quote}"
                </Text>
                <View style={styles.testimonialAuthor}>
                  <Text style={styles.authorName}>{testimonial.author}</Text>
                  <Text style={styles.authorTitle}>{testimonial.title}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Redefine Your Legal Workflow</Text>
          <Text style={styles.ctaSubtitle}>
            Join a global community of legal professionals who rely on Adhivakta
            to manage cases, streamline operations, and deliver exceptional
            client experiences.
          </Text>
          <Text style={styles.ctaFooterText}>
            Trusted by over 5,000 firms worldwide. Start your journey today with
            a risk-free trial.
          </Text>
          <View style={styles.ctaButtons}>
            <TouchableOpacity
              style={styles.ctaPrimaryButton}
              onPress={() => router.push("/auth/register")}
            >
              <Text style={styles.ctaPrimaryButtonText}>Start Free Trial</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctaSecondaryButton}>
              <Text style={styles.ctaSecondaryButtonText}>Schedule a Demo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Image
            source={require("../assets/adhi_logo_main.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.footerCopyright}>
            © 2025 Adhivakta Legal Solutions. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  logo: {
    width: 80,
    height: 80,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  loginButtonText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  getStartedButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  getStartedButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  heroSection: {
    height: 500,
    position: "relative",
  },
  heroBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 15,
    lineHeight: 44,
  },
  heroTitleGray: {
    color: "#d1d5db",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#d1d5db",
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 15,
  },
  heroPrimaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  heroPrimaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  heroSecondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  heroSecondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  heroFooterText: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
  section: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    textAlign: "center",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  featuresGrid: {
    gap: 20,
  },
  featureCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    alignSelf: "center",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
    textAlign: "center",
  },
  testimonialsSection: {
    backgroundColor: "#f9fafb",
  },
  testimonialsGrid: {
    gap: 16,
  },
  testimonialCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
    gap: 4,
  },
  testimonialQuote: {
    fontSize: 14,
    color: "#4b5563",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  testimonialAuthor: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
    alignItems: "center",
  },
  authorName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  authorTitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  ctaSection: {
    backgroundColor: "#111",
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: "#d1d5db",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 24,
  },
  ctaFooterText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
  },
  ctaButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  ctaPrimaryButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  ctaPrimaryButtonText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
  ctaSecondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  ctaSecondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 16,
  },
  footerLogo: {
    width: 60,
    height: 60,
  },
  footerLinks: {
    flexDirection: "row",
    gap: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  footerLink: {
    fontSize: 13,
    color: "#4b5563",
  },
  footerCopyright: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
});
