# SmartHeal App

## What SmartHeal is
SmartHeal is an AI-guided recovery app by Runverve that works with the SmartHeal wearable therapy device. It helps people recover from muscle and joint pain at home. One photo and a few questions give a personal therapy plan using heat, vibration and TENS, checked by AI for safety. It was built as a final-year Computer Engineering project at K. K. Wagh Institute of Engineering Education and Research (KKWIEER), Nashik, sponsored by Runverve.

## The SmartHeal wearable device
- A wrap-around wearable that delivers three therapies: **heat** (built-in heater), **vibration** (small motors) and **TENS** (electrical stimulation pads).
- It connects to the app over **Bluetooth Low Energy (BLE)**.
- The app can show live **heart rate** and **battery level** from the device.

## App navigation - the dock tabs
The bottom dock has five tabs:
- **Home** - your dashboard: today's therapy rings (heat, vibration, TENS minutes vs goal), device status and shortcuts.
- **AI Scan** - AI injury analysis and personal therapy plan.
- **Device** - connect the SmartHeal wearable over Bluetooth and see live readings.
- **Stats** - your activity and progress charts.
- **Assistant** - this chatbot: ask health and therapy questions, or upload a medical report for an explanation.
The menu button (top-left, three lines) opens My Profile, Settings, Help & Support, Privacy & Terms, About SmartHeal and Log out. Tapping your avatar (top-right) opens your profile.

## AI Scan feature (injury analysis)
- Open the **AI Scan** tab, take or upload a clear photo of the painful or injured area, and answer a few short questions about you and your pain.
- AI models analyse the photo: a **ResNet50** deep-learning model identifies the **body part** and the **wound type** (for example bruise, cut, abrasion, burn or no wound).
- A **Random Forest** machine-learning model recommends **heat, vibration and TENS settings** from your body details and pain profile.
- A **Gemini AI agent** then double-checks those predictions against your photo and answers, judges swelling and severity, and gives a final easy-to-read report: what it sees, possible causes, severity (mild / moderate / severe), self-care steps, the exact therapy settings for your device, and warning signs.
- Best for: "Which therapy should I use?", "What settings are right for me?", or checking a visible injury.
- The AI report is guidance only - it is not a medical diagnosis.

## Device tab (Bluetooth)
- Open the **Device** tab, make sure Bluetooth is on, and tap scan. Your SmartHeal device appears in the list - tap it to connect.
- Android asks for Bluetooth (and on older phones location) permission the first time - allow it.
- Once connected you see live **heart rate** and **battery**. A small green dot on the Device tab icon shows it is connected.
- If the device doesn't show up: keep it close, make sure it's switched on and charged, turn phone Bluetooth off and on, and scan again.

## Stats tab (progress)
- Shows today's therapy rings, total therapy time, sessions, day streak and average heart rate.
- Week and Month views with daily therapy-minute bars (tap a bar to see that day), therapy split (heat / vibration / TENS), a pain-level trend line, and recent sessions.
- Daily goals: heat 20 min, vibration 15 min, TENS 15 min (50 min total).
- Note: until the wearable logs real sessions to the app, Stats shows sample data.

## Assistant tab (chat and medical reports)
- Ask anything about heat, vibration and TENS therapy, pain, injuries, recovery or how to use the app.
- **Medical report upload**: tap the report button in the Assistant tab and choose a **PDF** or an **image** (JPG, PNG, WEBP) of a medical report - blood tests, X-ray, MRI or CT reports, prescriptions or doctor's notes.
- The assistant reads the whole report and explains it in simple words: the overall summary, any values that are high or low compared to the normal range, what they may mean, whether heat, vibration or TENS look safe given the results, and what to ask your doctor.
- You can then ask follow-up questions about the same report in the chat.
- Tips: use the original PDF if you have it, or a clear, well-lit photo of each page with all text visible. Large files (over about 10 MB) may not upload.
- The explanation is for understanding only - always discuss your report with your doctor.

## Account, profile and settings
- **Sign up** with email (verified with a one-time code sent to your email) or **Google Sign-In**. New users complete a short 3-step setup: basic info, medical history and goals.
- **My Profile** - view and edit your name, age, gender, height, weight, activity level, conditions and goals.
- **Settings** - **Dark mode** (true black AMOLED theme), **AI warm-up** (gets the AI Scan ready faster), change or reset password, and log out.
- Forgot password: on the login screen tap "Forgot password", enter your email, then the code sent to you, then a new password.

## Privacy and safety in SmartHeal
- Accounts and profiles are stored securely with Firebase.
- SmartHeal gives AI-based guidance for information only. It is not a medical device diagnosis and does not replace a doctor or physiotherapist.

## Which feature should I use?
- "What therapy or settings should I use?" -> **AI Scan** tab.
- "I hurt myself / there's a bruise or wound" -> **AI Scan** for guidance, and see a doctor for anything serious.
- "How do I connect my device?" or "What's my heart rate?" -> **Device** tab.
- "Am I improving?" or "How much therapy did I do?" -> **Stats** tab.
- "Change my details" -> menu -> **My Profile**. "Dark mode" -> menu -> **Settings**.
- "What does my blood test / X-ray / MRI report mean?" -> **Assistant** tab -> upload the report.
- General questions about pain, therapy and recovery -> ask the **Assistant** (this chat).