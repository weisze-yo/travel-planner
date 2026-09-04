# The two-phone test, run by machine

Sharing is the one feature that cannot be checked on one device, and checking
it by hand means two phones, two accounts and a wait for an email. This runs
the whole thing in about a minute.

Two browser contexts with nothing in common — separate storage, separate
accounts, separate trips. Between them sit the real Firebase SDK, the real
Auth emulator and the real Firestore emulator running `firebase/firestore.rules`.
Sign-in is the app's own email-link flow: the test asks for a link, reads it
out of the Auth emulator, and opens it. Nothing is stubbed.

## Running it

```sh
test/setup.sh          # once: vendors the SDK locally, installs firebase-tools
```

Then three terminals from the repo root:

```sh
test/node_modules/.bin/firebase emulators:start \
  --config firebase.emulators.json --project travel-planner-3e0d3 --only auth,firestore
node test/serve.mjs    # web/ on :8123, with Hosting's rewrite so /j/CODE works
node test/two-phones.mjs
```

29 checks. It prints each as it goes and exits non-zero on any failure.

## What it covers

- A phone with no account saves locally; signing in by email link moves it to
  Firebase and strands nothing.
- A signed-in account can create a trip and write stops that really land in
  Firestore.
- A share link publishes an envelope to `published/{code}` carrying the
  itinerary — and **none** of `shopping`, `prep`, `log`, `outfits`.
- A stranger holding only the link sees the trip, with real stops, without
  being asked to sign in first.
- Joining forks: their own trip, their own account, the itinerary but none of
  the owner's private kinds.
- One account cannot read another account's trip. The rules are Google's own
  engine, not a re-implementation.
- An update crosses between the two devices, arrives as exactly one decision
  with both versions shown, does not move the far side's day on its own, and
  writes through when taken.

## The other one

`test/refused-rules.mjs` reproduces the failure that looks like "sharing is
completely broken": rules that refuse everything. Swap
`firebase/firestore.rules` for a deny-all ruleset, run it, and the app should
say so in words that name the fix rather than blaming the network.

## What no emulator can tell you

Whether the **console** is configured: whether Google and email-link sign-in
are switched on, and whether the rules in the Firebase console are the ones in
this repo. Two read-only probes against the real project, needing no
credentials:

```sh
KEY=$(sed -n 's/.*apiKey: "\([^"]*\)".*/\1/p' web/js/config.js)
P=$(sed -n 's/.*projectId: "\([^"]*\)".*/\1/p' web/js/config.js)

# Authorised domains must include <project>.web.app and .firebaseapp.com
curl -s "https://identitytoolkit.googleapis.com/v1/projects?key=$KEY"

# Should be 404 NOT_FOUND. A 403 PERMISSION_DENIED means the rules in the
# console are NOT the ones in this repo — `allow get: if true` on
# published/{code} is what lets a link work on a phone that has never seen
# the trip.
curl -s -o /dev/null -w '%{http_code}\n' \
  "https://firestore.googleapis.com/v1/projects/$P/databases/(default)/documents/published/PROBE-ONLY?key=$KEY"
```
