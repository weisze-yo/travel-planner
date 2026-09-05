// Storage and who you are. Two interchangeable backends behind one interface:
//
//   firebase — Firestore under users/{uid}/trips/{tripId}/…, the same layout
//              the SwiftUI app uses, so both clients read the same shape.
//   local    — localStorage, used when Firebase is not configured yet, when
//              nobody has signed in on this phone, or when Firestore cannot
//              be reached. The app stays usable; the data just does not
//              leave the browser.
//
// Signing in is real: Google, or a link sent to an email address. There is no
// password anywhere in here — a passwordless link is one tap on a phone and
// there is nothing to reset, forget or leak. What there is *not* any more is
// anonymous sign-in: an anonymous uid is an account nobody can get back, and
// the whole point of item 31 is that a trip survives losing the phone.
//
// One exception, and it matters: a phone that already has an anonymous user
// from the previous build keeps it, because its trips live under that uid.
// Signing in *links* that user rather than replacing it, so the uid — and
// every trip under it — carries over. New phones never get one.

import { firebaseConfig, FIREBASE_SDK } from './config.js';

export const KINDS = ['days', 'places', 'subRoutes', 'shopping', 'mustSee', 'prep', 'log', 'outfits'];

const LOCAL_PREFIX = 'travel-planner:trip:';
const LOCAL_INDEX = 'travel-planner:trips';
const ACTIVE_KEY = 'travel-planner:active-trip';
/** Where a half-finished email sign-in remembers which address it was for. */
const EMAIL_KEY = 'travel-planner:sign-in-email';
/** The one collection two phones both reach. See firebase/firestore.rules. */
const PUBLISHED = 'published';

/**
 * Where the SDK comes from. Google's CDN in production, pinned to a version.
 *
 * The emulator flag also redirects this to a local copy, because a test that
 * has to reach a CDN is a test that fails for reasons that have nothing to do
 * with the app. Same files, same version — fetched once and served from here.
 */
const cdn = (mod) => (localEmulators()
  ? `/vendor/firebase-local/firebase-${mod}.js`
  : `https://www.gstatic.com/firebasejs/${FIREBASE_SDK}/firebase-${mod}.js`);

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

