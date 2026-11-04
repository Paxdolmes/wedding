# Imogen & Dan — Save the date

React + TypeScript + Vite, with Motion for the envelope and GSAP for the page. A textured ivory envelope is set down
under dappled garden light, its olive wax seal pressed in and the address written by hand. Pressing the seal cracks it,
lifts the flap and draws out a gatefold card; a champagne bottle pops its cork as the card opens, petals are thrown and
"You're invited!" is written in gold before the card flies forward into the page. The page is laid out in numbered
chapters: the invitation, the day hour by hour, the venue, food and drink, Friday at The Crabtree, dress code, where to
stay and a gallery of photos, each arriving with its own scroll animation.

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
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium npm test
```

The cloud environment has Chromium at `/opt/pw-browsers/chromium`. Elsewhere, run
`npx playwright install chromium`, then `npm test` without the executable override.
Tests cover desktop and mobile Chromium; check real phones before publication.

## Edit content

- `src/wedding.ts`: names, display date, venue.
- `src/EnvelopeIntro.tsx` and CSS: the opening, from the envelope being set down to the card filling the screen; reduced-motion access skips the animation.
- `src/Champagne.tsx` and CSS: the bottle, its cork, the flash and the mist; the spray itself is drawn by the particle canvas.
- `src/Ambience.tsx` and `src/assets/scene/`: the branch shadows and drifting dust over the envelope.
- `src/WaxSeal.tsx` and `src/crack.ts`: sculpted SVG wax seal and the line it cracks along.
- `src/confetti.ts` and `src/Celebration.tsx`: one canvas for the champagne spray, the thrown petals and the petals that drift down over the page.
- `src/Invitation.tsx`: the invitation itself (names, date, calendar link, countdown), the "If you're reading this" note, dress code and footer.
- `src/SectionHeading.tsx`: the numbered chapter heading every section shares.
- `src/SiteHeader.tsx` and CSS: monogram, chapter links, reading progress and the phone menu.
- `src/pageAnimations.ts`: every GSAP entrance and scroll animation on the page (SplitText headings, photo prints developing, the timeline drawing itself, festoon lights). `src/usePageAnimations.ts` loads it in the background while the envelope is on screen.
- `src/dayDetails.ts`: order of the day, menu, wines and the Friday beer-garden plan (pub name, first-date time). Empty timeline times show "Time to follow".
- `src/Details.tsx` and CSS: Thursday note, timeline, food & drink, Friday festoon lights and first-date counter.
- `src/Venue.tsx`, CSS and `src/assets/venue/`: Caswell House photos and the watercolour (its paper is transparent, so it sits on the page's paper).
- `src/App.tsx` and `src/App.css`: page layout, section bands, the invitation and dress code styles.
- `src/index.css`: colours, fonts and shared tokens. Fonts are Cormorant Garamond, Jost and Pinyon Script, bundled and self-hosted through Fontsource; all three are under the SIL Open Font License, which ships with each package.
- `src/Accommodation.tsx` and CSS: hotel photos, driving estimates, map links and expandable price context.
- `docs/hotel-photo-sources.md`: official hotel photograph sources.
- `public/save-the-date.ics`: calendar event; change separately when the date changes. End date is exclusive. No ceremony time has been assumed.
- `src/photos.ts` and `src/assets/photos/`: all ten original photos, alternative text and captions; duplicate Colosseum upload omitted.
- `src/PhotoStory.tsx` and CSS: featured engagement portrait and responsive gallery.
- `src/hotels.ts`: four hotels with actual August 2027 Thursday price samples.
- `docs/accommodation-research.md`: dates, room types, rates and sources. Sample averages are not confirmed 2028 quotes.

The venue is Caswell House, Brize Norton, Oxfordshire, OX18 3NJ. There is no RSVP database yet.

## Publish through Cloudflare Workers

1. Review content and check on real phones.
2. Push the reviewed project to the selected GitHub repository.
3. Connect the `imogenanddan` Cloudflare Worker to `Paxdolmes/wedding`, production branch `main`.
4. Use Node 24, build command `npm run build`, deploy command `npx wrangler deploy`, repository root as project root. `wrangler.jsonc` sets the Worker name, required compatibility date and `dist` asset directory. The existing command `npx wrangler deploy --assets ./dist --name imogenanddan` also works with this configuration.
5. Test the Cloudflare-provided deployment address.
6. Add `imogenanddan.com` in the Worker's Domains tab; add `www.imogenanddan.com` if desired.
7. Check HTTPS, opening interaction, calendar download and hotel links before sharing.

Environment publication is separate from website deployment. Keep committed work
and a downloadable source archive before rebuilding an environment. This project
uses Cloudflare's GitHub integration to deploy changes pushed to `main`. Check the
latest Cloudflare build result and live domain to confirm publication.
