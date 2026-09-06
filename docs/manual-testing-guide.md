# Manual testing guide — the three tests automation cannot do

**Written 6 Sep 2026, against production commit `2a200a3`.**
**Live app:** https://travel-planner-3e0d3.web.app

Everything else in this milestone is covered by 458 automated checks plus a
65-check two-device emulator run. These three need a real phone, a real
browser install prompt, or a real screen reader — things a headless browser
cannot honestly stand in for.

**You do not need to read any other document to run these.** Work top to
bottom. If something does not match, stop at that step and record what you
saw; do not try to fix it.

---

## Things that are true for all three tests

| | |
|---|---|
| **URL** | `https://travel-planner-3e0d3.web.app` — type it exactly, no `www`, no trailing slash needed |
| **Login** | **Not needed** for Test 1 or Test 2. Test 3 needs a signed-in account on a *second* device — explained there. |
| **What you should see first** | The app opens on the **Map** screen, showing a demo trip called *Meridian City · Group Tour*. That is correct and expected. |
| **How to reach "My trips"** | Tap the **trip name box at the top-left of the Map screen** (it says *Meridian City · Group Tour* with a small round mark beside it). That opens the My trips list. |
| **What counts as a "launch"** | Every time the page loads. Closing the tab and reopening the URL counts. **Pulling down to refresh also counts.** |

> **A note on the map being grey.** The map picture may not load and you may
> see an amber card saying `NO MAP PICTURE`. That is correct, intended
> behaviour, not a fault. Ignore it for these tests.

---
---

# TEST 1 — Real Android install

## PREPARATION

**Device**
- A physical Android phone or tablet. Android 8 or newer.
- An emulator is fine only if it has Google Play services; a bare AVD will not
  offer to install.
- **An iPhone cannot run this test.** That is the point of Test 2.

**Browser**
- **Google Chrome for Android.** Not Samsung Internet, not Firefox, not the
  in-app browser inside WhatsApp/Instagram/Gmail.
- If you are unsure, open the app drawer and launch the app named *Chrome*
  with the red/yellow/green circle icon.

**Before you start — put the phone in a clean state**
1. Open Chrome.
2. Tap the **⋮** menu (top-right) → **History** → **Delete browsing data**.
3. Set *Time range* to **All time**, tick **Cookies and site data** and
   **Cached images and files**, tap **Delete data**.
4. If the Travel Planner is *already installed* on this phone, uninstall it:
   long-press its home-screen icon → **Uninstall** (or drag to *Uninstall*).
   **The install line will never appear while the app is already installed —
   that is deliberate.**

**Login:** not required. Do not sign in.

## STEPS

1. In Chrome, go to `https://travel-planner-3e0d3.web.app`.
   **You should see:** a brief *Loading your trip…* screen, then the **Map**
   screen with the trip name at the top-left.

2. Tap the **trip name box at the top-left**.
   **You should see:** the **My trips** screen — a heading *My trips*, a line
   underneath saying how many trips there are, and a trip card.

3. **Look carefully at this screen. There should be NO install line yet.**
   Scroll the whole screen top to bottom to be sure.
   **You should see:** no sentence anywhere about the home screen, and no
   button labelled *Add it*.

4. Close the tab completely: tap the **tabs button** (a square with a number
   in it, top-right), then tap the **✕** on the Travel Planner tab.

5. Open a new tab and go to `https://travel-planner-3e0d3.web.app` again.
   *(This is now the second launch.)*

6. Tap the **trip name box at the top-left** to reach **My trips** again.

7. **Look just under the account row** — the row near the top that says
   *Everything is on this phone* with a *Sign in* button on the right.
   **You should see:** a small grey sentence and two controls, reading:

   > This trip works with no signal. Keep it on your home screen and it opens
   > like an app.  **[ Add it ]  ✕**

8. Tap **Add it**.

9. **You should see:** Chrome's own install dialog slide up from the bottom of
   the screen. It is a Chrome dialog, not part of the app. It typically shows:
   - the app icon,
   - the title **Travel Planner**,
   - the address `travel-planner-3e0d3.web.app`,
   - two buttons: **Cancel** and **Install**.

10. Tap **Install**.

11. Press the phone's **Home** button and look at your home screen.

## EXPECTED RESULT

- Nothing on the first launch.
- The line appears on the second launch, on My trips, below the account row.
- Tapping **Add it** opens Chrome's install dialog.
- After installing, a *Travel Planner* icon is on the home screen, and opening
  it launches the app **full-screen with no Chrome address bar**.

## PASS

All of the following are true:

