import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

export default function App() {
  const [patient, setPatient] = useState("");
  const [drug, setDrug] = useState("");
  const [total, setTotal] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [remaining, setRemaining] = useState("");
  const [perDay, setPerDay] = useState("");
  const [alertDays, setAlertDays] = useState("2");
  const [list, setList] = useState([]);

  useEffect(() => {
    loadData();
    Notifications.requestPermissionsAsync();
  }, []);

  const saveData = async (data) => {
    await AsyncStorage.setItem("farmaci", JSON.stringify(data));
  };

  const loadData = async () => {
    const data = await AsyncStorage.getItem("farmaci");
    if (data) setList(JSON.parse(data));
  };

  const scheduleNotification = async (item) => {
    const today = new Date();
    const daysCoverage = item.qty / item.perDay;

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + Math.floor(daysCoverage));

    const notifyDate = new Date(endDate);
    notifyDate.setDate(endDate.getDate() - item.alertDays);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Farmaco in esaurimento",
        body: `${item.drug} per ${item.patient} sta per finire`,
      },
      trigger: notifyDate,
    });
  };

  const addItem = async () => {
    if (!patient || !drug || !total || !perDay) {
      Alert.alert("Compila tutti i campi obbligatori");
      return;
    }

    let qty = parseFloat(total);

    if (isStarted) {
      if (!remaining) {
        Alert.alert("Inserisci quante ne restano");
        return;
      }
      qty = parseFloat(remaining);
    }

    const newItem = {
      id: Date.now().toString(),
      patient,
      drug,
      qty,
      perDay: parseFloat(perDay),
      alertDays: parseInt(alertDays),
    };

    const newList = [...list, newItem];
    setList(newList);
    saveData(newList);
    scheduleNotification(newItem);

    // reset
    setPatient("");
    setDrug("");
    setTotal("");
    setRemaining("");
    setPerDay("");
    setAlertDays("2");
    setIsStarted(false);
  };

  return (
    <View style={{ padding: 20, marginTop: 40 }}>
      <Text style={{ fontSize: 20 }}>Gestione Farmaci</Text>

      <Text>Paziente</Text>
      <TextInput value={patient} onChangeText={setPatient} style={{ borderWidth: 1 }} />

      <Text>Farmaco</Text>
      <TextInput value={drug} onChangeText={setDrug} style={{ borderWidth: 1 }} />

      <Text>Quantità totale</Text>
      <TextInput value={total} onChangeText={setTotal} keyboardType="numeric" style={{ borderWidth: 1 }} />

      <View style={{ flexDirection: "row" }}>
        <Text>Confezione iniziata</Text>
        <Switch value={isStarted} onValueChange={setIsStarted} />
      </View>

      {isStarted && (
        <>
          <Text>Quante restano</Text>
          <TextInput value={remaining} onChangeText={setRemaining} keyboardType="numeric" style={{ borderWidth: 1 }} />
        </>
      )}

      <Text>Al giorno</Text>
      <TextInput value={perDay} onChangeText={setPerDay} keyboardType="numeric" style={{ borderWidth: 1 }} />

      <Text>Preavviso (giorni)</Text>
      <TextInput value={alertDays} onChangeText={setAlertDays} keyboardType="numeric" style={{ borderWidth: 1 }} />

      <Button title="Aggiungi" onPress={addItem} />

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginTop: 10 }}>
            <Text>{item.patient} - {item.drug}</Text>
          </View>
        )}
      />
    </View>
  );
}
