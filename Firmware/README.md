# SmartHeal ESP32 firmware

## Arduino IDE setup

1. Install the latest Arduino IDE 2.x.
2. Open **File > Preferences** and add this board manager URL:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Open **Tools > Board > Boards Manager**, search for **esp32**, and install **esp32 by Espressif Systems**.
4. Open `SmartHealESP32/SmartHealESP32.ino`.
5. Select **Tools > Board > esp32 > ESP32 Dev Module** (or the exact board used by the hardware).
6. Select the ESP32 serial port under **Tools > Port**.
7. Click **Verify**, then **Upload**. Open Serial Monitor at `115200` if needed.

## Wiring

- Pulse sensor signal -> GPIO 34
- Pulse sensor VCC -> 3.3 V
- Pulse sensor GND -> GND
- Motor driver input -> GPIO 25
- Connect the motor through a transistor/MOSFET and a separate suitable motor supply. Do not drive a motor directly from an ESP32 GPIO.
- Connect the motor supply ground to ESP32 GND.

The pulse characteristic sends four little-endian bytes every 250 ms:

`[BPM low, BPM high, signal low, signal high]`

The motor characteristic accepts two bytes from the app:

`[enabled (0 or 1), PWM intensity (0-255)]`

The app's intensity control converts its 0-100% value to the PWM byte.

## App connection flow

1. Upload the sketch and leave the ESP32 powered.
2. Start the SmartHeal Android app and open **Device**.
3. Allow the Android Bluetooth permissions when prompted.
4. Tap **Scan for devices**, select **SmartHeal ESP32**, and tap **Connect**.
5. Confirm that **Pulse sensor** shows BPM and use the **Vibration motor** switch and +/- controls.

The app scans for the service UUID above, so the ESP32 must advertise the service and must not be in deep sleep. Android Bluetooth settings pairing is not required; connection is made from the SmartHeal app.
