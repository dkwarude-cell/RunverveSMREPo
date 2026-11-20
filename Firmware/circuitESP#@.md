# ESP32 Vibration Motor Circuit

This circuit connects the 1.5–5 V DC vibration motor to the ESP32 safely through a MOSFET. The ESP32 GPIO pin controls the MOSFET; it does not power the motor directly.

## Parts to purchase

- 1 × logic-level N-channel MOSFET: **AO3400A** (recommended) or another 3.3 V logic-level MOSFET
- 1 × flyback diode: **1N5819** (preferred) or **1N4007**
- 1 × 100 ohm resistor for the MOSFET gate
- 1 × 10 kohm resistor from the gate to ground
- 1 × regulated **3.0–3.3 V motor supply** or a suitable 2 × AA battery holder
- 1 × 100 uF electrolytic capacitor across the motor supply
- 1 × 0.1 uF ceramic capacitor across the motor supply
- Breadboard jumper wires
- Heat-shrink tubing or electrical insulation
- Solder, soldering iron, and optionally a small perfboard for the final permanent circuit

Use a motor supply within the motor's specified 1.5–5 V range. Do not use an unregulated supply that can exceed 5 V.

## Circuit diagram

```text
                         External motor supply
                         3.0–3.3 V recommended

             + --------------------+--------------------+
             |                     |                    |
             |                 Motor wire 1         Diode cathode
             |                     |                 (striped end)
             |                  VIBRATION                 |
             |                   MOTOR                    |
             |                     |                    |
             |                 Motor wire 2        Diode anode
             |                     |                    |
             |                     +---------- Drain (D)
             |                                  Q1
             |                              N-MOSFET
             |                                  Source (S)
             |                                      |
             +--------------------------------------+---- ESP32 GND
                                                    |
ESP32 D25 / GPIO25 ---- 100 ohm ---- Gate (G)       |
                                      |             |
                                      +-- 10 kohm --+
                                      |
                                     GND

Place the 100 uF electrolytic capacitor and 0.1 uF ceramic capacitor
between the external motor supply + and GND, close to the motor/MOSFET.
```

## Breadboard connections

1. Keep the ESP32 on the breadboard.
2. Connect ESP32 **D25/GPIO25** to one end of the 100 ohm resistor.
3. Connect the other end of the 100 ohm resistor to the MOSFET **Gate (G)**.
4. Connect the 10 kohm resistor between Gate (G) and the ground rail.
5. Connect MOSFET **Source (S)** to the common ground rail.
6. Connect MOSFET **Drain (D)** to the motor's negative wire.
7. Connect the motor's positive wire to the external motor supply positive.
8. Connect the external motor supply negative to the ESP32 **GND** rail.
9. Connect the diode across the motor:
   - striped end/cathode to motor positive
   - unstriped end/anode to motor negative
10. Connect the 100 uF and 0.1 uF capacitors across the external motor supply:
    - capacitor positive to supply positive
    - capacitor negative to ground

The motor's two wires may be swapped; swapping them only changes polarity. For this one-direction vibration motor, either polarity is acceptable.

## MOSFET pin warning

Do not assume the MOSFET pin order. Check the exact part number and datasheet before wiring **G**, **D**, and **S**. AO3400A boards and loose TO-220 MOSFETs can have different physical pin layouts.

## Soldering for a permanent build

- Solder the 100 ohm resistor in series with the wire from GPIO25 to Gate.
- Solder the 10 kohm resistor between Gate and ground.
- Solder the diode directly across the motor wires, observing its polarity.
- Solder the capacitors across the motor supply rails.
- Use heat-shrink tubing on all exposed motor and supply connections.
- Keep the motor current wiring short and separate from the GPIO signal wire.
- Keep the ESP32 connected to the laptop by USB only while testing; do not let the motor supply feed the ESP32 3V3 pin.

## Firmware and Bluetooth test

The existing firmware uses **GPIO25** for motor PWM and the motor characteristic:

```text
7d2f0003-4f4a-4b2a-9c2b-6e8f1d2a0001
```

Write two bytes to that characteristic:

```text
01 FF   motor enabled at full PWM
01 64   motor enabled at about 39% PWM
00 00   motor off
```

Test the motor briefly at low PWM first. Do not attach the motor to a person until the circuit is insulated, mechanically secure, and electrically tested.

## Do not do these things

- Do not connect the bare motor directly between GPIO25 and GND.
- Do not connect the motor to the ESP32 3V3 pin.
- Do not connect the motor supply positive to GPIO25.
- Do not omit the common ground between the external motor supply and the ESP32.
- Do not rely on the motor voltage rating alone; confirm the supply and motor current are suitable.
