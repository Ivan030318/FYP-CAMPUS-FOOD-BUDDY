/*
 * One-time Phase 1 migration.
 * Moves university_email and blocked_users out of public users/{uid} documents into
 * privateUsers/{uid}. Run with --dry-run first, then without it before publishing new rules.
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS to point to a Firebase service-account JSON file.
 */
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const dryRun = process.argv.includes('--dry-run');
const app = getApps().length ? getApps()[0] : initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);
const users = await db.collection('users').get();

let migrated = 0;
let skipped = 0;
let batch = db.batch();
let writes = 0;

async function commitBatch() {
  if (!writes || dryRun) return;
  await batch.commit();
  batch = db.batch();
  writes = 0;
}

for (const user of users.docs) {
  const data = user.data();
  if (!data.university_email) {
    skipped += 1;
    continue;
  }

  const publicProfile = {
    user_id: data.user_id ?? user.id,
    display_name: data.display_name ?? '',
    profile_photo_url: data.profile_photo_url ?? null,
    food_preferences: data.food_preferences ?? [],
    available_meal_times: data.available_meal_times ?? [],
    dining_location: data.dining_location ?? '',
    created_at: data.created_at ?? Date.now(),
  };
  const privateProfile = {
    university_email: data.university_email,
    blocked_users: data.blocked_users ?? [],
  };

  if (!dryRun) {
    batch.set(user.ref, publicProfile);
    batch.set(db.collection('privateUsers').doc(user.id), privateProfile);
    writes += 2;
    if (writes >= 450) await commitBatch();
  }
  migrated += 1;
}

await commitBatch();
console.log(`${dryRun ? 'Dry run: would migrate' : 'Migrated'} ${migrated} profile(s); skipped ${skipped}.`);
