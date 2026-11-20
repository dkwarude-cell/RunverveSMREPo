#include <Arduino.h>
#include <BLE2902.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

namespace {
constexpr char DEVICE_NAME[] = "SmartHeal ESP32";
constexpr char SERVICE_UUID[] = "7d2f0001-4f4a-4b2a-9c2b-6e8f1d2a0001";
constexpr char PULSE_UUID[] = "7d2f0002-4f4a-4b2a-9c2b-6e8f1d2a0001";
constexpr char MOTOR_UUID[] = "7d2f0003-4f4a-4b2a-9c2b-6e8f1d2a0001";

constexpr uint8_t PULSE_PIN = 34;
constexpr uint8_t MOTOR_PIN = 25;
constexpr uint16_t SAMPLE_INTERVAL_MS = 10;
// 2 notifications a second is plenty for a BPM read-out, and halves the Bluetooth
// traffic the phone has to process.
constexpr uint16_t NOTIFY_INTERVAL_MS = 500;
constexpr uint16_t MIN_BEAT_INTERVAL_MS = 300;
constexpr uint16_t MAX_BEAT_INTERVAL_MS = 2000;
// Safety watchdog: the motor stops unless the app keeps renewing the command. A crash,
// a dropped link or a closed app can then never leave it running against the skin.
constexpr uint32_t MOTOR_TIMEOUT_MS = 8000;

BLECharacteristic *pulseCharacteristic = nullptr;
bool deviceConnected = false;
bool motorEnabled = false;
uint8_t motorPwm = 0;
uint8_t motorMode = 0;         // 0 = continuous, 1 = pulsed (on/off bursts)
uint16_t motorPeriodMs = 500;  // burst on/off time when pulsed
bool motorPulseOn = false;
uint32_t lastMotorToggleAt = 0;
uint32_t lastMotorCommandAt = 0;
// Single place that touches the MOSFET gate. Everything goes through analogWrite so the
// pin stays attached to one LEDC channel: mixing in pinMode/digitalWrite detaches it, and
// re-attaching on every change (every burst in pulsed mode) destabilises the BLE stack.
// A 0% duty is an actively driven LOW, not a floating pin, so it stops the motor properly.
void driveMotor(uint8_t pwm) {
  analogWrite(MOTOR_PIN, pwm);
}

void stopMotor() {
  motorEnabled = false;
  motorPwm = 0;
  motorMode = 0;
  motorPulseOn = false;
  driveMotor(0);
}
uint16_t pulseBpm = 0;
uint16_t pulseSignal = 0;
uint32_t lastSampleAt = 0;
uint32_t lastNotifyAt = 0;
uint32_t lastBeatAt = 0;
bool aboveThreshold = false;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *) override {
    deviceConnected = true;
    Serial.println("[BLE] central connected");
  }

  void onDisconnect(BLEServer *server) override {
    deviceConnected = false;
    stopMotor();
    Serial.println("[BLE] central disconnected, motor off, advertising again");
    server->startAdvertising();
  }
};

class MotorCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *characteristic) override {
    String value = characteristic->getValue();
    Serial.printf("[MOTOR] write received, %u byte(s):", value.length());
    for (size_t i = 0; i < value.length(); ++i) {
      Serial.printf(" %02X", static_cast<uint8_t>(value[i]));
    }
    Serial.println();
    if (value.length() < 2) {
      Serial.println("[MOTOR] payload too short, expected [enabled, pwm, mode?, period?] - ignored");
      return;
    }

    motorEnabled = value[0] != 0;
    motorPwm = static_cast<uint8_t>(value[1]);
    motorMode = value.length() >= 3 ? static_cast<uint8_t>(value[2]) : 0;
    // Byte 3: pulsed-burst on/off time in 100 ms units (1-255 -> 100 ms-25.5 s).
    motorPeriodMs = value.length() >= 4 && value[3] != 0
                        ? static_cast<uint16_t>(static_cast<uint8_t>(value[3])) * 100
                        : 500;
    motorPulseOn = true;
    lastMotorToggleAt = millis();
    lastMotorCommandAt = millis();
    driveMotor(motorEnabled ? motorPwm : 0);
    Serial.printf("[MOTOR] enabled=%d pwm=%u mode=%u period=%ums -> pin %u\n", motorEnabled,
                  motorPwm, motorMode, motorPeriodMs, MOTOR_PIN);
  }
};

