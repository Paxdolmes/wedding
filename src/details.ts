/** Order of the day. Leave `time` empty until it is confirmed and the page shows "Time to follow". */
export const timeline = [
  { time: '', title: 'Guests arrive', note: 'Find a seat, find a drink, find your favourite people.' },
  { time: '2:00pm', title: 'The ceremony', note: 'The bit where we say “I do”. Tissues recommended.' },
  { time: '', title: 'Drinks & canapés', note: 'Fizz in the garden while we have our photos taken.' },
  { time: '', title: 'Wedding breakfast', note: 'Dinner, with some of our favourite wines.' },
  { time: '', title: 'Speeches', note: 'Embarrassing stories, kept (mostly) short.' },
  { time: '', title: 'First dance', note: 'Then the dance floor is all yours.' },
  { time: '', title: 'Late-night pizza', note: 'Because dancing is hungry work.' },
  { time: '1:00am', title: 'Carriages', note: 'Time to head home, or to bed. Please book your taxi in advance.' },
]

/** The menu. Swap "To be confirmed" for each dish once chosen. */
export const menu = [
  { course: 'Canapés', dish: 'To be confirmed' },
  { course: 'Starter', dish: 'To be confirmed' },
  { course: 'Main course', dish: 'To be confirmed' },
  { course: 'Dessert', dish: 'To be confirmed' },
  { course: 'Late-night snack', dish: 'Pizza!' },
]

/** Wines poured at dinner. Only the rosé is decided; the others are placeholders. */
export const wines = [
  { kind: 'Champagne', name: 'Veuve Clicquot Yellow Label', origin: 'Reims, Champagne' },
  { kind: 'White', name: 'Cloudy Bay Sauvignon Blanc', origin: 'Marlborough, New Zealand' },
  { kind: 'Rosé', name: 'Whispering Angel', origin: 'Château d’Esclans, Provence' },
  { kind: 'Red', name: 'Catena Malbec', origin: 'Mendoza, Argentina' },
]

/** Friday get-together at the pub where Imogen and Dan had their first date. */
export const afterParty = {
  pub: 'The Crabtree',
  area: 'Fulham',
  map: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('The Crabtree, Rainville Road, London W6 9HA'),
  firstDate: '2023-10-12T19:29:00+01:00',
}