function local(name, fallback = null) {
  try {
    const stored = localStorage.getItem(name);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(name, value) {
  try {
    if (value == null) localStorage.removeItem(name);
    else localStorage.setItem(name, JSON.stringify(value));
  } catch {
    // Private browsing, or the quota is full. The session still works.
  }
}

// ------------------------------------------------------------ one Firebase
//
// Loaded once and shared. The SDK is fetched from a CDN, so this is also the
// only place that can fail because a network is hostile rather than absent.

let loading = null;

/** The SDK and the three services, or null when there is no project yet. */
export function firebase() {
  if (!isConfigured()) return Promise.resolve(null);
  if (!loading) {
    loading = load().catch((error) => {
      // A failed load must not be cached, or one bad launch poisons the app
      // for as long as it is open.
      loading = null;
      throw error;
    });
  }
  return loading;
}

async function load() {
  const [appMod, authMod, dbMod, storageMod] = await Promise.all([
    import(cdn('app')),
    import(cdn('auth')),
    import(cdn('firestore')),
    import(cdn('storage')),
  ]);

  const app = appMod.initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);

  // Talking to the local emulator suite instead of the real project.
  //
  // This exists so the whole of sharing can be driven end to end — two
  // signed-in people, the real SDK, the real security rules — without a
  // console, an inbox, or two phones. It is off unless something has
  // deliberately switched it on, and it can only ever point at this
  // machine: an emulator flag that a page could set for a stranger would
  // be a way to serve them a fake backend.
  const emulators = localEmulators();
  if (emulators) {
    authMod.connectAuthEmulator(auth, `http://127.0.0.1:${emulators.auth}`, { disableWarnings: true });
  }

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
  if (emulators) dbMod.connectFirestoreEmulator(db, '127.0.0.1', emulators.firestore);

  return { app, auth, db, appMod, authMod, dbMod, storageMod };
}

/**
 * Whether to use the emulator suite, and on which ports.
 *
 * Two conditions, both required. The page has to be served from this
 * machine, so a deployed build can never be pointed at a fake backend by
 * anything a visitor's browser was talked into storing. And the flag has to
 * be set explicitly — no default, no guessing from the hostname alone,
 * because a real trip planned on a laptop at localhost is still a real trip.
 */
let emulatorAnswer;
function localEmulators() {
  if (emulatorAnswer === undefined) emulatorAnswer = emulatorPorts();
  return emulatorAnswer;
}

function emulatorPorts() {
  const localHost = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname);
  if (!localHost) return null;
  try {
    const raw = localStorage.getItem('travel-planner:emulators');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.auth || !parsed?.firestore) return null;
    console.warn('[travel-planner] using the local emulator suite, not the real project');
    return { auth: Number(parsed.auth), firestore: Number(parsed.firestore) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- accounts

/**
 * What the rest of the app is told about a signed-in person. `linked` says
 * this account grew out of an anonymous one, which is why its trips were
 * already there.
 */
function accountOf(user) {
  if (!user || user.isAnonymous) return null;
  const providers = (user.providerData || []).map((p) => p && p.providerId);
  return {
    uid: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    provider: providers.includes('google.com') ? 'google' : 'email',
  };
}

/** The first auth state the SDK settles on, restored from disk if need be. */
function firstUser(fb) {
  return new Promise((resolve) => {
    const stop = fb.authMod.onAuthStateChanged(fb.auth, (user) => {
      stop();
      resolve(user || null);
    }, () => {
      stop();
      resolve(null);
    });
  });
}

/**
 * Who is signed in on this phone, waited for properly.
 *
 * The SDK restores a session from local storage rather than from the network,
 * so this resolves offline — which is the whole reason boot waits for it
 * instead of hanging on a sign-in that cannot reach anyone. Three things can
 * land here: a redirect coming back from Google, a link opened out of an
 * email, or nothing at all, which is the ordinary case.
 *
 * `reached` distinguishes "nobody is signed in" from "we could not ask",
 * because only the first should ever sign anybody out.
 */
export async function restoreAccount() {
  let fb = null;
  try {
    fb = await firebase();
  } catch (error) {
    console.warn('[travel-planner] Firebase could not be loaded', error);
    return { reached: false, account: null, anonymous: false };
  }
  if (!fb) return { reached: true, account: null, anonymous: false, unconfigured: true };

  let notice = '';
  try {
    // Both of these are no-ops unless this launch *is* the return leg.
    const emailed = await completeEmailLink(fb);
    if (emailed) notice = 'email';
    else if (await fb.authMod.getRedirectResult(fb.auth)) notice = 'redirect';
  } catch (error) {
    console.warn('[travel-planner] sign-in did not complete', error);
    notice = String(error?.code || error?.message || 'sign-in failed');
  }

  const user = await firstUser(fb);
  return {
    reached: true,
    account: accountOf(user),
    // Kept, not created: its trips are under this uid and a sign-in links it.
    anonymous: Boolean(user && user.isAnonymous),
    uid: user ? user.uid : null,
    notice,
  };
}

/** Told when another tab signs in or out, so both windows agree. */
export async function watchAccount(handler) {
  const fb = await firebase().catch(() => null);
  if (!fb) return () => {};
  return fb.authMod.onAuthStateChanged(fb.auth, (user) => handler(accountOf(user), user));
}

/**
 * Google. On a phone the popup is the good path — it keeps the app open and
 * comes straight back — but an installed web app can refuse to open one, so
 * a refusal falls through to a redirect rather than to an error message.
 *
 * When this browser is carrying an old anonymous user, the credential is
 * *linked* to it: same uid, so every trip already written stays reachable.
 */
export async function signInWithGoogle() {
  const fb = await need();
  const provider = new fb.authMod.GoogleAuthProvider();
  // Always ask which account: households share phones, and silently reusing
  // whichever Google session the browser happens to hold is how you end up
  // writing to somebody else's trips.
  provider.setCustomParameters({ prompt: 'select_account' });

  const existing = fb.auth.currentUser;
  try {
    const result = existing && existing.isAnonymous
      ? await fb.authMod.linkWithPopup(existing, provider)
      : await fb.authMod.signInWithPopup(fb.auth, provider);
    return accountOf(result.user);
  } catch (error) {
    const code = String(error?.code || '');

    // That Google account already has trips of its own. Its data wins; what
    // was on this phone is migrated by the store afterwards.
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
      const credential = fb.authMod.GoogleAuthProvider.credentialFromError(error);
      if (credential) {
        const result = await fb.authMod.signInWithCredential(fb.auth, credential);
        return accountOf(result.user);
      }
    }

    if (REDIRECT_INSTEAD.has(code)) {
      // Leaves the page. Nothing after this runs; `restoreAccount` picks the
      // sign-in up when the browser comes back.
      await (existing && existing.isAnonymous
        ? fb.authMod.linkWithRedirect(existing, provider)
        : fb.authMod.signInWithRedirect(fb.auth, provider));
      return null;
    }
    throw error;
  }
}

/** Popups a browser will not open. Every one of these is worth a redirect. */
const REDIRECT_INSTEAD = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
  'auth/web-storage-unsupported',
]);

