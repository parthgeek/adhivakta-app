import { Stack } from "expo-router";

export default function CasesLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="new"
                options={{
                    title: "New Case",
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: "#fff",
                    },
                    headerTitleStyle: {
                        fontWeight: "600",
                        fontSize: 18,
                        color: "#111",
                    },
                    headerTintColor: "#000",
                    headerShadowVisible: false,
                    headerBackTitle: "Cases",
                }}
            />
        </Stack>
    );
}
