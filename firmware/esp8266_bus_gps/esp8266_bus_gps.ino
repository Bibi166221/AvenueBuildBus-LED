/* 
 * Dependencies (Install via Arduino Library Manager):
 * 1. TinyGPSPlus by Mikal Hart
 * 2. Firebase Arduino Client Library for ESP8266 and ESP32 by Mobizt
 */

#include <time.h>
#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>

// ==========================================
// CONFIGURATION
// ==========================================

// WiFi Credentials
#define WIFI_SSID "Ryu"
#define WIFI_PASSWORD "123456789"

// Firebase Config
#define API_KEY "AIzaSyAQNkW3SqJZxeXhtsEDn-2ImbaRs7huL_A"
#define PROJECT_ID "busweb-5980a"

// Firestore Document Path
#define FIRESTORE_PROJECT_ID "busweb-5980a"
#define DOCUMENT_PATH "artifacts/busweb-5980a/public/data/bus-status/166"

// GPS Pins (SoftwareSerial)
#define GPS_RX_PIN 4 // D2 (Connect to GPS TX)
#define GPS_TX_PIN 5 // D1 (Connect to GPS RX)

// ==========================================


TinyGPSPlus gps;
SoftwareSerial SerialGPS(GPS_RX_PIN, GPS_TX_PIN);

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
const long sendInterval = 5000; 


// Callback to print the token generation status
void tokenStatusCallback(TokenInfo info) {
    String output = "Token Info: type = " + String((int)info.type) + ", status = " + String((int)info.status);
    if (info.status == token_status_error) {
        output += ", error = (check main loop reason)";
    } else {
        output += ", ready = " + String(info.status == token_status_ready);
    }
    Serial.println(output);
}

void setup() {
  Serial.begin(115200);
  
  // GPS Serial Init
  SerialGPS.begin(9600);
  Serial.println("\nStarting Bus GPS Tracker (ESP8266)...");

  // WiFi Connect
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // --- TIME SYNC (Required for SSL/Auth) ---
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("Syncing Time");
  while (time(nullptr) < 100000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nTime Synced!");

  // Firebase Init
  config.api_key = API_KEY;
  
  // Anonymous sign-in
  auth.user.email = ""; 
  auth.user.password = "";

  // The library often REQUIRES this to be set, even for Firestore-only usage.
  config.database_url = "https://busweb-5980a.firebaseio.com";

  // FIX: Enable Test Mode to bypass anonymous auth complexity if token fails
  // This generates a dummy token which works if Rules are "allow read, write: if true;"
  config.signer.test_mode = true;

  // Assign the callback function for the long running token generation task
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  // 1. Parse GPS Data (feed the object constantly)
  while (SerialGPS.available() > 0) {
    gps.encode(SerialGPS.read());
  }

  // 2. Serial Monitor Debugging (Show every 1 second)
  // This helps you see if the GPS is working WITHOUT waiting for the 5s upload
  static unsigned long lastPrintMillis = 0;
  if (millis() - lastPrintMillis > 1000) {
    lastPrintMillis = millis();
    
    Serial.print("[GPS Debug] Sats: ");
    Serial.print(gps.satellites.value());
    
    if (gps.location.isValid()) {
      Serial.printf(" | Lat: %.6f, Lng: %.6f | Speed: %.1f km/h\n", 
        gps.location.lat(), 
        gps.location.lng(), 
        gps.speed.kmph());
    } else {
      Serial.print(" | Status: Searching for Signal... (Uptime: ");
      Serial.print(millis() / 1000);
      Serial.println("s)");
    }
  }

  // 3. Send to Firebase (Every 5 seconds)
  if (millis() - sendDataPrevMillis > sendInterval) {
    sendDataPrevMillis = millis();

    if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
      
      if (gps.location.isValid()) {
        double lat = gps.location.lat();
        double lng = gps.location.lng();
        
        Serial.print(">>> UPLOADING to Firebase... ");

        // Construct Data
        FirebaseJson updateData;
        updateData.set("fields/gps_lat/doubleValue", lat);
        updateData.set("fields/gps_lng/doubleValue", lng);
            
        // Patch Document
        String jsonString;
        updateData.toString(jsonString);

        if (Firebase.Firestore.patchDocument(&fbdo, FIRESTORE_PROJECT_ID, "", DOCUMENT_PATH, jsonString.c_str(), "gps_lat,gps_lng")) {
             Serial.println("SUCCESS ✅");
        } else {
             Serial.printf("FAILED TO PATCH (%s) - Attempting Create...\n", fbdo.errorReason().c_str());
             // Fallback: If document doesn't exist, Create it!
             // We need a slightly different structure for create (full document)
             if (Firebase.Firestore.createDocument(&fbdo, FIRESTORE_PROJECT_ID, "", DOCUMENT_PATH, jsonString.c_str())) {
                Serial.println("CREATED NEW DOC ✅");
             } else {
                Serial.printf("CREATE FAILED ❌ (%s)\n", fbdo.errorReason().c_str());
             }
        }

      }
    } else {
       Serial.print("Skipping Upload: ");
       if (WiFi.status() != WL_CONNECTED) {
          Serial.print("WiFi NOT Connected (Status: ");
          Serial.print(WiFi.status());
          Serial.println(")");
       } else if (!Firebase.ready()) {
          Serial.println("Firebase NOT Ready!");
          // Try to give a hint why
          Serial.println(fbdo.errorReason().c_str());
       }
    }
  }
}
