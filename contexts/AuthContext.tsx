import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    signInWithCredential,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../services/firebase";
import api from "../services/api";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "915129812927-27sib23mune0kgn9ljp7259401vg1m3r.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID = "915129812927-fkoqu6a25ur86dqbdn5o5pim7rd3bl0e.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID = "915129812927-bej09puc99gj9t4cu8jhk2n796nusnht.apps.googleusercontent.com";
const GOOGLE_EXPO_CLIENT_ID = "915129812927-27sib23mune0kgn9ljp7259401vg1m3r.apps.googleusercontent.com";
const GOOGLE_IOS_REVERSED_CLIENT_ID = "com.googleusercontent.apps.915129812927-fkoqu6a25ur86dqbdn5o5pim7rd3bl0e";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
}

type AuthResult = {
    success: boolean;
    error?: string;
    code?: string;
    message?: string;
};

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, forceLogin?: boolean) => Promise<AuthResult>;
    register: (name: string, email: string, password: string, role: string) => Promise<AuthResult>;
    googleLogin: (role?: string, isRegisterFlow?: boolean, forceLogin?: boolean) => Promise<AuthResult>;
    googleLoginWithIdToken: (idToken: string, role?: string, isRegisterFlow?: boolean, forceLogin?: boolean) => Promise<AuthResult>;
    logout: () => Promise<void>;
    forceLogin: (email: string, password: string) => Promise<AuthResult>;
}

