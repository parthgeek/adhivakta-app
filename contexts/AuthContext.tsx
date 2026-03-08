import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../services/firebase";
import api from "../services/api";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "915129812927-27sib23mune0kgn9ljp7259401vg1m3r.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "915129812927-fkoqu6a25ur86dqbdn5o5pim7rd3bl0e.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "915129812927-bej09puc99gj9t4cu8jhk2n796nusnht.apps.googleusercontent.com";
const GOOGLE_EXPO_CLIENT_ID = "915129812927-27sib23mune0kgn9ljp7259401vg1m3r.apps.googleusercontent.com";
const GOOGLE_IOS_REVERSED_CLIENT_ID = "com.googleusercontent.apps.915129812927-fkoqu6a25ur86dqbdn5o5pim7rd3bl0e";

// Types
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, forceLogin?: boolean) => Promise<{ success: boolean; error?: string; code?: string }>;
    register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; error?: string; message?: string }>;
    googleLogin: (role?: string, isRegisterFlow?: boolean, forceLogin?: boolean) => Promise<{ success: boolean; error?: string; code?: string }>;
    googleLoginWithIdToken: (idToken: string, role?: string, isRegisterFlow?: boolean, forceLogin?: boolean) => Promise<{ success: boolean; error?: string; code?: string }>;
    logout: () => Promise<void>;
    forceLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const useProxy = Platform.OS !== "web" && (Constants.appOwnership === "expo" || Constants.appOwnership === "guest");
    const nativeGoogleRedirectUri = useMemo(() => {
        if (useProxy || Platform.OS !== "ios") {
            return undefined;
        }

        // Standalone iOS builds must use the reversed Google client ID scheme.
        return AuthSession.makeRedirectUri({
            native: `${GOOGLE_IOS_REVERSED_CLIENT_ID}:/oauthredirect`,
        });
    }, [useProxy]);
    const googleAuthConfig = useMemo(() => {
        if (useProxy) {
            return {
                clientId: GOOGLE_EXPO_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
                redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
            };
        }

        return {
            webClientId: GOOGLE_WEB_CLIENT_ID,
            iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
            androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
            ...(nativeGoogleRedirectUri ? { redirectUri: nativeGoogleRedirectUri } : {}),
        };
    }, [nativeGoogleRedirectUri, useProxy]);
    const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest(googleAuthConfig);
    const googleResponseRef = useRef<AuthSession.AuthSessionResult | null>(null);
    useEffect(() => {
        googleResponseRef.current = googleResponse;
    }, [googleResponse]);

    // Restore session on app start
    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            const storedUser = await AsyncStorage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                // Verify the token is still valid
                const result = await api.auth.verifyToken(storedToken);

                if (result.success) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } else {
                    // Token expired/invalid, clear storage
                    await clearStorage();
                }
            }
        } catch (error) {
            console.error("[Auth] Error restoring session:", error);
            await clearStorage();
        } finally {
            setIsLoading(false);
        }
    };

    const saveSession = async (newToken: string, newUser: User) => {
        await AsyncStorage.setItem(TOKEN_KEY, newToken);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const clearStorage = async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    };

    /**
     * Login flow (matches web app):
     * 1. Sign in with Firebase Auth (email/password)
     * 2. Get Firebase ID token
     * 3. Send ID token to backend /api/auth/google-login
     * 4. Backend returns JWT + user data
     */
    const login = useCallback(async (email: string, password: string, forceLogin = false): Promise<{ success: boolean; error?: string; code?: string }> => {
        try {
            console.log("[Auth] Step 1: Signing in with Firebase Auth...");

            // Step 1: Sign in with Firebase Auth
            const firebaseResult = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = firebaseResult.user;

            console.log("[Auth] Step 2: Firebase sign-in successful, getting ID token...");

            // Step 2: Get Firebase ID token
            const idToken = await firebaseUser.getIdToken();

            console.log("[Auth] Step 3: Sending ID token to backend...");

            // Step 3: Send ID token to backend (same endpoint as web app)
            const result = await api.auth.googleLogin({
                idToken,
                isRegisterFlow: false,
                forceLogin,
            });

            console.log("[Auth] Backend result:", JSON.stringify(result));

            if (result.error) {
                return { success: false, error: result.error, code: result.code };
            }

            if (result.success && result.token && result.user) {
                await saveSession(result.token, result.user);
                return { success: true };
            }

            return { success: false, error: "Unexpected response from server" };
        } catch (error: any) {
            console.error("[Auth] Login error:", error);

            // Handle Firebase Auth errors
            const errorCode = error.code;
            let errorMessage = error.message || "Login failed";

            switch (errorCode) {
                case "auth/user-not-found":
                    errorMessage = "No account found with this email. Please register first.";
                    break;
                case "auth/wrong-password":
                    errorMessage = "Invalid password. Please try again.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email address.";
                    break;
                case "auth/user-disabled":
                    errorMessage = "This account has been disabled.";
                    break;
                case "auth/too-many-requests":
                    errorMessage = "Too many failed attempts. Please try again later.";
                    break;
                case "auth/invalid-credential":
                    errorMessage = "Invalid email or password. Please check your credentials.";
                    break;
                default:
                    if (errorMessage.includes("auth/")) {
                        errorMessage = "Authentication failed. Please check your credentials.";
                    }
            }

            return { success: false, error: errorMessage };
        }
    }, []);

    /**
     * Register flow:
     * 1. Create user in Firebase Auth
     * 2. Send verification email
     * 3. Register with backend using the Firebase ID token
     */
    const register = useCallback(async (name: string, email: string, password: string, role: string): Promise<{ success: boolean; error?: string; message?: string }> => {
        try {
            console.log("[Auth] Step 1: Creating Firebase Auth user...");

            // Step 1: Create user in Firebase Auth
            const firebaseResult = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = firebaseResult.user;

            console.log("[Auth] Step 2: Sending verification email...");

            // Step 2: Send verification email
            await sendEmailVerification(firebaseUser);

            console.log("[Auth] Step 3: Getting ID token and registering with backend...");

            // Step 3: Get ID token and register with backend
            const idToken = await firebaseUser.getIdToken();
            const result = await api.auth.googleLogin({
                idToken,
                role,
                isRegisterFlow: true,
            });

            console.log("[Auth] Register result:", JSON.stringify(result));

            if (result.error) {
                return { success: false, error: result.error };
            }

            // Sign out from Firebase after registration (user needs to verify email first)
            await auth.signOut();

            return {
                success: true,
                message: "Registration successful! Please check your email to verify your account before logging in."
            };
        } catch (error: any) {
            console.error("[Auth] Register error:", error);

            const errorCode = error.code;
            let errorMessage = error.message || "Registration failed";

            switch (errorCode) {
                case "auth/email-already-in-use":
                    errorMessage = "An account with this email already exists. Please login instead.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email address.";
                    break;
                case "auth/weak-password":
                    errorMessage = "Password is too weak. Please use at least 6 characters.";
                    break;
                default:
                    if (errorMessage.includes("auth/")) {
                        errorMessage = "Registration failed. Please try again.";
                    }
            }

            return { success: false, error: errorMessage };
        }
    }, []);

    const googleLoginWithIdToken = useCallback(async (
        idToken: string,
        role?: string,
        isRegisterFlow = false,
        forceLogin = false
    ): Promise<{ success: boolean; error?: string; code?: string }> => {
        try {
            const result = await api.auth.googleLogin({
                idToken,
                role,
                isRegisterFlow,
                forceLogin,
            });

            if (result.error) {
                return { success: false, error: result.error, code: result.code };
            }

            if (result.success && result.token && result.user) {
                await saveSession(result.token, result.user);
                return { success: true };
            }

            return { success: false, error: "Unexpected response from server" };
        } catch (error: any) {
            console.error("[Auth] Google login error:", error);
            return { success: false, error: error.message || "Google login failed" };
        }
    }, []);

    const googleLogin = useCallback(async (
        role?: string,
        isRegisterFlow = false,
        forceLogin = false
    ): Promise<{ success: boolean; error?: string; code?: string }> => {
        if (!googleRequest) {
            return { success: false, error: "Google Sign-In is not ready yet. Please try again." };
        }

        try {
            const result = await googlePromptAsync({ useProxy });

            if (result.type !== "success") {
                if (result.type === "cancel") {
                    return { success: false, error: "Google Sign-In was cancelled." };
                }
                if (result.type === "dismiss") {
                    return { success: false, error: "Google Sign-In was dismissed." };
                }
                return { success: false, error: "Google Sign-In failed. Please try again." };
            }

            let googleIdToken =
                result.authentication?.idToken ||
                (typeof result.params?.id_token === "string" ? result.params.id_token : undefined) ||
                googleResponseRef.current?.authentication?.idToken ||
                (typeof googleResponseRef.current?.params?.id_token === "string"
                    ? googleResponseRef.current.params.id_token
                    : undefined);

            if (!googleIdToken && typeof result.params?.code === "string") {
                // On native, promptAsync may resolve before auto code->token exchange completes.
                for (let i = 0; i < 12; i += 1) {
                    await new Promise((resolve) => setTimeout(resolve, 250));
                    googleIdToken =
                        googleResponseRef.current?.authentication?.idToken ||
                        (typeof googleResponseRef.current?.params?.id_token === "string"
                            ? googleResponseRef.current.params.id_token
                            : undefined);
                    if (googleIdToken) {
                        break;
                    }
                }
            }

            if (!googleIdToken) {
                return { success: false, error: "Google did not return an ID token. Please try again." };
            }

            const credential = GoogleAuthProvider.credential(googleIdToken);
            const firebaseResult = await signInWithCredential(auth, credential);
            const firebaseIdToken = await firebaseResult.user.getIdToken();

            return await googleLoginWithIdToken(firebaseIdToken, role, isRegisterFlow, forceLogin);
        } catch (error: any) {
            console.error("[Auth] Google login error:", error);
            return { success: false, error: error.message || "Google login failed" };
        }
    }, [googleLoginWithIdToken, googlePromptAsync, googleRequest, useProxy]);

    const forceLoginFn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        return login(email, password, true);
    }, [login]);

    const logout = useCallback(async () => {
        try {
            if (token) {
                await api.auth.logout(token);
            }
        } catch (error) {
            console.error("[Auth] Logout API error:", error);
        } finally {
            await clearStorage();
            try {
                await auth.signOut();
            } catch (e) {
                // Ignore Firebase signout errors
            }
        }
    }, [token]);

    const value: AuthContextType = {
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        googleLogin,
        googleLoginWithIdToken,
        logout,
        forceLogin: forceLoginFn,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
