# Campus Food Buddy

A mobile app that helps Multimedia University (MMU) students find a companion to eat with
on campus, based on shared food preferences, available meal times and dining location.
Built with **React Native (Expo)** and **Firebase** per the FYP1 system design
(Use Case Diagram, ERD and Data Dictionary in Chapter 4 of the FYP1 report).

## Features implemented

- **Auth** — email/password registration & login (Firebase Authentication), session persists
  across app restarts; users can request a Firebase password-reset email from the login page.
- **Profile** — set food preferences, available meal times and dining location; edit anytime.
  Profiles use a consistent name-initial avatar, so the app stays within Firebase's free plan.
- **Matching** — explainable compatibility score: shared meal times (50%), food preferences
  (30%), and same dining location (20%). Pending/accepted connections and low matches are hidden.
- **Food buddy requests** — one request per pair; only the recipient can accept/reject a
  pending request. Accepting atomically creates the pair's one chat and records the response time.
- **Real-time chat** — one chat per accepted match. A message and its chat-list preview are saved
  atomically, so they cannot become inconsistent. Unread messages show a live Chats badge and are
  marked read when the conversation is opened.
- **Updates** — a free in-app activity feed for buddy-request outcomes and chat activity, with a
  live badge for pending incoming requests.
- **Buddy history** — list of all accepted food buddy connections (not a claim that students
  actually dined together).
- **Report / Block** — report a user or block/unblock them. A block hides the user from matching
  and prevents new requests in either direction.
- **Admin report review** — a role-protected dashboard lets an assigned admin review reports and
  mark them resolved.

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

### Phase 1 data migration (required for existing accounts)

Phase 1 separates public matching profiles from private account data. New accounts are created
with both documents automatically. Before publishing the Phase 1 rules, migrate existing account
documents so email addresses and block lists are no longer stored in the public `users` collection.

1. Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**.
   Save it outside this repository (it is ignored if named `service-account*.json`). Never commit it.
2. Install the migration dependency once: `npm install --save-dev firebase-admin`.
3. In PowerShell, point the Admin SDK at the downloaded file and run a dry run:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\service-account.json'
   npm run migrate:profiles -- --dry-run
   ```
4. If the count is correct, rerun without `--dry-run`:
   ```powershell
   npm run migrate:profiles
   ```
5. Confirm Firestore now has `privateUsers/{uid}` documents and `users/{uid}` contains no
   `university_email` or `blocked_users` fields. Then publish [`firestore.rules`](firestore.rules).

The migration is idempotent for legacy profiles: running it again simply rewrites the same public
and private values. Delete the downloaded service-account JSON when you finish.

## 2. Configure the app

```bash
cp .env.example .env
```

Fill in `.env` with the values from step 1.4 (apiKey, authDomain, projectId, storageBucket,
messagingSenderId, appId). These are `EXPO_PUBLIC_*` variables, so Expo inlines them into the
JS bundle at build time — restart the dev server after editing `.env`.

### Enable the admin report dashboard

After publishing the updated [`firestore.rules`](firestore.rules), assign the admin role once:

1. Firebase Console → **Authentication** → **Users** → copy the UID of your own test account.
2. Firestore Database → start collection **adminUsers** → set the document ID to that UID.
3. Add one field: `role` (string) with the value `admin`, then save.
4. Sign out and sign in again. That account opens the separate **Admin Console** directly.

Only a Firebase Console administrator can create this document; the app's own Firestore Rules do
not permit any user to assign themselves a role.

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
| `users/{uid}` | **public** matching profile: display_name, photo, food_preferences[], available_meal_times[], dining_location |
| `privateUsers/{uid}` | **owner-only** university_email and blocked_users[] |
| `blocks/{blockerId}_{blockedId}` | private enforcement record used by Rules to prevent future requests in either direction |
| `foodBuddyRequests/{id}` | requester_id, recipient_id, status (pending/accepted/rejected) |
| `chats/{id}` | request_id, user_ids[], last_message_preview, last_message_time |
| `chats/{id}/messages/{id}` | sender_id, text_content, sent_at (subcollection, not a top-level collection, so security rules can scope access to just the two chat members) |
| `reports/{id}` | reporter_id, reported_user_id, reason, status |

## Known limitations (matches FYP1 Chapter 6 scope)

- No device-level push notifications yet — request outcomes appear in the in-app Updates tab while
  the app is open.
- Matching is a simple weighted rule-based score, not a learned/optimized algorithm.

## Demonstration testing

Use [`docs/TESTING_CHECKLIST.md`](docs/TESTING_CHECKLIST.md) for the two-account FYP test and
for collecting evidence screenshots before meeting your supervisor.
