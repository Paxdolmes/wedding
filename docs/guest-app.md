# Guest app

Imogen & Dan's wedding-weekend app comes in three parts that share one backend:

| Part | Where | Who uses it |
| --- | --- | --- |
| iPhone & Android app | `mobile/` (Expo / React Native) | Guests, plus the couple, helpers and DJ |
| Web version | `imogenanddan.com/app/` (`src/app/`, `app/index.html`, `public/app/`) | Guests without the app, and the couple on a laptop |
| Backend | `worker/` (Cloudflare Worker + one SQLite Durable Object) | Both of the above, at `/api/*` |

## What it does

- **Push notifications** to everyone, to tables or to groups (for example *Bridal party*, *Friday pub*), sent now or
  scheduled. Ready-made messages include "🍸 The bar is open", "🪩 Dancefloor alert" and "🚨 Last orders". The couple
  sign in with their passcode; the best man and maid of honour get a helper code that lets them send too. Every
  notification also lands in the app's message list, so nobody misses one.
- **Find My Seat**: a sealed place card until the couple reveal the seating plan, then an animated reveal of the
  table, where you sit and a short introduction to the people either side.
- **Disposable camera**: 20 shots per guest (adjustable). Before the first shot a "film box" sets the rules: use them all but
  make them count, no peeking, and every photo is shared with everyone the morning after. Each photo gets a vintage-film look (faded warm tones, grain, vignette,
  a light leak and an orange date stamp). No previews; every guest's photos develop together at 9am the morning
  after, or whenever the couple press "Develop the photos now".
- **Song requests and voting**, a live **DJ board** (DJ code) with Played/Hide, and **Battle of the Bangers**: the
  top 4, 8 or 16 requests go head to head, round by round, until there's a champion.
- **Predictions competition** with multiple-choice and closest-number questions, a leaderboard and points.
- **Countdown** to 2pm on Thursday 24 August 2028.
- **The I & D monogram**, ringed with "Imogen & Daniel Holmes · XXIV · VIII · MMXXVIII". It's in `src/Monogram.tsx`
  and `mobile/src/Monogram.tsx`; `node scripts/render-icons.mjs` turns it into every app icon.

## One-time setup

### 1. Cloudflare (backend)

Merging to `main` deploys the backend with the website. The Durable Object that stores everything is created
automatically on that deploy; there's nothing else to provision.

Then add the couple's passcode as a secret: Cloudflare dashboard → Workers & Pages → **imogenanddan** → Settings →
Variables and Secrets → Add → type **Secret**, name `HOST_PASSCODE`, value: a passcode only Imogen and Dan know.
Until it's set, nobody can sign in to the host screen.

### 2. App Store and Google Play accounts

- Apple Developer Program, $99 a year: <https://developer.apple.com/programs/enroll/>
- Google Play Console, $25 once: <https://play.google.com/console/signup>
- A free Expo account: <https://expo.dev/signup>

### 3. Build and publish the app

From a computer with Node.js 22 or newer:

```sh
cd mobile
npm ci
npx eas-cli@latest login
npx eas-cli@latest init          # links the app to your Expo account and adds its project ID to app.json
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

The first iOS build asks to sign in to Apple and offers to create the certificates and the push-notification key;
say yes to all of them. For Android notifications, follow Expo's FCM guide once
(<https://docs.expo.dev/push-notifications/fcm-credentials/>). Expo builds in the cloud, so no Xcode or Android
Studio is needed. To try the app on your own phone before it's in the stores, build with `--profile preview`.

Commit the `app.json` change that `eas init` makes.

### 4. Updates without a new build

The app includes Expo Updates, and `mobile/.eas/workflows/publish-update.yml` publishes the latest app code to the
`production` channel on every push to `main`. Phones pick it up the next time the app is opened.

1. In the Expo project, go to **Project settings → GitHub**, connect the `Paxdolmes/wedding` repository and set the base
   directory to `mobile`.
2. Production builds use the `production` channel (`eas.json`), so they receive these updates.

Changes to screens, wording and styling go out this way. Adding a native library, changing a plugin in `app.json` or
changing permissions still needs a new build. When you do that, bump both `version` and `runtimeVersion` in `app.json`
so older builds don't receive code they can't run. (`runtimeVersion` is a plain value rather than a policy because Expo
Launch prebuilds the native project, and EAS doesn't allow runtime version policies once a native folder exists.)

## Before and during the weekend

1. **Guest list and seating**: on a laptop, open `imogenanddan.com/app/#host` → Guests, and paste one guest per line:
   `Name | Table | Seat | Groups | A line about them`. Guests who join with the same name are matched automatically;
   anyone else can find their name on the My Seat screen.
2. **Helper codes**: Settings → create a helper code each for the best man and maid of honour, and a DJ code.
3. **Optional guest code**: Settings → Guest code, if you'd rather strangers with the link couldn't join.
4. **Battle of the Bangers**: once there are enough requests, Games → Start the battle, then close each round when
   you like.
5. **On the day**: reveal the seating plan, schedule notifications ahead of time, lock predictions before the
   ceremony, and fill in the answers as they happen.

## Develop

```sh
npm run dev                       # website and web app on :5173 (proxies /api to :8787)
echo 'HOST_PASSCODE=test-passcode' > .dev.vars
npx wrangler dev --port 8787      # backend (run `npm run build` first so ./dist exists)
cd mobile && npx expo start       # the native app; set extra.apiBase in app.json to test against your own backend
```

`npm test` starts both servers itself and covers the invitation and the web guest app. In `mobile/`,
`npx tsc --noEmit` and `npx expo export --platform ios` (and `android`) check that the app compiles.

Not yet verified on real phones: native push delivery, the camera and the Skia film filter
(`mobile/src/film.ts`). The web version's filter (`src/app/film.ts`) and every backend route are tested here.
