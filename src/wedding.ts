export const wedding = { names: 'Imogen & Dan', dateLabel: '24 August 2028', location: 'Caswell House, Oxfordshire' }

/**
 * "Save our date" in Google Calendar: an all-day event on 24 August 2028 (Google's end date is the day after).
 * Apple Calendar and Outlook use public/save-the-date.ics instead; keep the two in step if anything changes.
 */
export const googleCalendarLink = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
  action: 'TEMPLATE',
  text: 'Imogen & Dan’s wedding',
  dates: '20280824/20280825',
  details: 'Save the date! Further details and timings to follow.',
  location: 'Caswell House, Brize Norton, Oxfordshire OX18 3NJ',
})

/**
 * For now the website is only the save-the-date card. Everything else we've made (the invitation page, the day,
 * the venue, food and drink, Friday, what to wear, where to stay and the photos) is kept but hidden, and guests
 * don't download any of it. Set this to true to bring it all back.
 *
 * While developing, add `?full` to the address (http://localhost:5173/?full) to see the full site without changing this.
 */
export const showFullSite = false
