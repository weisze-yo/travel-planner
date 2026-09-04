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
| **Firestore** | Stores your trips, and the snapshot behind a share link |
| **Authentication** | Google, or a link sent to your email — so a trip survives losing the phone |
| **Storage** (optional) | Holds photos you attach to notes |

All of that fits in the **free Spark plan**. No card needed, except that some
new projects now ask for the paid Blaze plan to switch Storage on — if yours
does, skip Storage. Everything except photo upload still works.

### About Apple sign-in

**Sign in with Apple is not offered, and adding it would cost you $99 a year.**
On the web it is not just a switch in the Firebase console: it needs a Services
ID, a registered return URL and a Sign in with Apple private key, and all three
are created in the Apple Developer portal, which requires a paid Apple Developer
Program membership. Google and an emailed link cover everyone, including people
on an iPhone, so the app asks for neither a password nor a developer account.

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
   **`web/js/config.js`**, replacing what is there:

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
> browser and nobody can sign in. Handy for a first look.

## Step 3 — Turn on the two ways of signing in

1. Left sidebar → **Build → Authentication → Get started**.
2. **Sign-in method** tab → **Add new provider** → **Google** → toggle
   **Enable**.
   - *Public-facing name*: `Travel Planner` — this is the name people see on
     the Google sheet, so it should be the app's, not the project id's.
   - *Support email*: pick your own address from the list.
   - **Save**.
3. **Add new provider** → **Email/Password**. Turn on **both** switches:
   - **Email/Password** — enable.
   - **Email link (passwordless sign-in)** — enable. This is the one the app
     actually uses: it sends a link, you open it, you are in. There is no
     password anywhere in the app, so there is none to reset or to leak.
   - **Save**.
4. **Anonymous**: if it is already on, leave it on until every phone that has
   used the app has signed in once — an older build gave each browser an
   anonymous id, and signing in *links* that id rather than replacing it, so
   the trips under it come along. Once everyone has signed in, turn it off.
   New phones are never given one.
5. Still in Authentication → **Settings → Authorized domains**. Check that
   **`<project-id>.web.app`** and **`<project-id>.firebaseapp.com`** are listed
   (they are added for you). Add a custom domain here too if you ever use one —
   a domain that is not on this list cannot sign anybody in.

## Step 4 — Create the database and paste the rules

1. **Build → Firestore Database → Create database**.
2. Choose **Production mode** (the rules below are what make it safe).
3. Location: **`asia-southeast1` (Singapore)** — closest to Malaysia. This
   cannot be changed later.
4. Once created, open the **Rules** tab, delete what is there, paste the whole
   contents of **`firebase/firestore.rules`**, and press **Publish**.

Without step 4, production mode blocks everything and the app falls back to
saving in the browser only.

Those rules cover two collections, and it is worth knowing which is which:

- **`users/{your-uid}/…`** — your trips. Only the account that owns them can
  read or write them, whatever another browser claims to be.
- **`published/{link-code}`** — the snapshot behind one share link. Anyone
  holding the code can read it, which is what makes a link work on a phone
  that has never seen your trip. Nobody can *list* the collection, so codes
  cannot be collected. Only the trip's owner and the people the owner gave
  *can send updates* to may write it.

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

## Step 8 — Sign in, once, on each phone

1. Open the app → **My trips** → the row at the top says *Everything is on this
   phone* → **Sign in**.
2. **Continue with Google**, or type an address and **Send me a link**, then
   open that link on the same phone.
3. Anything you have already made on that phone moves into the account, keeping
   the ids it already had — so a link you have handed out still points at the
   same trip, and every note still has your name on it.

The one thing that does not move is the sample trip (Meridian City). It belongs
to a phone that has never signed in, not to an account, and it stays on the
phone: sign out and it is there again.

---

## Things worth knowing

**A new account starts empty.** No demo, no example trip — an account with
nothing in it says so and offers *+ New trip*. The sample trip appears only on
a phone where nobody has ever signed in, so that the screens have something in
them before you have made anything.

**Your trips are private to your account.** The Firestore rules only allow
reads and writes under `users/{your-uid}`, so nobody else's browser can reach
them.

**Sharing works between two phones now.** Trip settings → *Share this trip*
makes a link with a role (can send updates / receives updates) and an expiry.
Whoever opens the link gets **their own copy** of the itinerary, the sub routes,
the places and the must-see spots. What they change is theirs; what you change
is yours; and when either of you presses *Send an update* the other side is told
and takes it **one change at a time**. Your shopping list, your packing list,
what you have bought or packed, and your whole Log never travel at all.

The link is a capability: anyone holding the code can read the snapshot, which
is what makes it work on a phone that has never seen your trip. Switch it off in
the share sheet and it stops working for everyone — that reaches the other phone
too, so a link you have turned off really is off.

**You have to be signed in to share between phones.** Making a link without an
account still works, but the snapshot can only reach that browser — the rules
have no uid to check, so nothing is published. Sign in first and the same link
starts working everywhere.

**Signing in on a second phone brings your trips with you**, because they live
in the account rather than in the browser. Clearing Safari's website data no
longer loses anything, as long as you have signed in.

**Photos** are downscaled in the browser before they go anywhere, so uploads are
quick on hotel wifi and nothing depends on the paid plan.

**The map** uses OpenStreetMap tiles (free, no key). The Google Maps / Apple Maps
buttons hand off to the real apps on your phone.

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

## If something looks wrong

| Symptom | Cause |
|---|---|
| Everything works but nothing syncs; console says "No Firebase config" | `web/js/config.js` is still empty (step 2) |
| *Sign in* does nothing, console says `auth/operation-not-allowed` | That provider is not enabled yet (step 3) |
| Console says `auth/unauthorized-domain` | The domain you opened the app on is not in Authentication → Settings → Authorized domains (step 3.5) |
| The emailed link says it has expired or been used | A sign-in link works once. Ask for another from the same screen |
| The Google window opens and closes with nothing happening | The popup was dismissed; the app falls back to a full-page redirect on the next try |
| Data disappears on refresh | Rules not published (step 4), or the browser is in private mode |
| A share link opens a blank or "cannot reach it" screen | The rules are not published, or that phone has no signal — the link keeps working, so try it again with some |
| Map is blank grey | No network for tiles, or a tile blocker/VPN |
| Photos save as small thumbnails | Storage not enabled — expected, see step 5 |
| GitHub Action fails on "Read and check the Firebase config" | `config.js` was committed still empty (step 2) |
| GitHub Action fails on "Check the deploy credential exists" | The `FIREBASE_SERVICE_ACCOUNT` secret is missing or misnamed |
| Action fails inside "Deploy to Firebase Hosting" | Usually the service-account JSON is truncated — re-copy the whole file |