// Runs the pulsed pattern and the safety watchdog.
void updateMotorPattern() {
  if (!motorEnabled) return;

  const uint32_t now = millis();
  if (now - lastMotorCommandAt > MOTOR_TIMEOUT_MS) {
    stopMotor();
    Serial.println("[MOTOR] watchdog timeout, no command renewed - motor stopped");
    return;
  }

  if (motorMode != 1) return;
  if (now - lastMotorToggleAt < motorPeriodMs) return;

  lastMotorToggleAt = now;
  motorPulseOn = !motorPulseOn;
  driveMotor(motorPulseOn ? motorPwm : 0);
}

void updatePulse() {
  pulseSignal = static_cast<uint16_t>(analogRead(PULSE_PIN));
  const uint32_t now = millis();
  const uint16_t threshold = 2100;
  const bool beat = pulseSignal >= threshold;

  if (beat && !aboveThreshold && lastBeatAt != 0) {
    const uint32_t interval = now - lastBeatAt;
    if (interval >= MIN_BEAT_INTERVAL_MS && interval <= MAX_BEAT_INTERVAL_MS) {
      pulseBpm = static_cast<uint16_t>(60000UL / interval);
    }
  }
  if (beat && !aboveThreshold) lastBeatAt = now;
  aboveThreshold = beat;
}

void notifyPulse() {
  if (!deviceConnected || pulseCharacteristic == nullptr) return;

  const uint8_t payload[] = {
      static_cast<uint8_t>(pulseBpm & 0xFF),
      static_cast<uint8_t>((pulseBpm >> 8) & 0xFF),
      static_cast<uint8_t>(pulseSignal & 0xFF),
      static_cast<uint8_t>((pulseSignal >> 8) & 0xFF),
  };
  pulseCharacteristic->setValue(payload, sizeof(payload));
  pulseCharacteristic->notify();
}

// Serial test console, so the motor and sensor can be checked over USB without
// the phone or Bluetooth in the way.
//   m<0-255>  drive the motor at that PWM        s  print the raw sensor reading
//   w         sweep the PWM to find the start-up threshold
void handleSerialCommand() {
  if (!Serial.available()) return;

  const String line = Serial.readStringUntil('\n');
  const char command = line.length() > 0 ? line[0] : 0;

  if (command == 'm') {
    const int pwm = constrain(line.substring(1).toInt(), 0, 255);
    motorEnabled = pwm > 0;
    motorMode = 0;
    motorPwm = static_cast<uint8_t>(pwm);
    lastMotorCommandAt = millis();
    driveMotor(static_cast<uint8_t>(pwm));
    Serial.printf("[TEST] motor pwm=%d (%d%%)\n", pwm, (pwm * 100) / 255);
  } else if (command == 's') {
    Serial.printf("[TEST] sensor pin %u raw=%d\n", PULSE_PIN, analogRead(PULSE_PIN));
  } else if (command == 'w') {
    Serial.println("[TEST] sweeping motor PWM, 2 s per step");
    for (int pwm = 40; pwm <= 255; pwm += 30) {
      Serial.printf("[TEST] step pwm=%d (%d%%)\n", pwm, (pwm * 100) / 255);
      driveMotor(static_cast<uint8_t>(pwm));
      delay(2000);
    }
    stopMotor();
    Serial.println("[TEST] sweep finished, motor off");
  }
}
}  // namespace

void setup() {
  // Hold the MOSFET gate low before anything else, so the motor cannot run
  // during start-up while Serial and the BLE stack come up.
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  Serial.begin(115200);
  pinMode(PULSE_PIN, INPUT);
  stopMotor();

  BLEDevice::init(DEVICE_NAME);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);
  pulseCharacteristic = service->createCharacteristic(
      PULSE_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  pulseCharacteristic->addDescriptor(new BLE2902());

  BLECharacteristic *motorCharacteristic =
      service->createCharacteristic(MOTOR_UUID, BLECharacteristic::PROPERTY_WRITE);
  motorCharacteristic->setCallbacks(new MotorCallbacks());

  service->start();
  BLEAdvertising *advertising = BLEDevice::getAdvertising();
  advertising->addServiceUUID(SERVICE_UUID);
  advertising->setScanResponse(true);
  advertising->start();
  Serial.println("[BOOT] BLE advertising as 'SmartHeal ESP32'");
}

void loop() {
  const uint32_t now = millis();
  if (now - lastSampleAt >= SAMPLE_INTERVAL_MS) {
    lastSampleAt = now;
    updatePulse();
  }
  if (now - lastNotifyAt >= NOTIFY_INTERVAL_MS) {
    lastNotifyAt = now;
    notifyPulse();
  }
  updateMotorPattern();
  handleSerialCommand();
}