/**
 * Email, without a password. We send a link, the phone remembers which
 * address it was for, and opening the link finishes the job — see
 * `completeEmailLink`. If the address is not on this phone when the link
 * opens (mail read on a laptop, say) the app asks for it again.
 */
export async function sendSignInEmail(address) {
  const fb = await need();
  const email = String(address || '').trim();
  await fb.authMod.sendSignInLinkToEmail(fb.auth, email, {
    // Back to this app, on whatever host it is on.
    url: `${location.origin}${location.pathname}`,
    handleCodeInApp: true,
  });
  writeLocal(EMAIL_KEY, email);
  return email;
}

/** The address a link was sent to, so the screen can say "check your mail". */
export const pendingEmail = () => local(EMAIL_KEY, null);

export const forgetPendingEmail = () => writeLocal(EMAIL_KEY, null);

/**
 * The return leg. Called on every launch and does nothing on almost all of
 * them; when the URL *is* a sign-in link it completes it, links it onto an
 * anonymous user if there is one, and tidies the code out of the address bar
 * so a refresh does not try to spend it twice.
 */
async function completeEmailLink(fb) {
  if (!fb.authMod.isSignInWithEmailLink(fb.auth, location.href)) return null;
  const email = pendingEmail() || window.prompt('Which email address was this link sent to?') || '';
  if (!email) return null;

  const existing = fb.auth.currentUser;
  let user = null;
  try {
    if (existing && existing.isAnonymous) {
      const credential = fb.authMod.EmailAuthProvider.credentialWithLink(email, location.href);
      user = (await fb.authMod.linkWithCredential(existing, credential)).user;
    } else {
      user = (await fb.authMod.signInWithEmailLink(fb.auth, email, location.href)).user;
    }
  } catch (error) {
    if (String(error?.code || '') === 'auth/credential-already-in-use') {
      // The address already has an account. Sign into it; the store moves
      // this phone's trips across afterwards.
      user = (await fb.authMod.signInWithEmailLink(fb.auth, email, location.href)).user;
    } else {
      forgetPendingEmail();
      throw error;
    }
  }

  forgetPendingEmail();
  try {
    history.replaceState(null, '', `${location.pathname}${location.hash || ''}`);
  } catch { /* file:// has no history to rewrite */ }
  return accountOf(user);
}

export async function signOutAccount() {
  const fb = await firebase().catch(() => null);
  if (!fb) return;
  forgetPendingEmail();
  await fb.authMod.signOut(fb.auth);
}

async function need() {
  const fb = await firebase();
  if (!fb) throw new Error('No Firebase project is configured yet');
  return fb;
}

// ------------------------------------------------- the published envelope
//
// One document per link code, and the only thing two phones both reach. It
// is not a trip: it is a copy of the three shared kinds, sitting where the
// other side can fetch it. `owner` and `editors` are uids because the rules
// are, and they are what make "only the owner and editors can publish" a
// fact rather than a promise.

function publishedDoc(fb, code) {
  return fb.dbMod.doc(fb.db, PUBLISHED, String(code));
}

