import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable,Text, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-100 px-5" edges={["top", "left", "right"]}>
      <View className="flex-1 justify-center px-6 pt-7">
        <View className="mb-7">
          <Text className="mb-3 text-[11px] font-bold uppercase tracking-[1.5px] text-blue-600">
            Civic 360
          </Text>
          <Text className="mb-2 text-4xl font-extrabold leading-[1.1] text-slate-900">
            Report and track local issues
          </Text>
          <Text className="text-[15px] leading-6 text-slate-600">
            Share photos, capture location, and monitor past reports.
          </Text>
        </View>

        <View className="gap-4">
          <Pressable
            className="min-h-[180px] justify-center rounded-[28px] border border-blue-200 bg-blue-100 p-6 shadow-sm"
            onPress={() => router.push("/upload")}
          >
            <Text className="mb-3 text-3xl">📸</Text>
            <Text className="mb-2 text-[28px] font-extrabold text-slate-900">
              Upload
            </Text>
            <Text className="text-[15px] leading-6 text-slate-700">
              Capture a problem and send the report instantly.
            </Text>
          </Pressable>

          <Pressable
            className="min-h-[180px] justify-center rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
            onPress={() => router.push("/history")}
          >
            <Text className="mb-3 text-3xl">🕘</Text>
            <Text className="mb-2 text-[28px] font-extrabold text-slate-900">
              History
            </Text>
            <Text className="text-[15px] leading-6 text-slate-700">
              Check previous queries and their status.
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
