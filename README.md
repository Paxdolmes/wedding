# Imogen & Dan — Save the date

React + TypeScript + Vite + Motion. An olive envelope with a gold wax seal opens
to reveal the date, an all-day calendar download, engagement photo, dress-code
note, nearby accommodation and a gallery of the nine other supplied photos.

## Develop

Node.js 24 LTS and npm. From this repository:

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

No application API keys are required. Use the existing checkout in cloud tasks;
do not create a worktree unless requested. Processes need restarting after an
environment restoration.

## Validate

```sh
npm run build
npm run lint
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm test
```

The cloud environment has system Chromium. Elsewhere, run
`npx playwright install chromium`, then `npm test` without the executable override.
Tests cover desktop and mobile Chromium; check real phones before publication.

## Edit content

- `src/wedding.ts`: names, display date, venue.
- `src/App.tsx` and `src/App.css`: invitation and dress code.
- `public/save-the-date.ics`: calendar event; change separately when the date changes. End date is exclusive. No ceremony time has been assumed.
- `src/photos.ts` and `src/assets/photos/`: all ten original photos, alternative text and captions; duplicate Colosseum upload omitted.
- `src/PhotoStory.tsx` and CSS: featured engagement portrait and responsive gallery.
- `src/accommodation.ts`: four hotels with actual August 2027 Thursday price samples.
- `docs/accommodation-research.md`: dates, room types, rates and sources. Sample averages are not confirmed 2028 quotes.

The venue is Caswell House, Brize Norton, Oxfordshire, OX18 3NJ. There is no RSVP database yet.

## Publish later through Cloudflare Pages

1. Review content and check on real phones.
2. Push the reviewed project to the selected GitHub repository.
3. Create a Cloudflare Pages project and connect the repository. Select the branch containing the code.
4. Use Node 24, build command `npm run build`, output directory `dist`, repository root as project root.
5. Test the Cloudflare-provided deployment address.
6. Add `imogenanddan.com` in the Pages project's custom domains and follow its DNS instructions; add `www` if desired.
7. Check HTTPS, opening interaction, calendar download and hotel links before sharing.

Environment publication is separate from website deployment. Keep committed work
and a downloadable source archive before rebuilding an environment. This project
has not deployed a website or changed DNS.
