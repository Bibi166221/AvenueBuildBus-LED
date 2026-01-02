/**
 * Simple GPS Test (ESP8266)
 * 
 * Objective: Verify if the pin connections and GPS module are working correctly.
 * Output: Raw GPS data to the Serial Monitor (115200 baud).
 * 
 * Wiring (ESP8266):
 * - VCC -> 3.3V/5V
 * - GND -> GND
 * - GPS TX -> D2 (GPIO 4)
 * - GPS RX -> D1 (GPIO 5)
 */

#include <SoftwareSerial.h>
#include <TinyGPSPlus.h>

// Pins
static const int RXPin = 4; // Connect GPS TX here
static const int TXPin = 5; // Connect GPS RX here
static const uint32_t GPSBaud = 9600;

// Objects
TinyGPSPlus gps;
SoftwareSerial ss(RXPin, TXPin);

void setup() {
  Serial.begin(115200);
  ss.begin(GPSBaud);

  Serial.println("\n\n--- Simple GPS Hardware Test ---");
  Serial.println("Listening for GPS data on D2(RX) / D1(TX)...");
  Serial.println("Go outside for better reception!");
}

void loop() {
  // Dispatch incoming characters
  while (ss.available() > 0) {
    if (gps.encode(ss.read())) {
      displayInfo();
    }
  }

  // Detect if no data is coming in for 5 seconds
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("No GPS detected: check wiring.");
    while (true);
  }
}

void displayInfo() {
  Serial.print("Location: "); 
  if (gps.location.isValid()) {
    Serial.print(gps.location.lat(), 6);
    Serial.print(",");
    Serial.print(gps.location.lng(), 6);
  } else {
    Serial.print("INVALID (Wait for fix)");
  }
  
  Serial.print("  Date/Time: ");
  if (gps.date.isValid()) {
    Serial.print(gps.date.month());
    Serial.print("/");
    Serial.print(gps.date.day());
    Serial.print("/");
    Serial.print(gps.date.year());
  } else {
    Serial.print("INVALID");
  }

  Serial.println();
}
