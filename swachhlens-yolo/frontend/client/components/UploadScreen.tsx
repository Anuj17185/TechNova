import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Image,
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.5.90.86:8000/api/v1";

export default function UploadScreen() {
  const router = useRouter();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturedLocation, setCapturedLocation] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [comment, setComment] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isRequestingRef = useRef(false);

  const captureLocation = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        throw new Error("Location services are turned off. Please enable GPS and try again.");
      }

      const locPerm = await Location.requestForegroundPermissionsAsync();
      if (!locPerm.granted) {
        throw new Error(
          locPerm.canAskAgain
            ? "Location permission is required to tag this report."
            : "Location permission is disabled. Please enable it in Settings."
        );
      }

      const lastKnownLocation = await Location.getLastKnownPositionAsync({
        maxAge: 120000,
        requiredAccuracy: 500,
      });
      let currentLocation: Location.LocationObject | null = null;
      try {
        currentLocation = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
      } catch (currentLocationError) {
        console.warn("Fresh location unavailable, using last known location:", currentLocationError);
      }
      const position = currentLocation ?? lastKnownLocation;
      if (!position) {
        throw new Error("Unable to determine your location. Please move outdoors and try again.");
      }

      const { latitude, longitude } = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error("The device returned an invalid location.");
      }
      setCoords({ latitude, longitude });
      setCapturedLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } catch (locErr) {
      const message = locErr instanceof Error ? locErr.message : "Could not capture your location.";
      console.warn("Location error:", locErr);
      setCoords(null);
      setCapturedLocation(null);
      Alert.alert("Location required", message);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        isRequestingRef.current = false;
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const capturePhoto = async () => {
    if (isRequestingRef.current) return;
    isRequestingRef.current = true;

    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();

      if (!cameraPerm.granted) {
        if (cameraPerm.canAskAgain) {
          Alert.alert(
            "Camera access required",
            "Please allow camera access so you can take a photo for the report.",
            [
              { text: "Try again", onPress: () => capturePhoto() },
              { text: "Cancel", style: "cancel" },
            ]
          );
        } else {
          Alert.alert(
            "Camera Access Required",
            "Camera permission has been disabled. Please enable it in Settings to take photos.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await captureLocation();
      }
    } catch (error: any) {
      console.error("Camera error:", error);
      if (error?.message?.includes("permission")) {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera permissions in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
      }
    } finally {
      isRequestingRef.current = false;
    }
  };

  const uploadReport = async () => {
    if (!photoUri) {
      Alert.alert("No photo selected", "Please take a photo before submitting.");
      return;
    }

    if (!coords) {
      Alert.alert("Location missing", "Please capture your location before uploading.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append("image", {
        uri: photoUri,
        name: "report.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("citizen_id", "TEMP_CITIZEN_ID");
      formData.append("latitude", String(coords.latitude));
      formData.append("longitude", String(coords.longitude));
      console.log("Uploading coordinates:", coords.latitude, coords.longitude);
      formData.append("captured_at", new Date().toISOString());
      formData.append("comment", comment);

      const response = await fetch(`${API_URL}/reports/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Report created:", data);

      Alert.alert("Report uploaded", "Your complaint has been submitted successfully.");
      router.push("/history");
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Upload failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveComment = () => {
    setComment(commentDraft.trim());
    setShowCommentModal(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100" edges={["top", "left", "right"]}>
      <View className="flex-1 px-5 pt-3">
        <View className="mb-5 flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="h-11 w-11 items-center justify-center rounded-xl bg-blue-100 active:bg-blue-200"
          >
            <Text className="text-2xl font-bold text-slate-800">←</Text>
          </Pressable>
          <Text className="text-[22px] font-extrabold text-slate-900">Upload report</Text>
          <View className="h-11 w-11" />
        </View>

        <Text className="mb-3 text-sm font-bold text-slate-700">Photo evidence</Text>
        <Pressable
          onPress={capturePhoto}
          className="mb-5 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm active:opacity-90"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="h-[220px] w-full" resizeMode="cover" />
          ) : (
            <View className="h-[220px] items-center justify-center bg-indigo-50">
              <Text className="mb-3 text-5xl text-blue-600">+</Text>
              <Text className="text-lg font-bold text-slate-700">Take a photo</Text>
            </View>
          )}
        </Pressable>

        <Text className="mb-3 text-sm font-bold text-slate-700">Location captured</Text>
        <View className="mb-6 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Text className="mr-3 text-[22px]">📍</Text>
          <Text className="flex-1 text-[15px] font-semibold text-slate-800">
            {capturedLocation ? capturedLocation : "Location not captured yet"}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            setCommentDraft(comment);
            setShowCommentModal(true);
          }}
          className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3"
        >
          <Text className="text-center text-sm font-bold text-blue-700">
            {comment ? "Edit note" : "Add note"}
          </Text>
        </Pressable>

        {comment ? (
          <View className="mb-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <Text className="text-sm font-medium text-slate-700">Note:</Text>
            <Text className="mt-1 text-sm text-slate-600">{comment}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={uploadReport}
          disabled={isUploading}
          className={`mb-7 mt-auto rounded-2xl bg-blue-700 px-4 py-4 ${
            isUploading ? "opacity-70" : "active:bg-blue-800"
          }`}
        >
          <Text className="text-center text-base font-extrabold text-white">
            {isUploading ? "Uploading..." : "Upload report"}
          </Text>
        </Pressable>
      </View>

      <Modal transparent visible={showCommentModal} animationType="slide" onRequestClose={() => setShowCommentModal(false)}>
        <View className="flex-1 items-center justify-center bg-slate-900/40 px-5">
          <View className="w-full rounded-[24px] bg-white p-5">
            <Text className="mb-3 text-xl font-extrabold text-slate-900">Add note</Text>
            <TextInput
              value={commentDraft}
              onChangeText={setCommentDraft}
              placeholder="Describe the issue..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="mb-4 min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 p-3 text-base text-slate-800"
            />

            <View className="flex-row justify-end gap-3">
              <Pressable
                onPress={() => setShowCommentModal(false)}
                className="rounded-xl bg-slate-200 px-4 py-2"
              >
                <Text className="font-bold text-slate-700">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={saveComment}
                className="rounded-xl bg-blue-700 px-4 py-2"
              >
                <Text className="font-bold text-white">Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}