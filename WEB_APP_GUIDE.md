# Getting the Travel Planner onto your iPhone

This is the **web-app version** in `web/`. It runs in Safari, installs to your
iPhone home screen with its own icon, and needs **no Mac and no Apple Developer
account**. Firebase stores the data and serves the app.

There is also a native SwiftUI version in `TravelPlanner.swiftpm/` — same design,
same Firestore layout — for the day you have a Mac. See `APP_README.md`.

---

## What Firebase actually does here

Firebase is **not** a build service, and it cannot make an iOS app. What it gives
you is:

| Part | What it does for this app |
|---|---|
| **Hosting** | Serves the web app at `https://your-project.web.app` |
| **Firestore** | Stores your trip: stops, sub routes, shopping, prep, notes |
| **Authentication** | Gives each device an anonymous user id, so the rules can protect your data |
| **Storage** (optional) | Holds photos you attach to notes |

All of that fits in the **free Spark plan**. No card needed, except that some
new projects now ask for the paid Blaze plan to switch Storage on — if yours
does, skip Storage. Everything except photo upload still works.

---

## Step 1 — Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and
   sign in with a Google account.
2. **Add project** → name it (e.g. `travel-planner`) → Continue.
3. Google Analytics: **turn it off**. You do not need it. → Create project.

## Step 2 — Register a *web* app and paste the config

This is the step people get wrong: register a **Web** app, not an iOS app.

1. On the project overview, click the **`</>`** (Web) icon.
2. Nickname: `Travel Planner web`. Do **not** tick Firebase Hosting yet.
   → Register app.
3. Firebase shows a `firebaseConfig = { ... }` block. Copy those values into
   **`web/js/config.js`**, replacing the empty strings:

   ```js
   export const firebaseConfig = {
     apiKey: 'AIza…',
     authDomain: 'travel-planner-1a2b3.firebaseapp.com',
     projectId: 'travel-planner-1a2b3',
     storageBucket: 'travel-planner-1a2b3.appspot.com',
     messagingSenderId: '1234567890',
     appId: '1:1234567890:web:abcdef',
   };
   ```

   These are **not secrets** — they identify your project, and every web app
   ships them. What protects your data is the rules in step 4. Committing them
   to GitHub is fine and is what the automatic deploy expects.

> Until you fill this in, the app still runs — it just saves to that one
> browser (localStorage) and nothing syncs. Handy for a first look.

## Step 3 — Turn on anonymous sign-in

1. Left sidebar → **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Anonymous** → enable → Save.

This is how each device gets a user id without you building a login screen.

## Step 4 — Create the database and paste the rules

1. **Build → Firestore Database → Create database**.
2. Choose **Production mode** (the rules below are what make it safe).
3. Location: **`asia-southeast1` (Singapore)** — closest to Malaysia. This
   cannot be changed later.
4. Once created, open the **Rules** tab, delete what is there, paste the whole
   contents of **`firebase/firestore.rules`**, and press **Publish**.

Without step 4, production mode blocks everything and the app will fall back to
saving in the browser only.

## Step 5 — Storage — **optional, skip it if it asks for a card**

Newer Firebase projects require the paid **Blaze** plan to switch Cloud Storage
on. If yours does: **skip this step entirely.** Photos still work.

Without Storage, a photo you attach to a note is shrunk in the browser to a
small thumbnail (320 px, a few kB) and saved inside the note itself, and the
composer tells you it did that. Around 55 photos per day fit that way. Nothing
else on any screen is affected.

If Storage *is* available on the free plan for you, or you turn Blaze on later:

1. **Build → Storage → Get started** → same region → Next.
2. **Rules** tab → paste **`firebase/storage.rules`** → Publish.

Then photos upload at full size (1600 px) automatically — no code change, and
the thumbnails already saved stay where they are.

---

## Step 6 — Deploy it

Pick whichever suits you. **Option A installs nothing on your computer.**

### Option A — let GitHub deploy it for you

The repo already contains `.github/workflows/deploy-web.yml`. It deploys on
every push to `main`. Two one-time settings:

1. **Service account key.** Firebase console → ⚙️ **Project settings** →
   **Service accounts** → **Generate new private key** → a `.json` file
   downloads. Open it in a text editor and copy **everything**.
2. In GitHub: your repo → **Settings** → **Secrets and variables** →
   **Actions** → **New repository secret** → name it exactly
   `FIREBASE_SERVICE_ACCOUNT` → paste the whole JSON → **Add secret**.

   That is the only setting required. The project id is read out of
   `web/js/config.js`. (There is an optional repository *variable*,
   `FIREBASE_PROJECT_ID`, if you ever want to deploy to a different project
   than the one the app talks to.)
