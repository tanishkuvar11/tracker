import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { Audio } from "expo-av";

const BACKEND_URL = "https://tracker-aood.onrender.com"; // Your Render URL
const TASK_NAME = "CHECK_TICKETS_TASK";

// ✅ Set Notification Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ Background Task Definition
TaskManager.defineTask(TASK_NAME, async () => {
  console.log("🔄 Background task running...");
  try {
    const response = await fetch(`${BACKEND_URL}/check-tickets`);
    const { available } = await response.json();

    if (available) {
      await triggerAlert();
    }
  } catch (error) {
    console.error("❌ Error in background task:", error);
  }
  return BackgroundFetch.Result.NewData;
});

// ✅ Register Background Fetch
async function registerBackgroundFetch() {
  const status = await BackgroundFetch.getStatusAsync();
  if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 60, // Every 60 seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("✅ Background Fetch registered!");
  } else {
    console.log("❌ Background Fetch unavailable.");
  }
}

// ✅ Check tickets manually (Handles API failures)
async function checkForTicketDrop(setTicketAvailable) {
  try {
    const response = await fetch(`${BACKEND_URL}/check-tickets`);
    if (!response.ok) throw new Error("Server error");

    const { available } = await response.json();

    setTicketAvailable(available); // ✅ Update UI correctly

    if (available) {
      await triggerAlert();
    }
  } catch (error) {
    console.error("❌ Error checking tickets:", error);
  }
}

// ✅ Play Alarm (Ensures it actually plays)
async function playAlarm() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("./assets/alarm.mp3"),
      { shouldPlay: true }
    );
    await sound.playAsync();
  } catch (error) {
    console.error("❌ Error playing alarm:", error);
  }
}

// ✅ Trigger Alert & Notification
async function triggerAlert() {
  await playAlarm();
  
  Alert.alert("🚨 Tickets Available!", "Go book now!", [{ text: "OK" }]);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🚨 Tickets Available!",
      body: "Hurry! Book now before they’re gone!",
      sound: "default",
    },
    trigger: { seconds: 1 },
  });
}

// ✅ Request Notification Permissions
async function requestPermissions() {
  if (Device.isDevice) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("❌ Permission not granted for notifications!");
    }
  } else {
    alert("⚠️ Must use a physical device for notifications.");
  }
}

export default function App() {
  const [ticketAvailable, setTicketAvailable] = useState(false);

  useEffect(() => {
    requestPermissions();
    registerBackgroundFetch();

    const interval = setInterval(() => {
      checkForTicketDrop(setTicketAvailable);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
    <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff", marginBottom: 20 }}>
      {ticketAvailable ? "🎟 Tickets Available!" : "No Tickets Yet"}
    </Text>
    <Button title="Check Now" onPress={() => checkForTicketDrop(setTicketAvailable)} />
  </View>
);

}