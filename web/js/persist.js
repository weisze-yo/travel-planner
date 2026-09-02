// Storage. Two interchangeable backends behind one interface:
//
//   firebase — Firestore under users/{uid}/trips/{tripId}/…, the same layout
//              the SwiftUI app uses, so both clients read the same shape.
//   local    — localStorage, used when Firebase is not configured yet or
//              cannot be reached. The app stays usable; the data just does
//              not leave the browser.

import { firebaseConfig, FIREBASE_SDK } from './config.js';
import { TRIP_ID } from './data.js';

export const KINDS = ['days', 'places', 'subRoutes', 'shopping', 'mustSee', 'prep', 'log', 'outfits'];

const LOCAL_KEY = 'travel-planner:snapshot:v1';
const cdn = (mod) => `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}/firebase-${mod}.js`;

export function isConfigured(config = firebaseConfig) {
  return Boolean(config && config.apiKey && config.projectId);
}

/** Picks the best backend available, never throwing. */
export async function createBackend() {
  if (isConfigured()) {
    try {
      return await createFirebaseBackend();
    } catch (error) {
      console.warn('[travel-planner] Firebase unavailable — this device only.', error);
      return createLocalBackend({ degradedFrom: error });
    }
  }
  return createLocalBackend();
}

// ------------------------------------------------------------------ firebase

async function createFirebaseBackend() {
  const [{ initializeApp }, authMod, dbMod, storageMod] = await Promise.all([
    import(cdn('app')),
    import(cdn('auth')),
    import(cdn('firestore')),
    import(cdn('storage')),
  ]);

  const app = initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  const db = dbMod.getFirestore(app);

  // Anonymous auth gives this browser a real uid, so the rules apply and the
  // data survives a refresh without a login screen.
  const credential = auth.currentUser
    ? { user: auth.currentUser }
    : await authMod.signInAnonymously(auth);
  const uid = credential.user.uid;

  const { doc, collection, getDocs, getDoc, setDoc, deleteDoc, writeBatch, onSnapshot } = dbMod;
  const tripRef = doc(db, 'users', uid, 'trips', TRIP_ID);
  const kindRef = (kind) => collection(tripRef, kind);

  let storage = null;
  const bucket = () => {
    if (!storage) storage = storageMod.getStorage(app);
    return storage;
  };

  return {
    mode: 'firebase',
    uid,
    // No bucket in the config means Storage was never enabled.
    hasBucket: Boolean(firebaseConfig.storageBucket),

    async loadAll() {
      const tripSnap = await getDoc(tripRef);
      if (!tripSnap.exists()) return null;
      const snapshot = { trip: tripSnap.data() };
      const results = await Promise.all(KINDS.map((kind) => getDocs(kindRef(kind))));
      KINDS.forEach((kind, i) => {
        snapshot[kind] = results[i].docs.map((d) => d.data());
      });
      return snapshot;
    },

    async seed(snapshot) {
      // One batch, so a half-written trip can never be observed.
      const batch = writeBatch(db);
      batch.set(tripRef, snapshot.trip);
      for (const kind of KINDS) {
        for (const row of snapshot[kind] || []) {
          batch.set(doc(kindRef(kind), row.id), row);
        }
      }
      await batch.commit();
    },

    putTrip(trip) {
      return setDoc(tripRef, trip).catch(report);
    },

    put(kind, row) {
      return setDoc(doc(kindRef(kind), row.id), row).catch(report);
    },

    del(kind, id) {
      return deleteDoc(doc(kindRef(kind), id)).catch(report);
    },

    /** Fires whenever another device changes something. */
    onRemoteChange(handler) {
      const stop = [
        onSnapshot(tripRef, (snap) => { if (snap.exists()) handler('trip', snap.data()); }, report),
      ];
      for (const kind of KINDS) {
        stop.push(onSnapshot(kindRef(kind), (snap) => {
          handler(kind, snap.docs.map((d) => d.data()));
        }, report));
      }
      return () => stop.forEach((fn) => fn());
    },

    async uploadPhoto(file, path) {
      const ref = storageMod.ref(bucket(), `users/${uid}/trips/${TRIP_ID}/${path}`);
      await storageMod.uploadBytes(ref, file);
      return storageMod.getDownloadURL(ref);
    },
  };
}

function report(error) {
  console.warn('[travel-planner] write failed', error);
}

// --------------------------------------------------------------------- local

export function createLocalBackend({ degradedFrom = null } = {}) {
  const read = () => {
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  let snapshot = read();

  const flush = () => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot));
    } catch {
      // Private browsing, or the quota is full. The session still works.
    }
  };

  return {
    mode: 'local',
    uid: 'local-device',
    hasBucket: false,
    degradedFrom,

    async loadAll() {
      snapshot = read();
      return snapshot;
    },

    async seed(next) {
      snapshot = JSON.parse(JSON.stringify(next));
      flush();
    },

    putTrip(trip) {
      if (!snapshot) return;
      snapshot.trip = trip;
      flush();
    },

    put(kind, row) {
      if (!snapshot) return;
      const list = snapshot[kind] || (snapshot[kind] = []);
      const at = list.findIndex((r) => r.id === row.id);
      if (at >= 0) list[at] = row; else list.push(row);
      flush();
    },

    del(kind, id) {
      if (!snapshot || !snapshot[kind]) return;
      snapshot[kind] = snapshot[kind].filter((r) => r.id !== id);
      flush();
    },

    onRemoteChange() {
      return () => {};
    },

    /** There is no bucket here; the caller keeps a thumbnail instead. */
    async uploadPhoto() {
      throw new Error('No Cloud Storage bucket on this device');
    },
  };
}