/** Reads one envelope. Anyone holding the code may; nobody may list them. */
export async function fetchPublished(code) {
  if (!code) return null;
  const fb = await firebase().catch(() => null);
  if (!fb) return null;
  // Offline this answers from the cache, which is the point of the cache.
  const snap = await fb.dbMod.getDoc(publishedDoc(fb, code));
  return snap.exists() ? snap.data() : null;
}

/**
 * Publishes. Offline, Firestore keeps the write and replays it — so this
 * resolves late rather than failing, and the caller must not wait on it.
 */
export async function pushPublished(code, envelope) {
  if (!code) return;
  const fb = await need();
  await fb.dbMod.setDoc(publishedDoc(fb, code), envelope);
}

/**
 * The other side's copy of the envelope, as it changes. This is what makes
 * "there is an update waiting" arrive on its own instead of on a refresh.
 */
/**
 * `onError` is called only when the cloud actually ANSWERED and said no — a
 * permission denial, a document that is gone. It is deliberately not called
 * for a transient failure, because being offline is not a link ending, and
 * the sync dot and the strip already own connectivity
 * (`p1-absence-and-removal-design.md` §6.2: "the last read that actually got
 * an answer", not the last attempt).
 */
export async function watchPublished(code, handler, onError = () => {}) {
  if (!code) return () => {};
  const fb = await firebase().catch(() => null);
  if (!fb) return () => {};
  return fb.dbMod.onSnapshot(
    publishedDoc(fb, code),
    (snap) => handler(snap.exists() ? snap.data() : null),
    (error) => {
      console.warn('[travel-planner] cannot watch the shared link', error);
      const code2 = String(error?.code || error?.message || '');
      if (/permission-denied|insufficient|not-found|unauthenticated/i.test(code2)) onError(error);
    },
  );
}

/**
 * Joining with a link that grants editing. The rules let you add your own
 * uid to `editors` and change nothing else, which is exactly this.
 */
export async function claimEditor(code) {
  if (!code) return false;
  const fb = await firebase().catch(() => null);
  if (!fb || !fb.auth.currentUser || fb.auth.currentUser.isAnonymous) return false;
  const uid = fb.auth.currentUser.uid;
  try {
    const ref = publishedDoc(fb, code);
    const snap = await fb.dbMod.getDoc(ref);
    if (!snap.exists()) return false;
    const editors = snap.data().editors || [];
    if (editors.includes(uid) || snap.data().owner === uid) return true;
    await fb.dbMod.updateDoc(ref, { editors: [...editors, uid] });
    return true;
  } catch (error) {
    console.warn('[travel-planner] could not join as an editor', error);
    return false;
  }
}

/**
 * Telling the owner someone actually took the trip. The rules let a
 * signed-in guest write exactly one key into the envelope's `joiners` map —
 * their own uid — same shape of permission `claimEditor` already has for
 * `editors`, just open to a read-role joiner too, not only one who can
 * publish. This is the only thing that ever crosses the ownership boundary;
 * the owner's own `trip.people` is folded in on their side, from this.
 */
export async function announceJoin(code, joiner) {
  if (!code || !joiner?.id) return false;
  const fb = await firebase().catch(() => null);
  if (!fb || !fb.auth.currentUser || fb.auth.currentUser.isAnonymous) return false;
  const uid = fb.auth.currentUser.uid;
  try {
    const ref = publishedDoc(fb, code);
    const snap = await fb.dbMod.getDoc(ref);
    if (!snap.exists()) return false;
    const joiners = snap.data().joiners || {};
    await fb.dbMod.updateDoc(ref, { joiners: { ...joiners, [uid]: joiner } });
    return true;
  } catch (error) {
    console.warn('[travel-planner] could not tell the owner you joined', error);
    return false;
  }
}

/**
 * Counting a real, signed-in view of the invite — "opened", as the Share
 * screen already puts it, not "joined": someone can look without joining
 * and that should still register. An anonymous look before signing in is
 * not counted, because nothing unauthenticated ever reaches Firestore here
 * — the same limit `writePublished` already accepts for publishing itself.
 * The caller dedupes per device so a refresh does not inflate it.
 */
