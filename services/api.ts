import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: Update this to your actual backend URL
const BASE_URL = "http://localhost:5000/api";

/**
 * Get auth headers from stored token
 */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
        const token = await AsyncStorage.getItem("token");
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
    options: RequestInit = {}
): Promise<any> => {
    const headers = await getAuthHeaders();
    const url = `${BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {}),
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.message || data.error || "Request failed",
                errors: data.errors,
                status: response.status,
            };
        }

        return data;
    } catch (error: any) {
        console.error(`API Error [${endpoint}]:`, error);
        return {
            error: error.message || "Network error",
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
    const token = await AsyncStorage.getItem("token");
    const url = `${BASE_URL}${endpoint}`;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);

        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        // Do NOT set Content-Type for FormData — the browser/RN sets it with boundary

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
    cases: {
        /**
         * Create a new case
         */
        create: (data: any) => request("/cases", {
            method: "POST",
            body: JSON.stringify(data),
        }),

        /**
         * Update an existing case
         */
        update: (id: string, data: any) => request(`/cases/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        }),

        /**
         * Get all cases
         */
        getAll: (params?: Record<string, string>) => {
            const query = params ? `?${new URLSearchParams(params).toString()}` : "";
            return request(`/cases${query}`);
        },

        /**
         * Get a single case
         */
        get: (id: string) => request(`/cases/${id}`),

        /**
         * Delete a case
         */
        delete: (id: string) => request(`/cases/${id}`, { method: "DELETE" }),

        /**
         * Get case statistics
         */
        getStats: () => request("/cases/stats"),

        /**
         * Get recent cases
         */
        getRecent: () => request("/cases/recent"),
    },

    documents: {
        /**
         * Upload a document to a specific case
         */
        uploadToCaseId: (
            caseId: string,
            formData: FormData,
            onProgress?: (event: { loaded: number; total: number; lengthComputable: boolean }) => void
        ) => uploadWithProgress(`/cases/${caseId}/documents`, formData, onProgress),
    },
};

export default api;
