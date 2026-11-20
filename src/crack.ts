/** The jagged line the wax breaks along, in the seal's 140 × 140 coordinate space. */
export const crackPath = 'M-6 66L8 67.5L15 64.5L24 67L31 65L37 68.5L46 66L52 63.5L60 67L67 65.5L73 69L81 66L88 64L95 67.5L104 66.5L110 63.5L119 67L127 65L135 67.5L146 66'
export const crackPoints = crackPath.slice(1).split('L').map(point => point.split(' ').map(Number))
const toPath = (list: number[][]) => 'M' + list.map(([x, y]) => `${x} ${y}`).join('L')
/** The crack split at its centre, so it can run outwards in both directions from where the thumb pressed. */
export const crackHalves = [toPath(crackPoints.filter(([x]) => x <= 67).reverse()), toPath(crackPoints.filter(([x]) => x >= 67))]
/** The same line drawn from right to left, the way the letter opener's blade travels through the wax. */
export const cutPath = toPath([...crackPoints].reverse())
export const points = (lift: number) => crackPoints.map(([x, y]) => `${x},${y - lift}`).reverse().join(' ')
