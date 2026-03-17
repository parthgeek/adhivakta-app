import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function BackButton() {
    const router = useRouter();
    return (
        <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginLeft: 4, padding: 4 }}
        >
            <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
    );
}

export default function CaseIdLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: "#fff" },
                    headerTitleStyle: {
                        fontWeight: "600",
                        fontSize: 16,
                        color: "#111",
                    },
                    headerTintColor: "#000",
                    headerShadowVisible: false,
                    headerLeft: () => <BackButton />,
                }}
            />
            <Stack.Screen
                name="edit"
                options={{
                    title: "Edit Case",
                    headerShown: true,
                    headerStyle: { backgroundColor: "#fff" },
                    headerTitleStyle: {
                        fontWeight: "600",
                        fontSize: 18,
                        color: "#111",
                    },
                    headerTintColor: "#000",
                    headerShadowVisible: false,
                    headerLeft: () => <BackButton />,
                }}
            />
        </Stack>
    );
}
