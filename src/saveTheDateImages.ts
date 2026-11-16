import painting from './assets/save-the-date/caswell-painting.webp'
import leavesTopLeft from './assets/save-the-date/leaves-top-left.webp'
import leavesBottomRight from './assets/save-the-date/leaves-bottom-right.webp'
import leavesTopRight from './assets/save-the-date/leaves-top-right.webp'
import leavesBottomLeft from './assets/save-the-date/leaves-bottom-left.webp'

/** The save-the-date's watercolour of Caswell House and its corner sprigs, cut from Imogen and Dan's own design (the second card uses mirrored copies). */
export const saveTheDateImages = { painting, leavesTopLeft, leavesBottomRight, leavesTopRight, leavesBottomLeft }

/** Fetches them while the envelope is still on screen, so they're ready the moment it opens. */
export function preloadSaveTheDateImages() {
  for (const src of Object.values(saveTheDateImages)) new Image().src = src
}
