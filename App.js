import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Audio } from "expo-av";

const BACKEND_URL = "http://172.20.10.2:3000/check-tickets"; // Replace with your actual local IP

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function checkForTicketDrop(setTicketAvailable) {
  try {
    const response = await fetch(BACKEND_URL);
    const { available } = await response.json();

    if (available) {
      setTicketAvailable(true);
      triggerAlert();
    }
  } catch (error) {
    console.error("Error checking tickets:", error);
  }
}

async function playAlarm() {
  const { sound } = await Audio.Sound.createAsync(
    require("./assets/alarm.mp3"), // Ensure this file exists in the assets folder
    { shouldPlay: true }
  );
  await sound.playAsync();
}

async function triggerAlert() {
  playAlarm();
  Alert.alert("Tickets Available!", "Go book now!", [{ text: "OK" }]);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🚨 Tickets Available!",
      body: "Hurry! Book now before they’re gone!",
      sound: "default",
    },
    trigger: { seconds: 1 }, // Delayed by 1 second
  });
}

async function requestPermissions() {
  if (Device.isDevice) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Permission not granted for notifications!");
    }
  } else {
    alert("Must use physical device for notifications.");
  }
}

export default function App() {
  const [ticketAvailable, setTicketAvailable] = useState(false);

  useEffect(() => {
    requestPermissions();

    const interval = setInterval(() => {
      checkForTicketDrop(setTicketAvailable);
    }, 5000);

    return () => clearInterval(interval); // Cleanup interval when unmounting
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        {ticketAvailable ? "🎟 Tickets Available!" : "No Tickets Yet"}
      </Text>
      <Button title="Check Now" onPress={triggerAlert} />
    </View>
  );
}
