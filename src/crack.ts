/** The jagged line the wax breaks along, in the seal's 140 × 140 coordinate space. */
export const crackPath = 'M-6 66L8 67.5L15 64.5L24 67L31 65L37 68.5L46 66L52 63.5L60 67L67 65.5L73 69L81 66L88 64L95 67.5L104 66.5L110 63.5L119 67L127 65L135 67.5L146 66'
export const crackPoints = crackPath.slice(1).split('L').map(point => point.split(' ').map(Number))
const toPath = (list: number[][]) => 'M' + list.map(([x, y]) => `${x} ${y}`).join('L')
/** The crack split at its centre, so it can run outwards in both directions from where the thumb pressed. */
export const crackHalves = [toPath(crackPoints.filter(([x]) => x <= 67).reverse()), toPath(crackPoints.filter(([x]) => x >= 67))]
/** Hairline fractures that branch off the main crack. */
export const crackBranches = ['M46 66L44 60L40 56.5', 'M88 64L91 71L95 74', 'M24 67L22.5 72.5', 'M110 63.5L112 58']
export const points = (lift: number) => crackPoints.map(([x, y]) => `${x},${y - lift}`).reverse().join(' ')
