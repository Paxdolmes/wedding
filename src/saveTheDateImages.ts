import painting from './assets/save-the-date/caswell-painting.webp'
import leavesTopLeft from './assets/save-the-date/leaves-top-left.webp'
import leavesBottomRight from './assets/save-the-date/leaves-bottom-right.webp'

/** The save-the-date's watercolour of Caswell House and its two corner sprigs, cut from Imogen and Dan's own design. */
export const saveTheDateImages = { painting, leavesTopLeft, leavesBottomRight }

/** Fetches them while the envelope is still on screen, so they're ready the moment it opens. */
export function preloadSaveTheDateImages() {
  for (const src of Object.values(saveTheDateImages)) new Image().src = src
}
