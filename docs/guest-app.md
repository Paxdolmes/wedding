# Guest app — work in progress

Daniel chose native iPhone/Android apps (Expo, in `mobile/`), sharing one backend with a web version at `/app/`.

## Done
- `worker/`: Cloudflare Worker + one SQLite Durable Object (`WeddingHub`) serving `/api/*`: guests, guest list & seating,
  Web Push (VAPID + aes128gcm, verified by decrypting with `http_ece`) and Expo push, scheduled/grouped notifications sent in
  batches by alarms, disposable-camera photos (20 shots, gallery opens 25 Aug 2028 9am), song requests + votes, DJ board,
  Battle of the Bangers bracket, predictions with scoring, helper/DJ codes. Smoke-tested end to end under `wrangler dev`.
- `src/app/` + `app/index.html` + `public/app/`: web guest app and host/helper/DJ screens (builds, not yet browser-tested).
- `src/Monogram.tsx`: I & D monogram ringed with "Imogen & Daniel Holmes · XXIV · VIII · MMXXVIII".

## Next
- `mobile/`: fresh Expo SDK 58 scaffold only; `npx expo install` of router/notifications/camera/skia etc. failed on network, retry.
  Build screens mirroring `src/app/screens`, register Expo token via `POST /api/push/expo`, film filter with Skia.
- App icons in `public/app/icons/` (192, 512, maskable-512, apple-touch-icon, badge-96) rendered from the monogram.
- Playwright tests for `/app/`, then PR.
- Cloudflare: add secret `HOST_PASSCODE` (couple's passcode). Locally put it in `.dev.vars`.