3. Push any change to `main` (or **Actions** tab → *Deploy web app* → **Run
   workflow**). When it goes green, your app is live at
   `https://<project-id>.web.app`.

That JSON key *is* a real secret — keep it in the GitHub secret only, never in
the repo.

### Option B — deploy from your own computer (Windows is fine)

1. Install [Node.js](https://nodejs.org) (the LTS installer).
2. Open Command Prompt / PowerShell and run:

   ```bash
   npm install -g firebase-tools
   firebase login
   cd path\to\this\repo
   copy .firebaserc.sample .firebaserc
   ```

3. Open `.firebaserc` and put your project id in place of the placeholder.
4. Deploy:

   ```bash
   firebase deploy --only hosting
   ```

   To push the Firestore rules from the repo at the same time:

   ```bash
   firebase deploy --only hosting,firestore:rules
   ```

   Only add `,storage` to that list if you actually enabled Storage in step 5 —
   otherwise the deploy fails on a bucket that does not exist.

The URL is printed at the end.

---

## Step 7 — Install it on your iPhone

1. Open the `https://<project-id>.web.app` URL in **Safari** (it must be
   Safari — Chrome on iOS cannot install web apps).
2. Tap the **Share** button → scroll → **Add to Home Screen** → Add.
3. Launch it from the home screen. It runs full-screen with no browser bars,
   keeps working when you lose signal, and remembers where you were.

---

## Things worth knowing

**Each device is its own user.** Anonymous sign-in gives *this browser* an id.
Your iPhone and your laptop will therefore hold **separate** trips, and clearing
Safari's website data starts a fresh one. To have one trip across devices the app
needs real sign-in (Apple, Google or email) — a small addition; ask and it can
be wired in.

**Your data is private to that id.** The Firestore rules only allow reads and
writes under `users/{your-uid}`, so nobody else's browser can reach your trip.

**First launch seeds the demo trip** — the Meridian City itinerary from the
design, so every screen has something in it. Editing, removing and adding all
work on it; there is no "start an empty trip" button yet.

**Photos** are downscaled in the browser before they go anywhere, so uploads are
quick on hotel wifi and nothing depends on the paid plan.

**The map** uses OpenStreetMap tiles (free, no key). The demo trip's coordinates
are real central-Tokyo ones, so streets line up under the route. The
Google Maps / Apple Maps buttons hand off to the real apps on your phone.

**After you deploy an update**, the app picks it up on next launch; the service
worker fetches from the network first and only falls back to its cache offline.

**A patch of map can be kept on the phone.** Trip settings → *Map kept on this
phone* → *Keep an area*. Draw a box, pick streets or doorways, and it downloads
once, two tiles at a time. Above 1,500 tiles it refuses rather than throttling —
OpenStreetMap's servers are run by volunteers and bulk downloading is not what
they are for. That cache is deliberately un-versioned, so deploying an update
never wipes a download you made in a hotel.

**Unsent changes are visible.** The chip beside the trip name carries a dot:
solid when everything has reached the cloud, hollow while a write is in flight,
amber when something is queued. A change older than a day, or one refused for a
reason that will not fix itself, gets a strip above the tab bar and its own
screen (Trip settings → *Changes on this phone*) that says why, what would be
lost, and offers to save a copy off the phone.

**Sharing a trip is built, but it needs a real sign-in to be useful.** Trip
settings → *Share this trip* makes a link with a role (can edit / can read) and
an expiry. The rule the whole thing hangs on: the schedule syncs and last edit
wins; the shopping list is copied once and then both lists are separate; and
what you have bought, what you have packed and your whole Log never leave your
phone. Today anonymous sign-in gives each browser its own id, so two phones
cannot yet reach the same trip document — the link, the roles and the change
feed all work, but the trip has to be on the same device. Wiring up Apple or
Google sign-in and the matching Firestore rules is the remaining piece; ask and
it can be done.

## If something looks wrong

| Symptom | Cause |
|---|---|
| Everything works but nothing syncs; console says "No Firebase config" | `web/js/config.js` is still empty (step 2) |
| Data disappears on refresh | Rules not published (step 4), or the browser is in private mode |
| Map is blank grey | No network for tiles, or a tile blocker/VPN |
| Photos save as small thumbnails | Storage not enabled — expected, see step 5 |
| "That is as many photos as fit…" | ~55 thumbnails per day is the limit without Storage |
| GitHub Action fails on "Read and check the Firebase config" | `config.js` was committed still empty (step 2) |
| GitHub Action fails on "Check the deploy credential exists" | The `FIREBASE_SERVICE_ACCOUNT` secret is missing or misnamed |
| Action fails inside "Deploy to Firebase Hosting" | Usually the service-account JSON is truncated — re-copy the whole file |
