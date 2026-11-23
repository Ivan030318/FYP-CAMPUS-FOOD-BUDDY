# Campus Food Buddy

A mobile app that helps Multimedia University (MMU) students find a companion to eat with
on campus, based on shared food preferences, available meal times and dining location.
Built with **React Native (Expo)** and **Firebase** per the FYP1 system design
(Use Case Diagram, ERD and Data Dictionary in Chapter 4 of the FYP1 report).

## Features implemented

- **Auth** — email/password registration & login (Firebase Authentication), session persists
  across app restarts.
- **Profile** — set food preferences, available meal times and dining location; edit anytime.
- **Matching** — rule-based match list scored on shared meal times (highest weight), shared
  food preferences, and same dining location.
- **Food buddy requests** — send a request from a match's profile; accept/reject incoming
  requests from the Requests tab; accepting auto-creates a chat.
- **Real-time chat** — one chat per accepted match, backed by Firestore `onSnapshot` listeners.
- **Dining history** — list of all accepted matches.
- **Report / Block** — report a user (stored for admin review) or block them from your match
  list.

Not yet built (see FYP1 Chapter 6 "Future Work" — beyond the core-features pass done here):
push notifications (FCM), the admin web console for managing users/reports, and refinements
from usability testing (SUS).

## Project structure

```
src/
  config/firebase.ts      Firebase app/auth/firestore initialization (reads .env)
  types/                  Shared TypeScript types matching the Data Dictionary (Table 4.1-4.6)
  services/               Firestore read/write functions (userService, matchService, ...)
  context/AuthContext.tsx Auth state + profile, exposed via useAuth()
  navigation/              Auth stack, bottom tabs, per-tab stacks
  screens/                 One folder per feature area (auth, profile, matches, requests, chat, history)
  components/              Reusable UI (Button, TextField, Tag, Avatar)
  theme/colors.ts           Shared color palette
firestore.rules            Security rules matching the ERD (users/requests/chats/messages/reports)
```

## 1. Create your Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project
   (free Spark plan is enough).
2. **Authentication** → Sign-in method → enable **Email/Password**.
3. **Firestore Database** → Create database → start in **production mode** (the rules file
   below replaces the defaults).
4. In Project settings → General → "Your apps", add a **Web app** (yes, web — the Firebase JS
   SDK used by Expo works the same for a React Native app) and copy the config values.
5. Deploy the security rules: either paste the contents of [`firestore.rules`](firestore.rules)
   into Firestore → Rules in the console and click Publish, or install the
   [Firebase CLI](https://firebase.google.com/docs/cli) and run:
   ```bash
   firebase init firestore   # point it at this folder, keep firestore.rules as-is
   firebase deploy --only firestore:rules
   ```

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env` with the values from step 1.4 (apiKey, authDomain, projectId, storageBucket,
messagingSenderId, appId). These are `EXPO_PUBLIC_*` variables, so Expo inlines them into the
JS bundle at build time — restart the dev server after editing `.env`.

## 3. Install & run

```bash
npm install
npx expo start -c
```

Scan the QR code with the **Expo Go** app on an Android phone (per the FYP1 methodology,
Chapter 3.4), or press `a` to launch an Android emulator, or `w` for a quick web preview.

Create two accounts (e.g. on two phones, or one phone + web preview) to test matching,
sending a request, accepting it, and chatting.

## Data model

Matches the ERD/Data Dictionary in FYP1 Chapter 4, implemented as Firestore collections:

| Collection | Purpose |
|---|---|
| `users/{uid}` | profile: display_name, university_email, food_preferences[], available_meal_times[], dining_location, blocked_users[] |
| `foodBuddyRequests/{id}` | requester_id, recipient_id, status (pending/accepted/rejected) |
| `chats/{id}` | request_id, user_ids[], last_message_preview, last_message_time |
| `chats/{id}/messages/{id}` | sender_id, text_content, sent_at (subcollection, not a top-level collection, so security rules can scope access to just the two chat members) |
| `reports/{id}` | reporter_id, reported_user_id, reason, status |

## Known limitations (matches FYP1 Chapter 6 scope)

- No admin console yet — reports are write-only from the client; review them directly in the
  Firestore console for now.
- No push notifications yet — new matches/messages only show up while the app is open (pull
  to refresh on the Matches tab, chats update live via listeners).
- Matching is a simple weighted rule-based score, not a learned/optimized algorithm.
