import React, { useState, useEffect } from "react";
import { SafeAreaView, Text, View, StyleSheet, Alert, Button } from "react-native";
import { Camera, useCameraDevices, useCodeScanner, getCameraDevice } from "react-native-vision-camera";

const Scanner: React.FC = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [scanned, setScanned] = useState(false);
  const devices = useCameraDevices();
  const device = getCameraDevice(devices, "back");

  const getPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    if (cameraPermission === "denied") {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera permissions in settings.",
        [{ text: "OK" }]
      );
    }
    setHasPermission(cameraPermission === "granted");
  };

  useEffect(() => {
    getPermissions();
  }, []);

 const scanner = useCodeScanner({
     codeTypes: ["qr", "ean-13", "code-128"],
     onCodeScanned: (codes) => {
       if (codes.length > 0 && !scanned) {
         setScanned(true);
         const scannedCode = codes[0].value;
         Alert.alert("Scanned!", `Barcode: ${scannedCode}`, [
           {
             text: "Go to Store",
             onPress: () => navigation?.navigate("StoreDetails", { barcodeId: scannedCode }),
           },
         ]);
       }
     },
   });

   if (!device) return <Text style={styles.infoText}>No camera found. Please restart the app.</Text>;
   if (!hasPermission) return <Text style={styles.infoText}>Camera permission is required</Text>;

   return (
     <View style={styles.container}>
       <Camera style={styles.camera} device={device} isActive={!scanned} codeScanner={scanner} />

       {/* Overlay */}
       <View style={styles.overlay}>
         <View style={styles.scannerBox} />
         <Text style={styles.instructionText}>Align the barcode within the box</Text>
       </View>

     </View>
   );
 };

 const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: "#000" },
   camera: { flex: 1 },
   overlay: {
     position: "absolute",
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     justifyContent: "center",
     alignItems: "center",
     backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay
   },
   scannerBox: {
     width: 250,
     height: 250,
     borderWidth: 3,
     borderColor: "#00FF00",
     borderRadius: 10,
     backgroundColor: "transparent",
   },
   instructionText: {
     marginTop: 20,
     color: "#fff",
     fontSize: 18,
     fontWeight: "bold",
     textAlign: "center",
   },
   rescanButton: {
     position: "absolute",
     bottom: 40,
     alignSelf: "center",
     backgroundColor: "#00FF00",
     paddingVertical: 12,
     paddingHorizontal: 20,
     borderRadius: 8,
   },
   rescanText: {
     color: "#000",
     fontSize: 16,
     fontWeight: "bold",
   },
   infoText: { flex: 1, textAlign: "center", fontSize: 18, color: "#fff", marginTop: 50 },
 });

export default Scanner;