export async function bumpLinkOpens(code) {
  if (!code) return false;
  const fb = await firebase().catch(() => null);
  if (!fb || !fb.auth.currentUser || fb.auth.currentUser.isAnonymous) return false;
  try {
    const ref = publishedDoc(fb, code);
    const snap = await fb.dbMod.getDoc(ref);
    if (!snap.exists()) return false;
    await fb.dbMod.updateDoc(ref, { opens: (snap.data().opens || 0) + 1 });
    return true;
  } catch (error) {
    console.warn('[travel-planner] could not record that the link was opened', error);
    return false;
  }
}

// ------------------------------------------------------------- the backend

/**
 * Picks the best backend available, never throwing.
 *
 * Signed in and reachable, it is Firestore under that uid. Anything else —
 * no project, nobody signed in, or a Firestore that will not answer — is
 * this browser's own storage, which is a perfectly good place for a trip to
 * live and is where a phone that has never signed in keeps everything.
 */
export async function createBackend(tripID, { uid = null } = {}) {
  if (isConfigured() && uid) {
    try {
      const backend = await createFirebaseBackend(tripID, uid);
      // Building the backend only proves the SDK loaded. It says nothing
      // about whether the cloud will accept anything, and the failure that
      // matters most in practice — security rules that do not allow this
      // app — happens per-operation, long after this point. Left unchecked
      // it looks like everything is fine while every write is refused, on
      // both phones at once, which is indistinguishable from the feature
      // being broken. So ask once, here, and degrade honestly.
      const refusal = await refusedOutright(backend);
      if (refusal) {
        console.warn('[travel-planner] the cloud refused this account outright — saving to this device only.', refusal);
        return createLocalBackend(tripID, { degradedFrom: refusal });
      }
      return backend;
    } catch (error) {
      console.warn('[travel-planner] Firebase unreachable — saving to this device only.', error);
      return createLocalBackend(tripID, { degradedFrom: error });
    }
  }
  return createLocalBackend(tripID);
}

/**
 * One read of this account's own trip list.
 *
 * Only an outright refusal counts. Being offline is not a refusal — Firestore
 * answers from its cache and queues the writes, which is the whole point of
 * the offline cache — so anything that is not the cloud saying "no" is
 * allowed through and left to the sync ledger.
 */
async function refusedOutright(backend) {
  try {
    await backend.listTrips();
    return null;
  } catch (error) {
    const code = String(error?.code || error?.message || '');
    return /permission-denied|unauthenticated|insufficient/i.test(code) ? error : null;
  }
}

// ------------------------------------------------------------------ firebase

async function createFirebaseBackend(tripID, uid) {
  const fb = await firebase();
  const { app, db, dbMod, storageMod } = fb;
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

    /** The whole of one trip, for moving a device's trips into an account. */
    async writeWhole(snapshot) {
      const target = doc(tripsRef, snapshot.trip.id);
      const batch = writeBatch(db);
      batch.set(target, snapshot.trip);
      for (const kind of KINDS) {
        for (const row of snapshot[kind] || []) {
          batch.set(doc(collection(target, kind), row.id), row);
        }
      }
      await batch.commit();
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

  const readJSON = (name, fallback) => local(name, fallback);
  const writeJSON = (name, value) => writeLocal(name, value);

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

    async writeWhole(next) {
      writeJSON(LOCAL_PREFIX + next.trip.id, next);
      noteInIndex(next.trip);
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

/**
 * Everything this browser is keeping, whether or not anyone is signed in.
 * Sign-in reads it once to carry a phone's own trips into the account.
 */
export function localTrips() {
  return local(LOCAL_INDEX, [])
    .map((entry) => local(LOCAL_PREFIX + entry.id, null))
    .filter((snapshot) => snapshot && snapshot.trip);
}

export function forgetLocalTrip(id) {
  try {
    localStorage.removeItem(LOCAL_PREFIX + id);
  } catch { /* nothing to remove */ }
  writeLocal(LOCAL_INDEX, local(LOCAL_INDEX, []).filter((t) => t.id !== id));
}