1. On the **first** launch, no install line anywhere on My trips.
2. On the **second** launch, the line appears, with exactly this wording:
   *"This trip works with no signal. Keep it on your home screen and it opens
   like an app."* plus an **Add it** button and a **✕**.
3. The line is small grey text — a quiet line among the other lines, **not** a
   coloured banner, **not** a pop-up, and it does **not** cover the screen.
4. Chrome's own install bar/pop-up did **not** appear by itself at any point
   before you tapped **Add it**.
5. Tapping **Add it** opens Chrome's install dialog.
6. After installing, the app opens from the home-screen icon with no address
   bar.

## FAIL

Any one of these is a failure — record which:

- **F1** — the line appears on the **first** launch.
- **F2** — Chrome's install bar/pop-up appears on its own, without you tapping
  **Add it**.
- **F3** — the line never appears on the second launch (see *If the dialog
  does not appear* below first — it may not be a failure).
- **F4** — the wording differs from step 7.
- **F5** — it renders as a big banner, a card, or anything that blocks or
  covers content.
- **F6** — tapping **Add it** does nothing, or shows an error.
- **F7** — the line is still there after you installed the app.
- **F8** — tapping **✕** does not remove it, or it comes back after a reload.

## If the install line or the dialog does not appear

Work through these **before** recording F3 — most of the time it is one of
these, and none of them is a fault in the app:

1. **Are you actually in Chrome?** Not Samsung Internet, not an in-app browser.
2. **Is the app already installed?** Check the home screen and the app drawer.
   Uninstall it and start again from PREPARATION.
3. **Did the second load really happen?** Pull down to refresh once, then look
   again. A refresh counts as a launch.
4. **Did you dismiss it earlier?** If you ever tapped the **✕**, it is
   remembered on purpose. Clear browsing data (PREPARATION step 2) and start
   again.
5. **Chrome sometimes waits.** Chrome will not offer to install until it
   considers the site "engaged with". Scroll around the app for ~30 seconds,
   tap into a couple of screens, then return to My trips.
6. **Data Saver / Lite mode off?** ⋮ → **Settings** → make sure Lite mode is
   off.

If the line still does not appear after all six, that is **F3** and worth
reporting.

## EVIDENCE TO CAPTURE

Take a screenshot on Android with **Power + Volume Down** together.

**If it passes**, one screenshot is enough: the My trips screen showing the
line (step 7).

**If it fails**, capture:
1. A screenshot of **My trips on the first launch** (step 3).
2. A screenshot of **My trips on the second launch** (step 7) — even if the
   line is absent; the absence is the evidence.
3. If a dialog appeared wrongly (F2), a screenshot of it.
4. **A short screen recording** is far more useful than stills for F6 or F8 —
   swipe down twice from the top and tap **Screen record**.
5. Please also tell me: your **Android version** (Settings → About phone) and
   your **Chrome version** (Chrome ⋮ → Settings → About Chrome).

---
---

# TEST 2 — iOS Safari never shows the Android line

This is the mirror of Test 1: proving the line **never** appears where it
should not. It is quick.

## PREPARATION

**Device**
- A physical iPhone or iPad. iOS 15 or newer.

**Browser**
- **Safari.** The blue compass icon. Not Chrome-on-iOS, not an in-app browser.

**Before you start**
1. Open **Settings** → **Safari** → scroll down → **Clear History and Website
   Data** → confirm.
2. If Travel Planner is already on your home screen, long-press its icon →
   **Remove App** → **Delete App**.

**Login:** not required. Do not sign in.

## STEPS

1. Open **Safari** and go to `https://travel-planner-3e0d3.web.app`.
   **You should see:** the loading screen, then the **Map** screen.

2. Tap the **trip name box at the top-left** to reach **My trips**.

3. Scroll the whole My trips screen from top to bottom. **Look for any
   sentence about the home screen, and for any button labelled *Add it*.**
   **You should see:** none.

4. Close the tab: tap the **tabs button** (two overlapping squares, bottom
   right) → tap **✕** on the Travel Planner tab.

5. Reopen Safari and go to the URL again. *(Second launch.)*

6. Tap the **trip name box** to reach **My trips**.

7. Scroll the whole screen again, top to bottom.

8. Repeat once more — close the tab, reopen the URL, reach My trips, scroll.
   *(Third launch. Three launches total is enough; the line is designed to
   appear from the second, so three proves it.)*

**Where exactly to look:** the whole My trips screen, but especially the gap
**directly below the account row** — the row that says *Everything is on this
phone* with a *Sign in* button. On Android that is exactly where the line
appears. On iPhone that gap should simply not exist.

