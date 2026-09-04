#!/bin/sh
# Everything the two-phone test needs, fetched once.
#
# The SDK is copied out of Google's CDN and served from this machine, because
# a test that has to reach a CDN fails for reasons that have nothing to do
# with the app. Same files, same pinned version.
set -e
here=$(cd "$(dirname "$0")" && pwd)
root=$(dirname "$here")
version=$(sed -n "s/.*FIREBASE_SDK = '\([^']*\)'.*/\1/p" "$root/web/js/config.js")
: "${version:?could not read FIREBASE_SDK from web/js/config.js}"

echo "Firebase SDK $version → web/vendor/firebase-local/ (gitignored)"
mkdir -p "$root/web/vendor/firebase-local"
for m in app auth firestore storage; do
  curl -sS "https://www.gstatic.com/firebasejs/$version/firebase-$m.js" \
    | sed "s#https://www.gstatic.com/firebasejs/$version/firebase-app.js#./firebase-app.js#g" \
    > "$root/web/vendor/firebase-local/firebase-$m.js"
  echo "  firebase-$m.js"
done

echo "firebase-tools → test/node_modules/"
cd "$here" && npm install --no-fund --no-audit --silent firebase-tools@13
echo
echo "Now, in three terminals from the repo root:"
echo "  1. test/node_modules/.bin/firebase emulators:start --config firebase.emulators.json --project \$(sed -n 's/.*projectId: \"\([^\"]*\)\".*/\1/p' web/js/config.js) --only auth,firestore"
echo "  2. node test/serve.mjs"
echo "  3. node test/two-phones.mjs"
