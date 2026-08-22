import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HistoryItem = {
  id: string;
  title: string;
  location: string;
  date: string;
  status: string;
};

const API_URL = "http://10.5.90.86:8000/api/v1";

const getStatusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "submitted":
      return { backgroundColor: "#FFF4D6", borderColor: "#F5B942" };
    case "draft":
      return { backgroundColor: "#E8F1FF", borderColor: "#5B8DEF" };
    default:
      return { backgroundColor: "#E6F9F1", borderColor: "#38C98D" };
  }
};

const formatDisplayDate = (value?: string) => {
  if (!value) return "Recent report";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recent report";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatLocation = (latitude?: number, longitude?: number) => {
  if (latitude == null || longitude == null) return "Location unavailable";
  return `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
};

export default function HistoryScreen() {
  const router = useRouter();
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`${API_URL}/reports?citizen_id=TEMP_CITIZEN_ID`);

        if (!response.ok) {
          throw new Error(`Failed to fetch reports: ${response.status}`);
        }

        const data = await response.json();

        const mapped = data.map((item: any) => ({
          id: item.report_id ?? item._id ?? "unknown",
          title: item.comment || "Report submitted",
          location: formatLocation(item.latitude, item.longitude),
          date: formatDisplayDate(item.captured_at || item.created_at),
          status: String(item.status || "submitted").charAt(0).toUpperCase() + String(item.status || "submitted").slice(1),
        }));

        setHistoryData(mapped);
      } catch (error) {
        console.error("Error fetching reports:", error);
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={["top", "left", "right"]}>
      <View className="flex-1 px-5">
        <View className="mb-5 mt-2 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-xl bg-blue-100 active:bg-blue-200"
          >
            <Text className="text-2xl font-bold text-slate-800">←</Text>
          </Pressable>

          <Text className="text-[22px] font-extrabold text-slate-900">
            History
          </Text>

          <View className="h-11 w-11" />
        </View>

        <Text className="mb-3 text-[15px] font-semibold text-slate-600">
          Recent queries and reports
        </Text>

        {loading ? (
          <Text className="text-sm text-slate-500">Loading reports...</Text>
        ) : historyData.length === 0 ? (
          <Text className="text-sm text-slate-500">No reports found.</Text>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {historyData.map((item) => (
              <View
                key={item.id}
                className="mb-3 rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="mb-1 text-[18px] font-extrabold text-slate-900">
                      {item.title}
                    </Text>
                    <Text className="text-[13px] text-slate-500">
                      {item.location}
                    </Text>
                    <Text className="text-[13px] text-slate-500">
                      {item.date}
                    </Text>
                  </View>

                  <View
                    className="self-start rounded-full border px-2.5 py-1.5"
                    style={getStatusStyle(item.status)}
                  >
                    <Text className="text-[11px] font-bold text-slate-800">
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}