## EXPECTED RESULT

Nothing about installing, the home screen, or *Add it* appears at any point,
on any of the three launches.

*(Safari's own **Share → Add to Home Screen** still works and is unrelated to
this test. You are not testing that. Do not use it.)*

## PASS

- No install line on launch 1, 2 or 3.
- No **Add it** button anywhere.
- No sentence mentioning "home screen" anywhere on My trips.

## FAIL

- **F1** — any install line appears on any launch.
- **F2** — an **Add it** button appears anywhere.
- **F3** — any pop-up or banner offers to install the app.

## EVIDENCE TO CAPTURE

Screenshot on iPhone with **Side button + Volume Up** together (or **Home +
Side** on older models).

**If it passes**, one screenshot of My trips on the third launch, scrolled so
the account row is visible, is enough.

**If it fails**, capture:
1. A screenshot showing the line, with enough of the screen around it that I
   can see where it sits.
2. Tell me which launch it appeared on (1st, 2nd or 3rd).
3. Your **iOS version** (Settings → General → About → Software Version).

---
---

# TEST 3 — VoiceOver: a read-only person is not offered a Send control

**What this test is really asking.** A person who was given read-only access
to someone else's trip must not be *told about* a Send button — not even by a
screen reader. The button is not disabled; it is not there at all. A blind
user should hear the explanation instead, and never hear a control they
cannot use.

**Read this first — it needs two devices.** To be a "read-only person" you
have to have joined somebody else's trip through a read-only link. There is no
way to fake that on one phone. Section 3B below is a reduced version if you
only have the iPhone.

---

## PART A — the full test (two devices)

### PREPARATION

**You need**
- **Device 1** — any computer or second phone, any browser. This is the
  *owner*.
- **Device 2** — the iPhone. This is the *read-only person*.
- An email address you can check on Device 1, or a Google account.

**Device 1 must be signed in.** This is not optional: a link made without an
account only works on the phone that made it, so Device 2 would never see the
trip.

**Turn VoiceOver ON and OFF — learn this before anything else**

The single most useful thing to set up first:

1. On the iPhone: **Settings** → **Accessibility** → scroll to the bottom →
   **Accessibility Shortcut** → tap **VoiceOver** so it has a tick.
2. From now on, **triple-click the Side button** (the power button) to turn
   VoiceOver on, and **triple-click again** to turn it off.

**Set this up now.** Without it, turning VoiceOver off again is genuinely
awkward, because taps behave differently while it is on.

**The four gestures you need, and nothing else**

| To do this | Do this |
|---|---|
| Move to the next thing and hear it | **Swipe right** with one finger |
| Move to the previous thing | **Swipe left** with one finger |
| Activate the thing you just heard | **Double-tap** anywhere on the screen |
| Scroll down a page | **Swipe up with three fingers** |

While VoiceOver is on, a single tap only *selects and reads*. It does not
press. Pressing is always a double-tap.

### STEPS

**On Device 1 (the owner):**

1. Go to `https://travel-planner-3e0d3.web.app`.
2. Tap the **trip name box at the top-left** to reach **My trips**.
3. On the account row, tap **Sign in**.
4. Either tap **Continue with Google**, or type your email address and tap
   **Send me a link**, then open the link in your inbox on that same device.
   **You should see:** the account row now shows your name.
5. Tap the trip card to open the trip.
6. Tap the **gear icon** at the top-right of the Map screen → this is **Trip
   settings** → scroll down and tap **Share**.
7. On the Share screen, under **Make a link**, choose the role that says
   **Can only read** *(not the one about sending updates)*.
8. Tap **Create the link**.
   **You should see:** a link appear, something like
   `https://travel-planner-3e0d3.web.app/j/ABCD-1234`.
9. Send that link to yourself — email it, message it, anything that gets it
   onto the iPhone.

**On Device 2 (the iPhone), VoiceOver still OFF for now:**

10. Open the link in **Safari**.
    **You should see:** a *join* screen naming the trip and the person who
    shared it, with a button **Join this trip**.
11. Tap **Join this trip**.
12. A sign-in screen appears. **Tap "Not now"** — you do not need an account
    for this test.
    **You should see:** the trip's **Plan** screen, and a jade box near the
    top saying **YOUR COPY**.
13. Tap the **Map** tab at the bottom, then the **gear icon** top-right, then
    **Share**.
    **You should see:** the Share screen. Because you are the read-only
    person, it should show a jade box headed **YOUR CHANGES**.

**Now turn VoiceOver on:**

