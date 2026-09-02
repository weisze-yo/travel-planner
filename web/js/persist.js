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

const LOCAL_PREFIX = 'travel-planner:trip:';
const LOCAL_INDEX = 'travel-planner:trips';
const ACTIVE_KEY = 'travel-planner:active-trip';
const cdn = (mod) => `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}/firebase-${mod}.js`;

export function isConfigured(config = firebaseConfig) {
  return Boolean(config && config.apiKey && config.projectId);
}

/** Which trip the app last had open, so a relaunch returns to it. */
export function readActiveTripID() {
  try {
    return localStorage.getItem(ACTIVE_KEY) || null;
  } catch {
    return null;
  }
}

export function writeActiveTripID(tripID) {
  try {
    if (tripID) localStorage.setItem(ACTIVE_KEY, tripID);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // Private browsing; the app still works for this session.
  }
}

/** Picks the best backend available, never throwing. */
export async function createBackend(tripID) {
  if (isConfigured()) {
    try {
      return await createFirebaseBackend(tripID);
    } catch (error) {
      console.warn('[travel-planner] Firebase unreachable — saving to this device only.', error);
      return createLocalBackend(tripID, { degradedFrom: error });
    }
  }
  return createLocalBackend(tripID);
}

// ------------------------------------------------------------------ firebase

async function createFirebaseBackend(tripID) {
  const [{ initializeApp }, authMod, dbMod, storageMod] = await Promise.all([
    import(cdn('app')),
    import(cdn('auth')),
    import(cdn('firestore')),
    import(cdn('storage')),
  ]);

  const app = initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);

  // Persistent cache, so the trip is readable AND editable with no signal —
  // free time in a foreign market is exactly when there is none. Writes made
  // offline queue up and replay when the connection returns. This has to run
  // before anything else touches Firestore.
  let db;
  try {
    db = dbMod.initializeFirestore(app, {
      localCache: dbMod.persistentLocalCache({
        tabManager: dbMod.persistentMultipleTabManager(),
      }),
    });
  } catch (error) {
    // Private browsing, or a browser without IndexedDB. Still usable online.
    console.warn('[travel-planner] offline cache unavailable', error);
    db = dbMod.getFirestore(app);
  }

  // Anonymous auth gives this browser a real uid, so the rules apply and the
  // data survives a refresh without a login screen. The SDK restores the uid
  // from local storage, but that restore is asynchronous — waiting for the
  // first auth state means an offline launch works instead of hanging on a
  // sign-in that cannot reach the network.
  const restored = await new Promise((resolve) => {
    const stop = authMod.onAuthStateChanged(auth, (user) => {
      stop();
      resolve(user);
    });
  });
  const uid = restored ? restored.uid : (await authMod.signInAnonymously(auth)).user.uid;

  const { doc, collection, getDocs, getDoc, setDoc, deleteDoc, writeBatch, onSnapshot } = dbMod;
  const tripsRef = collection(db, 'users', uid, 'trips');
  const tripRef = doc(tripsRef, tripID);
  const kindRef = (kind) => collection(tripRef, kind);

  let storage = null;
  const bucket = () => {
    if (!storage) storage = storageMod.getStorage(app);
    return storage;
  };

  return {
    mode: 'firebase',
    uid,
    tripID,
    // No bucket in the config means Storage was never enabled.
    hasBucket: Boolean(firebaseConfig.storageBucket),

    async loadAll() {
      // getDoc falls back to the cache on its own when offline; a hard failure
      // means neither the network nor the cache had it.
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

    /** Every trip this account has, for the home screen. */
    async listTrips() {
      const snap = await getDocs(tripsRef);
      return snap.docs.map((d) => d.data());
    },

    async createTrip(trip) {
      await setDoc(doc(tripsRef, trip.id), trip);
    },

    /** Removes the trip and everything under it. */
    async deleteTrip(id) {
      const target = doc(tripsRef, id);
      for (const kind of KINDS) {
        const rows = await getDocs(collection(target, kind));
        // Batched in chunks; Firestore caps a batch at 500 writes.
        for (let i = 0; i < rows.docs.length; i += 400) {
          const batch = writeBatch(db);
          rows.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
      await deleteDoc(target);
    },

    async uploadPhoto(file, path) {
      const ref = storageMod.ref(bucket(), `users/${uid}/trips/${tripID}/${path}`);
      await storageMod.uploadBytes(ref, file);
      return storageMod.getDownloadURL(ref);
    },
  };
}

function report(error) {
  console.warn('[travel-planner] write failed', error);
}

// --------------------------------------------------------------------- local

export function createLocalBackend(tripID, { degradedFrom = null } = {}) {
  const key = LOCAL_PREFIX + tripID;

  const readJSON = (name, fallback) => {
    try {
      const stored = localStorage.getItem(name);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJSON = (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // Private browsing, or the quota is full. The session still works.
    }
  };

  const read = () => readJSON(key, null);
  let snapshot = read();

  const flush = () => writeJSON(key, snapshot);

  const index = () => readJSON(LOCAL_INDEX, []);
  const noteInIndex = (trip) => {
    const trips = index().filter((t) => t.id !== trip.id);
    trips.push({ id: trip.id, name: trip.name });
    writeJSON(LOCAL_INDEX, trips);
  };

  return {
    mode: 'local',
    uid: 'local-device',
    tripID,
    hasBucket: false,
    degradedFrom,

    async listTrips() {
      return index()
        .map((entry) => readJSON(LOCAL_PREFIX + entry.id, null)?.trip)
        .filter(Boolean);
    },

    async createTrip(trip) {
      writeJSON(LOCAL_PREFIX + trip.id, {
        trip, days: [], places: [], subRoutes: [], shopping: [],
        mustSee: [], prep: [], log: [], outfits: [],
      });
      noteInIndex(trip);
    },

    async deleteTrip(id) {
      try {
        localStorage.removeItem(LOCAL_PREFIX + id);
      } catch { /* nothing to remove */ }
      writeJSON(LOCAL_INDEX, index().filter((t) => t.id !== id));
    },

    async loadAll() {
      snapshot = read();
      return snapshot;
    },

    async seed(next) {
      snapshot = JSON.parse(JSON.stringify(next));
      flush();
      noteInIndex(snapshot.trip);
    },

    putTrip(trip) {
      if (!snapshot) return;
      snapshot.trip = trip;
      flush();
      noteInIndex(trip);
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
