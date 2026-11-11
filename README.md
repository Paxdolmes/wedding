# Imogen & Dan — Save the date

React + TypeScript + Vite, with Motion for the envelope and the save-the-date, and GSAP for the full page. A textured
ivory envelope is set down under dappled garden light, its olive wax seal pressed in and the address written by hand.
Pressing the seal cracks it, lifts the flap and draws out a gatefold card; as the card opens, petals are thrown and
"You're invited!" is written in gold before the card flies forward into the page.

**For now the page is only the save-the-date**, laid out like Imogen and Dan's own design: Caswell House in watercolour,
olive sprigs in the corners of a fine frame, the date, "One day. Our favourite people. The beginning of our forever."
and a "Save our date" button that offers Google Calendar, or the calendar file for Apple Calendar and Outlook.
It fits on one screen on most phones and on computers. A small arrow on the card's bottom edge leads to a second card
below: the days to go and the "Yes, it's a Thursday" note on its scrap of paper, both exactly as on the full site
(`src/Countdown.tsx` and `src/ThursdayNote.tsx` are shared), and "More information to come".

Everything else is kept, hidden behind one switch: the full page in numbered chapters (the invitation, the day hour by
hour, the venue, food and drink, Friday at The Crabtree, dress code, where to stay and a gallery of photos, each
arriving with its own scroll animation). Guests don't download any of it while it's hidden. To bring it back, set
`showFullSite` to `true` in `src/wedding.ts`. While developing, open `http://localhost:5173/?full` to see it without
changing the switch (`?full` does nothing on the live site).

## Security and link previews

- `public/_headers`: security headers Cloudflare adds to every page. HTTPS only (HSTS), a content security policy that lets pages load scripts, styles, fonts, images and data only from this site, no framing by other sites, no MIME sniffing, a strict referrer policy, and the camera allowed only in the guest app. If you ever add something from another site (a map embed, an analytics script), add its address to the matching part of the policy or the browser will block it.
- `worker/hub.ts`: the guest app's API. Ten wrong host or helper codes from one connection lock it out for 15 minutes, uploaded photos must really be JPEGs, notifications can only link to pages of this site, and API answers can't be sniffed, framed or cached.
- `index.html`: the title, description and preview card (`public/share.jpg`, 1200 × 630) used when the link is shared, plus plain-text wedding details for anything that reads the page without JavaScript, including the web filters that categorise sites.
- `public/robots.txt` and the guest app's `noindex`: the save-the-date can be indexed; the guest app and its API are kept out of search engines.
- In the Cloudflare dashboard for imogenanddan.com, turn on SSL/TLS → Edge Certificates → **Always Use HTTPS** (and DNSSEC under DNS settings). These are account settings, not code.

## Guest app

The wedding-weekend app (push notifications, Find My Seat, a disposable camera, song requests, Battle of the Bangers
and predictions) is an iPhone and Android app in `mobile/`, a web version at `/app/`, and a backend in `worker/`.
Setup, publishing to the App Store and Google Play, and how to run it on the day: [docs/guest-app.md](docs/guest-app.md).

## Develop

Node.js 24 LTS and npm. From this repository:

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

No application API keys are required. The guest app's host screen needs `HOST_PASSCODE` (a Cloudflare secret; locally, in `.dev.vars`). Use the existing checkout in cloud tasks;
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
Tests cover desktop and mobile Chromium, and start the guest app's backend with `wrangler dev`; check real phones before publication.

## Edit content

- `src/wedding.ts`: names, display date, venue, the Google Calendar link behind "Save our date", and `showFullSite`, the switch that hides or shows everything beyond the save-the-date.
- `src/SaveTheDate.tsx` and CSS: the save-the-date card shown for now. Sizes come from the 1024 × 1536 design (one design pixel is `--p`; the type never shrinks below a readable size on small phones). It prints itself in once the envelope has gone: the painting spreads like wet paint, the sprigs settle, each line rises in turn and the names are written in ink. The painting and names reveal by animating `mask-image` itself (Safari doesn't reliably repaint a mask when only a CSS variable inside it changes) and start invisible.
- `src/countdown.ts`, `src/Countdown.tsx` and `src/ThursdayNote.tsx` (with their CSS, and `src/paperEdge.css` for the torn edge): the days to go and the Thursday note, shared by the save-the-date and the full site.
- `src/saveTheDateImages.ts` and `src/assets/save-the-date/`: the Caswell House watercolour and the two corner sprigs, cut from the couple's design. The painting keeps its own paper (`#fff9f4`, the page colour) with a feathered outline; the sprigs' paper is transparent so they can overlap it. They load while the envelope is on screen.
- `src/App.tsx`: the envelope, then the save-the-date, or the full site when `showFullSite` is on. `src/FullSite.tsx` is the full page, loaded only when it's shown.
- `src/EnvelopeIntro.tsx` and CSS: the opening, from the envelope being set down to the card filling the screen; reduced-motion access skips the animation.
- `src/Ambience.tsx` and `src/assets/scene/`: the branch shadows and drifting dust over the envelope.
- `src/WaxSeal.tsx` and `src/crack.ts`: sculpted SVG wax seal and the line it cracks along.
- `src/confetti.ts` and `src/Celebration.tsx`: one canvas for the thrown petals, leaves and confetti, and the petals that drift down over the page.
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
- `public/save-the-date.ics`: calendar event for Apple Calendar and Outlook; change it and the Google Calendar link in `src/wedding.ts` together when the date changes. End date is exclusive. No ceremony time has been assumed.
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
7. Check HTTPS, the opening interaction and the calendar download before sharing (and the hotel links, once the full site is back).

Environment publication is separate from website deployment. Keep committed work
and a downloadable source archive before rebuilding an environment. This project
uses Cloudflare's GitHub integration to deploy changes pushed to `main`. Check the
latest Cloudflare build result and live domain to confirm publication.