14. **Triple-click the Side button.** A voice starts describing the screen.
15. Tap once near the very top of the screen to put the focus there.
16. **Swipe right, one finger, one swipe at a time**, all the way down the
    screen. After each swipe, wait and listen to what is announced. Keep going
    until you hear the same thing twice or reach the bottom.
17. **Write down, or say out loud into a voice memo, everything you hear.**

### EXPECTED RESULT

Going down the screen you should hear, roughly in this order:

- "Back, button"
- "Share this trip" and the trip's name
- "This is your copy of *[owner's name]*'s trip." and a sentence about a
  second, separate share
- "Who has it"
- the owner's name, "Made this trip", and **"OWNER"**
- your own name, **"YOU"**, and a role word such as **"RECEIVES UPDATES"**
- a sentence: *"[owner] looks after who is on this trip and sends its
  updates."*
- **"YOUR CHANGES"** followed by *"Everything you change stays on your copy.
  [owner] sends the updates for this trip."*

**The critical part:** at no point should you hear the word **"button"**
attached to anything about sending. Specifically you must **not** hear:

- "Send, button"
- "Send 3 changes, button"
- "Nothing to send, button"
- "dimmed" or "disabled" attached to any send control

The role words (**OWNER**, **RECEIVES UPDATES**) should be announced as plain
text — **not** as "button". They are labels, not controls.

### PASS

1. No send control of any kind is announced.
2. You hear **"YOUR CHANGES"** and the sentence naming who does send.
3. Nothing is announced as "dimmed" or "disabled".
4. The role words are announced as text, not as buttons.

### FAIL

- **F1** — you hear any send control announced, in any wording.
- **F2** — you hear "dimmed" or "disabled" on anything to do with sending.
- **F3** — the **YOUR CHANGES** block is not announced at all.
- **F4** — a role word (e.g. "RECEIVES UPDATES") is announced as a **button**
  when you are the read-only person.
- **F5** — you hear a person's name announced twice in a row for one row
  (that would mean the little round mark is being read out when it should be
  silent).

### EVIDENCE TO CAPTURE

The easiest and most useful evidence, in order of preference:

1. **A screen recording with sound.** Swipe down from the top-right corner →
   long-press the **Screen Record** button (a filled circle) → turn the
   **Microphone** ON → tap **Start Recording**. VoiceOver's speech is captured
   on the recording. Record yourself swiping down the whole screen once. This
   is one file and it answers everything.
2. If that is difficult: a **Voice Memo** running while you swipe, plus one
   screenshot of the Share screen.
3. If neither: just **type out the list of what you heard**, in order. That is
   genuinely enough.

**Turn VoiceOver off when you are done: triple-click the Side button.**

---

## PART B — the reduced test (iPhone only, if two devices are not possible)

This does **not** prove the read-only case. It proves the opposite half: that
an owner *does* hear a send control, which at least shows VoiceOver reads this
screen properly. **Say clearly in your report that you ran Part B, not Part
A**, so the read-only case stays recorded as unverified.

### STEPS

1. On the iPhone in Safari, go to `https://travel-planner-3e0d3.web.app`.
2. Tap the trip name box → **My trips** → tap the trip card to open it.
3. Tap the **gear icon** → **Share**.
4. Under **Make a link**, pick any role, tap **Create the link**.
5. Triple-click the Side button to start VoiceOver.
6. Swipe right repeatedly from the top of the screen, listening.

### EXPECTED RESULT

Because you are the owner, you **should** hear a send control announced —
something like *"Nothing to send, button, dimmed"* or *"Send 1 change,
button"*. Hearing it here is correct: the whole point is that the owner gets
it and a read-only person does not.

### PASS

- A send control is announced, and the screen reads sensibly top to bottom.

### FAIL

- Nothing is announced at all, or the screen is unreadable with VoiceOver.

### EVIDENCE TO CAPTURE

Same as Part A — a screen recording with the microphone on is best. And please
state plainly: **"Part B only — the read-only case was not tested."**

---
---

# Reporting back

For each test, one line is enough if it passed:

```
Test 1 — Android install: PASS
Test 2 — iOS Safari: PASS
Test 3 — VoiceOver: PASS (Part A)
```

If anything failed, tell me:

```
Test:
Step number where it went wrong:
What I expected:
What actually happened:
Failure code (F1/F2/…):
Screenshot or recording:
Device and OS version:
Browser version:
```

**Do not try to fix anything.** Just report what you saw. If a test cannot be
run at all — no Android device, no second device for Test 3 — say so and it
will be recorded as untested rather than passed.