type GoogleBackendOptions = {
    idToken: string;
    role?: string;
    isRegisterFlow?: boolean;
    forceLogin?: boolean;
    persistSession?: boolean;
    cleanupSessionOnSuccess?: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

const normalizeApiAuthError = (result: any): AuthResult => {
    const errorMessage = result?.error || "Authentication failed";
    let code = result?.code as string | undefined;

    if (!code) {
        if (result?.status === 404 || /register first/i.test(errorMessage)) {
            code = "ACCOUNT_NOT_FOUND";
        } else if (/already exists/i.test(errorMessage) || /log in instead/i.test(errorMessage)) {
            code = "ACCOUNT_EXISTS";
        }
    }

    return {
        success: false,
        error: errorMessage,
        code,
    };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const useProxy =
        Platform.OS !== "web" &&
        (Constants.appOwnership === "expo" || Constants.appOwnership === "guest");

    const nativeGoogleRedirectUri = useMemo(() => {
        if (useProxy || Platform.OS !== "ios") {
            return undefined;
        }

        return AuthSession.makeRedirectUri({
            native: `${GOOGLE_IOS_REVERSED_CLIENT_ID}:/oauthredirect`,
        });
    }, [useProxy]);

    const googleAuthConfig = useMemo(() => {
        if (useProxy) {
            return {
                clientId: GOOGLE_EXPO_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
                redirectUri: AuthSession.makeRedirectUri({ useProxy: true } as any),
            };
        }

        return {
            webClientId: GOOGLE_WEB_CLIENT_ID,
            iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
            androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
            ...(nativeGoogleRedirectUri ? { redirectUri: nativeGoogleRedirectUri } : {}),
        };
    }, [nativeGoogleRedirectUri, useProxy]);

    const [googleRequest, googleResponse, googlePromptAsync] =
        Google.useIdTokenAuthRequest(googleAuthConfig);
    const googleResponseRef = useRef<any>(null);
    const pendingGoogleIdTokenRef = useRef<string | null>(null);

    useEffect(() => {
        googleResponseRef.current = googleResponse;
    }, [googleResponse]);

    useEffect(() => {
        void restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
            const storedUser = await AsyncStorage.getItem(USER_KEY);

            if (storedToken && storedUser) {
                const result = await api.auth.verifyToken(storedToken);

                if (result.success) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                } else {
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

    const cleanupTransientSession = useCallback(async (authToken?: string | null) => {
        if (authToken) {
            try {
                await api.auth.logout(authToken);
            } catch (error) {
                console.error("[Auth] Temporary logout failed:", error);
            }
        }

        try {
            await auth.signOut();
        } catch {
            // Ignore Firebase signout errors.
        }
    }, []);

    const submitGoogleAuth = useCallback(
        async ({
            idToken,
            role,
            isRegisterFlow = false,
            forceLogin = false,
            persistSession = true,
            cleanupSessionOnSuccess = false,
        }: GoogleBackendOptions): Promise<AuthResult> => {
            const result = await api.auth.googleLogin({
                idToken,
                role,
                isRegisterFlow,
                forceLogin,
            });

            if (result.error) {
                if (result.code !== "ALREADY_LOGGED_IN") {
                    pendingGoogleIdTokenRef.current = null;
                }
                return normalizeApiAuthError(result);
            }

            if (result.success && result.token && result.user) {
                pendingGoogleIdTokenRef.current = null;

                if (persistSession) {
                    await saveSession(result.token, result.user);
                }

                if (cleanupSessionOnSuccess) {
                    await cleanupTransientSession(result.token);
                }

                return {
                    success: true,
                    message: isRegisterFlow
                        ? "Registration successful. Please log in to continue."
                        : undefined,
                };
            }

            return { success: false, error: "Unexpected response from server" };
        },
        [cleanupTransientSession]
    );

    const beginGoogleAuth = useCallback(async (): Promise<AuthResult & { idToken?: string }> => {
        if (!googleRequest) {
            return {
                success: false,
                error: "Google Sign-In is not ready yet. Please try again.",
            };
        }

        try {
            const result: any = await googlePromptAsync({ useProxy } as any);

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
                return {
                    success: false,
                    error: "Google did not return an ID token. Please try again.",
                };
            }

            const credential = GoogleAuthProvider.credential(googleIdToken);
            const firebaseResult = await signInWithCredential(auth, credential);
            const firebaseIdToken = await firebaseResult.user.getIdToken();

            return { success: true, idToken: firebaseIdToken };
        } catch (error: any) {
            console.error("[Auth] Google auth error:", error);
            return {
                success: false,
                error: error?.message || "Google login failed",
            };
        }
    }, [googlePromptAsync, googleRequest, useProxy]);

    const login = useCallback(
        async (email: string, password: string, forceLogin = false): Promise<AuthResult> => {
            const normalizedEmail = email.trim().toLowerCase();

            try {
                const firebaseResult = await signInWithEmailAndPassword(
                    auth,
                    normalizedEmail,
                    password
                );
                const firebaseIdToken = await firebaseResult.user.getIdToken();

                const result = await submitGoogleAuth({
                    idToken: firebaseIdToken,
                    isRegisterFlow: false,
                    forceLogin,
                    persistSession: true,
                });

                if (!result.success && result.code === "ACCOUNT_NOT_FOUND") {
                    await cleanupTransientSession();
                }

                return result;
            } catch (error: any) {
                console.error("[Auth] Login error:", error);

                const errorCode = error?.code;
                let errorMessage = error?.message || "Login failed";
                let code: string | undefined;

                switch (errorCode) {
                    case "auth/user-not-found":
                        errorMessage = "No account found with this email. Please register first.";
                        code = "ACCOUNT_NOT_FOUND";
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
                        if (typeof errorMessage === "string" && errorMessage.includes("auth/")) {
                            errorMessage = "Authentication failed. Please check your credentials.";
                        }
                }

                return { success: false, error: errorMessage, code };
            }
        },
        [cleanupTransientSession, submitGoogleAuth]
    );

    const register = useCallback(
        async (
            name: string,
            email: string,
            password: string,
            role: string
        ): Promise<AuthResult> => {
            const normalizedEmail = email.trim().toLowerCase();

            try {
                const firebaseResult = await createUserWithEmailAndPassword(
                    auth,
                    normalizedEmail,
                    password
                );
                const firebaseUser = firebaseResult.user;

                await sendEmailVerification(firebaseUser);

                const idToken = await firebaseUser.getIdToken();
                const result = await api.auth.googleLogin({
                    idToken,
                    role,
                    isRegisterFlow: true,
                });

                if (result.error) {
                    try {
                        await firebaseUser.delete();
                    } catch (deleteError) {
                        console.error("[Auth] Failed to delete partial Firebase user:", deleteError);
                    }

                    return normalizeApiAuthError(result);
                }

                await cleanupTransientSession(result.token);

                return {
                    success: true,
                    message:
                        "Registration successful! Please check your email to verify your account before logging in.",
                };
            } catch (error: any) {
                console.error("[Auth] Register error:", error);

                const errorCode = error?.code;
                let errorMessage = error?.message || "Registration failed";
                let code: string | undefined;

                switch (errorCode) {
                    case "auth/email-already-in-use":
                        errorMessage =
                            "An account with this email already exists. Please sign in instead.";
                        code = "ACCOUNT_EXISTS";
                        break;
                    case "auth/invalid-email":
                        errorMessage = "Invalid email address.";
                        break;
                    case "auth/weak-password":
                        errorMessage =
                            "Password is too weak. Please use at least 6 characters.";
                        break;
                    default:
                        if (typeof errorMessage === "string" && errorMessage.includes("auth/")) {
                            errorMessage = "Registration failed. Please try again.";
                        }
                }

                return { success: false, error: errorMessage, code };
            }
        },
        [cleanupTransientSession]
    );

    const googleLoginWithIdToken = useCallback(
        async (
            idToken: string,
            role?: string,
            isRegisterFlow = false,
            forceLogin = false
        ): Promise<AuthResult> => {
            return submitGoogleAuth({
                idToken,
                role,
                isRegisterFlow,
                forceLogin,
                persistSession: !isRegisterFlow,
                cleanupSessionOnSuccess: isRegisterFlow,
            });
        },
        [submitGoogleAuth]
    );

    const googleLogin = useCallback(
        async (
            role?: string,
            isRegisterFlow = false,
            forceLogin = false
        ): Promise<AuthResult> => {
            if (forceLogin && !isRegisterFlow && pendingGoogleIdTokenRef.current) {
                return submitGoogleAuth({
                    idToken: pendingGoogleIdTokenRef.current,
                    isRegisterFlow: false,
                    forceLogin: true,
                    persistSession: true,
                });
            }

            const googleAuthResult = await beginGoogleAuth();

            if (!googleAuthResult.success || !googleAuthResult.idToken) {
                return googleAuthResult;
            }

            pendingGoogleIdTokenRef.current = googleAuthResult.idToken;

            if (isRegisterFlow) {
                const existingAccountResult = await submitGoogleAuth({
                    idToken: googleAuthResult.idToken,
                    isRegisterFlow: false,
                    persistSession: false,
                    cleanupSessionOnSuccess: true,
                });

                if (
                    existingAccountResult.success ||
                    existingAccountResult.code === "ALREADY_LOGGED_IN"
                ) {
                    return {
                        success: false,
                        error: "This Google account is already registered. Please sign in instead.",
                        code: "ACCOUNT_EXISTS",
                    };
                }

                if (
                    existingAccountResult.code &&
                    existingAccountResult.code !== "ACCOUNT_NOT_FOUND"
                ) {
                    return existingAccountResult;
                }

                return submitGoogleAuth({
                    idToken: googleAuthResult.idToken,
                    role,
                    isRegisterFlow: true,
                    persistSession: false,
                    cleanupSessionOnSuccess: true,
                });
            }

            return submitGoogleAuth({
                idToken: googleAuthResult.idToken,
                isRegisterFlow: false,
                forceLogin,
                persistSession: true,
            });
        },
        [beginGoogleAuth, submitGoogleAuth]
    );

    const forceLoginFn = useCallback(
        async (email: string, password: string): Promise<AuthResult> => {
            return login(email, password, true);
        },
        [login]
    );

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
            } catch {
                // Ignore Firebase signout errors.
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
