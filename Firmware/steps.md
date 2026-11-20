# Step-by-Step ESP32 Vibration Motor Circuit

This guide connects the 1.5–5 V vibration motor to the ESP32 using an external motor supply and an N-channel MOSFET. The MOSFET protects the ESP32 from the motor current and electrical noise.

## Parts required

Buy these parts before assembling:

1. ESP32 Dev Module
2. 1.5–5 V DC vibration motor
3. Logic-level N-channel MOSFET, such as **AO3400A**
4. 1N5819 diode, or 1N4007 if 1N5819 is unavailable
5. 100 ohm resistor
6. 10 kohm resistor
7. Regulated 3.0–3.3 V motor power supply, or a battery holder that stays between 1.5 V and 5 V
8. 100 uF electrolytic capacitor, rated for at least 6.3 V
9. 0.1 uF ceramic capacitor
10. Breadboard and jumper wires
11. Soldering iron, solder, and heat-shrink tubing
12. Multimeter, recommended

The motor supply must not exceed 5 V. Do not use a 9 V battery directly.

## Identify the connections

Use these names while wiring:

- **GPIO25/D25:** ESP32 motor-control output
- **GND:** ESP32 ground
- **Motor +:** one motor wire
- **Motor -:** the other motor wire
- **Gate (G):** MOSFET control pin
- **Drain (D):** MOSFET motor-output pin
- **Source (S):** MOSFET ground pin

Check the exact MOSFET datasheet before wiring. Do not assume that every MOSFET has the same physical pin order.

## Breadboard assembly

### Step 1: Set up the ESP32

1. Place the ESP32 across the center gap of the breadboard.
2. Connect one ESP32 **GND** pin to the breadboard ground rail.
3. Leave the USB cable disconnected while building the circuit.

### Step 2: Install the MOSFET

1. Insert the MOSFET so its three pins are in separate breadboard rows.
2. Identify its **Gate**, **Drain**, and **Source** pins from its datasheet.
3. Do not connect any power until the three MOSFET pins have been identified.

### Step 3: Wire the MOSFET source

Connect:

```text
MOSFET Source (S) -> breadboard ground rail
```

The breadboard ground rail must also connect to the ESP32 GND and external motor-supply negative.

### Step 4: Wire the MOSFET gate

1. Connect one end of the **100 ohm resistor** to ESP32 **GPIO25/D25**.
2. Connect the other end of the 100 ohm resistor to the MOSFET **Gate (G)**.
3. Connect one end of the **10 kohm resistor** to the same breadboard row as the MOSFET Gate.
4. Connect the other end of the 10 kohm resistor to the ground rail.

The finished gate wiring is:

```text
ESP32 D25/GPIO25 -> 100 ohm resistor -> MOSFET Gate (G)
MOSFET Gate (G)  -> 10 kohm resistor -> GND
```

### Step 5: Connect the motor

1. Connect one motor wire to the positive terminal of the external motor supply.
2. Connect the other motor wire to the MOSFET **Drain (D)**.
3. If the motor rotates or vibrates in an undesired direction, swap the two motor wires.

The motor wiring is:

```text
Motor supply positive -> Motor wire 1
Motor wire 2          -> MOSFET Drain (D)
```

### Step 6: Connect the motor supply ground

Connect all three points together:

```text
External motor-supply negative -> breadboard ground rail
ESP32 GND                      -> breadboard ground rail
MOSFET Source (S)              -> breadboard ground rail
```

This common ground is required for GPIO25 to control the MOSFET correctly.

### Step 7: Add the protection diode

Place the diode directly across the two motor wires:

```text
Diode striped end/cathode -> Motor wire 1 / motor-supply positive
Diode unstriped end/anode -> Motor wire 2 / MOSFET Drain
```

The stripe on a 1N5819 or 1N4007 identifies the cathode. Do not reverse this diode.

### Step 8: Add the capacitors

Connect both capacitors between the external motor-supply positive and ground:

```text
100 uF capacitor positive lead -> motor-supply positive
100 uF capacitor negative lead -> ground rail

0.1 uF ceramic capacitor lead 1 -> motor-supply positive
0.1 uF ceramic capacitor lead 2 -> ground rail
```

The longer lead on an electrolytic capacitor is normally positive. The marked stripe is normally the negative side. Confirm the markings before connecting it.

## Complete connection list

Before powering the circuit, verify every connection:

```text
ESP32 D25/GPIO25       -> 100 ohm resistor -> MOSFET Gate
MOSFET Gate            -> 10 kohm resistor -> GND
MOSFET Source          -> GND
MOSFET Drain           -> Motor wire 2
Motor wire 1           -> External supply positive
External supply        -> 3.0–3.3 V recommended, never above 5 V
External supply negative -> ESP32 GND
Diode cathode/striped  -> Motor wire 1 / supply positive
Diode anode/unstriped  -> Motor wire 2 / MOSFET Drain
100 uF positive        -> supply positive
100 uF negative        -> GND
0.1 uF side 1          -> supply positive
0.1 uF side 2          -> GND
```
    
## First power test

1. Do not attach the motor to a person.
2. Check that the motor supply is within 1.5–5 V.
3. Check that the motor supply positive is not connected to GPIO25.
4. Check that the motor supply positive is not connected to ESP32 3V3.
5. Use a multimeter to check that there is no short circuit between supply positive and ground.
6. Connect the ESP32 USB cable.
7. Power the external motor supply.
8. Start with a low PWM value from the Bluetooth app.
9. Stop immediately if the MOSFET, motor, wiring, or ESP32 becomes hot.

## Bluetooth motor test

The firmware uses this motor characteristic:

```text
7d2f0003-4f4a-4b2a-9c2b-6e8f1d2a0001
```

Write two raw bytes to it:

```text
01 40  -> motor on at low power
01 80  -> motor on at medium power
01 FF  -> motor on at maximum power
00 00  -> motor off
```

Test `01 40` first. Do not start with maximum power.

## Permanent soldering

After the breadboard circuit works:

1. Disconnect USB and the motor supply.
2. Move the circuit to perfboard.
3. Solder the MOSFET in place.
4. Solder the 100 ohm resistor between the GPIO25 wire and Gate.
5. Solder the 10 kohm resistor between Gate and ground.
6. Solder the motor wires to the Drain and motor-supply-positive wiring.
7. Solder the diode directly across the motor wires with the striped end toward positive.
8. Solder the capacitors across motor-supply-positive and ground.
9. Solder the external-supply-negative wire to the ESP32 ground wire.
10. Cover every exposed solder joint with heat-shrink tubing.
11. Inspect for solder bridges and loose wires.
12. Test again with a multimeter before applying power.

## Safety rules

- Never connect the bare motor directly to GPIO25.
- Never power the motor from ESP32 3V3.
- Never exceed 5 V on the motor.
- Never omit the diode.
- Never omit the common ground.
- Never wear the motor during the first electrical test.
- Confirm MOSFET Gate, Drain, and Source from the exact part datasheet.
