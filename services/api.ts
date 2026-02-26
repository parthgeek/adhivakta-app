import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://api.adhivakta.net/api";
const TOKEN_KEY = "auth_token";

/**
 * Get auth headers from stored token
 */
const getAuthHeaders = async (customToken?: string): Promise<Record<string, string>> => {
    try {
        const token = customToken || (await AsyncStorage.getItem(TOKEN_KEY));
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
    } catch {
        return { "Content-Type": "application/json" };
    }
};

/**
 * Generic fetch wrapper with error handling
 */
const request = async (
    endpoint: string,
    options: RequestInit = {},
    customToken?: string
): Promise<any> => {
    const headers = await getAuthHeaders(customToken);
    const url = `${BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {}),
            },
        });

        let data;
        try {
            data = await response.json();
        } catch {
            return {
                error: `Server error: ${response.status} ${response.statusText}`,
                status: response.status,
            };
        }

        if (!response.ok) {
            return {
                error: data.message || data.errors?.[0]?.msg || response.statusText,
                code: data.code,
                errors: data.errors,
                status: response.status,
            };
        }

        return data;
    } catch (error: any) {
        console.error(`API Error [${endpoint}]:`, error);
        return {
            error: error.message || "Network error. Please check your connection.",
        };
    }
};

/**
 * Upload file with progress tracking using XMLHttpRequest
 */
const uploadWithProgress = async (
    endpoint: string,
    formData: FormData,
    onProgress?: (event: { loaded: number; total: number; lengthComputable: boolean }) => void
): Promise<any> => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const url = `${BASE_URL}${endpoint}`;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);

        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }

        if (onProgress) {
            xhr.upload.addEventListener("progress", (event) => {
                onProgress({
                    loaded: event.loaded,
                    total: event.total,
                    lengthComputable: event.lengthComputable,
                });
            });
        }

        xhr.onload = () => {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data);
                } else {
                    resolve({ error: data.message || "Upload failed", status: xhr.status });
                }
            } catch {
                resolve({ error: "Failed to parse response" });
            }
        };

        xhr.onerror = () => {
            reject(new Error("Network error during upload"));
        };

        xhr.send(formData);
    });
};

// ========================
// API Methods
// ========================

const api = {
    auth: {
        /**
         * Register a new user
         */
        register: (data: { name: string; email: string; password: string; role: string }) =>
            request("/auth/register", {
                method: "POST",
                body: JSON.stringify(data),
            }),

        /**
         * Login with email and password
         */
        login: (data: { email: string; password: string; forceLogin?: boolean }) =>
            request("/auth/login", {
                method: "POST",
                body: JSON.stringify(data),
            }),

        /**
         * Google login with Firebase ID token
         */
        googleLogin: (data: { idToken: string; role?: string; isRegisterFlow?: boolean; forceLogin?: boolean }) =>
            request("/auth/google-login", {
                method: "POST",
                body: JSON.stringify(data),
            }),

        /**
         * Logout current session
         */
        logout: (customToken?: string) =>
            request("/auth/logout", { method: "POST" }, customToken),

        /**
         * Verify JWT token is still valid
         */
        verifyToken: (customToken?: string) =>
            request("/auth/verify", { method: "GET" }, customToken),

        /**
         * Get current user info
         */
        getMe: () => request("/auth/me", { method: "GET" }),

        /**
         * Request password reset email
         */
        forgotPassword: (data: { email: string }) =>
            request("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify(data),
            }),

        /**
         * Reset password with token
         */
        resetPassword: (token: string, data: { password: string }) =>
            request(`/auth/reset-password/${token}`, {
                method: "POST",
                body: JSON.stringify(data),
            }),

        /**
         * Change password (authenticated)
         */
        changePassword: (data: { currentPassword: string; newPassword: string }) =>
            request("/auth/change-password", {
                method: "POST",
                body: JSON.stringify(data),
            }),
    },

    cases: {
        create: (data: any) => request("/cases", {
            method: "POST",
            body: JSON.stringify(data),
        }),

        update: (id: string, data: any) => request(`/cases/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

        getAll: (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return request(`/cases${query}`);
        },

        get: (id: string) => request(`/cases/${id}`),

        delete: (id: string) => request(`/cases/${id}`, { method: "DELETE" }),

        getStats: () => request("/cases/stats"),

        getRecent: () => request("/cases/recent"),
    },

    documents: {
        uploadToCaseId: (
            caseId: string,
            formData: FormData,
            onProgress?: (event: { loaded: number; total: number; lengthComputable: boolean }) => void
        ) => uploadWithProgress(`/cases/${caseId}/documents`, formData, onProgress),
    },

    dashboard: {
        getSummary: () => request("/dashboard/summary"),
        getRecentCases: () => request("/dashboard/recent-cases"),
        getUpcomingEvents: () => request("/dashboard/upcoming-events"),
    },

    notifications: {
        getAll: () => request("/notifications"),
        getUnreadCount: () => request("/notifications/count"),
        markAsRead: (id: string) => request(`/notifications/${id}/read`, { method: "PATCH" }),
        delete: (id: string) => request(`/notifications/${id}`, { method: "DELETE" }),
    },

    chat: {
        getGroups: () => request("/chat/groups"),
        getMessages: (groupId: string, params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return request(`/chat/groups/${groupId}/messages${query}`);
        },
        sendMessage: (groupId: string, data: { text: string; attachments?: { filename: string; url: string }[] }) =>
            request(`/chat/groups/${groupId}/messages`, {
                method: "POST",
                body: JSON.stringify(data),
            }),
    },

    events: {
        getAll: (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return request(`/events${query}`);
        },
        getById: (id: string) => request(`/events/${id}`),
        create: (data: any) => request("/events", { method: "POST", body: JSON.stringify(data) }),
        update: (id: string, data: any) => request(`/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
        delete: (id: string) => request(`/events/${id}`, { method: "DELETE" }),
    },

    profile: {
        get: () => request("/profile/profile"),
        update: (data: any) => request("/profile/profile", { method: "PUT", body: JSON.stringify(data) }),
    },
};

export default api;
