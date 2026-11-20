## >> Project Demo

<div align="center">

https://github.com/user-attachments/assets/0eae6f4f-f7a9-485a-8d49-5fbba652f15b

</div>

## >> SmartHeal Companion Application

## Requirements
- Node.js 22.11 or newer
- Android Studio (emulator or a phone with USB debugging on)
- `Backend/service-account.json` (Firebase service account key)

## 1. Install (one time)

```
cd Backend
npm install

cd ../Frontend
npm install
```

## 2. Run (3 terminals)

**Terminal 1 – Backend**
```
cd Backend
npm run dev
```
Wait for `server is running on port 3001`.

**Terminal 2 – Metro** (start the emulator / connect the phone first)
```
cd Frontend
adb reverse tcp:3001 tcp:3001
adb reverse tcp:8081 tcp:8081
npx react-native start --reset-cache
```

**Terminal 3 – App**
```
cd Frontend
npx react-native run-android
```

## Notes
- Run `adb reverse tcp:3001 tcp:3001` again every time the emulator restarts or the phone is reconnected (otherwise login shows "Network error").
- The AI Guidance tab uses the Cloud Run backend directly; the first analysis can take 30–40 s while the server wakes up.
- If the build fails: `cd Frontend/android` → `gradlew clean` → `cd ..` → `npx react-native run-android`.
