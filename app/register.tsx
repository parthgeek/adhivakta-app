import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const [accountType, setAccountType] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Email form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleSignup = async () => {
    setError("");

    if (!accountType) {
      setError("Please select an account type before continuing with Google.");
      return;
    }

    setIsLoading(true);
    // Simulate Google signup - replace with actual auth later
    setTimeout(() => {
      router.push("/(tabs)");
      setIsLoading(false);
    }, 1000);
  };

  const handleEmailSignup = () => {
    if (!accountType) {
      setError("Please select an account type before continuing.");
      return;
    }
    setShowEmailForm(true);
  };

  const handleEmailSubmit = async () => {
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    // Simulate email signup - replace with actual auth later
    setTimeout(() => {
      router.push("/(tabs)");
      setIsLoading(false);
    }, 1000);
  };

  const selectRole = (role: string) => {
    setAccountType(role);
    setShowRoleModal(false);
    setError("");
  };

  if (showEmailForm) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <TouchableOpacity onPress={() => router.push("/")}>
              <Image
                source={require("../assets/adhi_logo_main.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Email Registration</Text>
            <Text style={styles.subtitle}>
              Creating {accountType === "lawyer" ? "lawyer" : "client"} account
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleEmailSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowEmailForm(false)}
            >
              <Ionicons name="arrow-back" size={20} color="#111" />
              <Text style={styles.backButtonText}>Back to signup options</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={() => router.push("/")}>
            <Image
              source={require("../assets/adhi_logo_main.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Join thousands of legal professionals using Adhivakta
          </Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Account Type Selection */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Account Type</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowRoleModal(true)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  !accountType && styles.selectButtonPlaceholder,
                ]}
              >
                {accountType
                  ? accountType.charAt(0).toUpperCase() + accountType.slice(1)
                  : "Select your role"}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Google Sign Up */}
          <TouchableOpacity
            style={[
              styles.googleButton,
              (!accountType || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignup}
            disabled={!accountType || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#111" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Sign Up */}
          <TouchableOpacity
            style={[
              styles.emailButton,
              (!accountType || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleEmailSignup}
            disabled={!accountType || isLoading}
          >
            <Text style={styles.emailButtonText}>Sign up with Email</Text>
          </TouchableOpacity>

          {!accountType && (
            <Text style={styles.helperText}>
              Please select your account type to continue
            </Text>
          )}
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>
            By signing up, you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Role</Text>
            <Text style={styles.modalSubtitle}>
              Please select your role to complete your account setup.
            </Text>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => selectRole("lawyer")}
            >
              <Ionicons name="briefcase-outline" size={24} color="#111" />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Lawyer</Text>
                <Text style={styles.roleDescription}>
                  Manage cases, clients, and documents
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => selectRole("client")}
            >
              <Ionicons name="person-outline" size={24} color="#111" />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Client</Text>
                <Text style={styles.roleDescription}>
                  Track your cases and communicate with lawyers
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111",
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectButtonText: {
    fontSize: 16,
    color: "#111",
  },
  selectButtonPlaceholder: {
    color: "#9ca3af",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 16,
  },
  googleButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#111",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  emailButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  emailButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signUpButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#000",
    fontWeight: "600",
  },
  termsContainer: {
    alignItems: "center",
  },
  termsText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#000",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roleTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 13,
    color: "#6b7280",
  },
  modalCloseButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
});
