# Firebase Setup — Clean Start

The app starts with **no pre-loaded data**. All data is entered directly through the app and stored in Firestore in real time.

---

## Step 1 — Create Your First User (Super Admin)

You need one account in Firebase Auth to log in. Do this once in the Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Authentication → Users → Add user**
2. Enter your email and password

Then in **Firestore → users collection**, click **Add document**:
- Document ID: use the **UID** shown next to your user in the Auth console
- Add these fields:

| Field | Value |
|---|---|
| `id` | *(same UID as document ID)* |
| `name` | Your full name |
| `email` | Your email |
| `role` | `superadmin` |
| `createdAt` | *(today's date as ISO string, e.g. `2026-03-18T00:00:00Z`)* |

3. Log into the app with that email and password.
4. Once logged in, use **User Management → Add User** to create any additional users (Admin, Technicians). The app creates both the Firebase Auth account and the Firestore profile automatically.

---

## Step 2 — Firestore Security Rules

In **Firestore → Rules**, set:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 3 — Firebase Authentication Settings

In **Authentication → Sign-in method**, make sure **Email/Password** is enabled.

---

## How the App Works

- **No seed data** — the app starts empty. Add clients, machines, interventions etc. through the UI.
- **Real-time sync** — all changes appear instantly across tabs/browsers via Firestore `onSnapshot` listeners.
- **Firebase Auth** — manages all login/logout. Passwords are never stored in Firestore.
- **User creation** — when you add a user in the app, it creates both a Firebase Auth account and a Firestore profile using the same UID.
