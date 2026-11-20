/** The jagged line the wax breaks along, in the seal's 140 × 140 coordinate space. */
export const crackPath = 'M-6 66L8 67.5L15 64.5L24 67L31 65L37 68.5L46 66L52 63.5L60 67L67 65.5L73 69L81 66L88 64L95 67.5L104 66.5L110 63.5L119 67L127 65L135 67.5L146 66'
export const crackPoints = crackPath.slice(1).split('L').map(point => point.split(' ').map(Number))
const toPath = (list: number[][]) => 'M' + list.map(([x, y]) => `${x} ${y}`).join('L')
/** The same line drawn from right to left, the way the letter opener's blade travels through the wax. */
export const cutPath = toPath([...crackPoints].reverse())
export const points = (lift: number) => crackPoints.map(([x, y]) => `${x},${y - lift}`).reverse().join(' ')

/** The silhouette of the cast wax. The letter opener is masked by it (so its blade disappears into the seal) and the cut is clipped to it. */
export const sealOutline = 'M71 5C81 3 89 10 96 12C106 13 108 23 116 28C125 33 125 44 131 52C135 60 130 68 134 77C136 87 127 93 124 102C121 112 111 112 103 121C96 127 87 125 78 132C68 137 61 131 52 131C42 132 35 124 27 121C18 117 19 107 12 100C5 94 9 84 5 74C1 65 9 58 9 49C8 39 19 34 23 26C27 18 38 19 45 11C53 5 62 9 71 5Z'
