import { useId } from 'react'
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop, Text, TextPath } from 'react-native-svg'
import { colors, fonts } from './theme'

/**
 * The I & D monogram, ringed by "Imogen & Daniel Holmes", the name they'll share, and the date in Roman numerals.
 * Matches src/Monogram.tsx on the website.
 */
export function Monogram({ size = 160, ring = true, color = colors.ink }: { size?: number; ring?: boolean; color?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const foil = `url(#${id}foil)`
  return <Svg width={size} height={size} viewBox="0 0 200 200" accessibilityLabel="Imogen and Daniel Holmes monogram">
    <Defs>
      <LinearGradient id={`${id}foil`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#806b3e" /><Stop offset="0.38" stopColor="#c8a95f" /><Stop offset="0.5" stopColor="#ecd9a0" /><Stop offset="0.62" stopColor="#c8a95f" /><Stop offset="1" stopColor="#806b3e" />
      </LinearGradient>
      <Path id={`${id}ring`} d="M100 100 m-80 0 a80 80 0 1 1 160 0 a80 80 0 1 1 -160 0" />
    </Defs>
    {ring && <>
      <Circle cx="100" cy="100" r="96" fill="none" stroke={foil} strokeWidth="1.4" />
      <Circle cx="100" cy="100" r="91.5" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="0.6" />
      <Circle cx="100" cy="100" r="68" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="0.6" />
      <Text fill={color} fontFamily={fonts.sansMedium} fontSize="9.2" letterSpacing="5.1">
        <TextPath href={`#${id}ring`} startOffset="0">IMOGEN &amp; DANIEL HOLMES · XXIV · VIII · MMXXVIII ·</TextPath>
      </Text>
    </>}
    <Text x="65" y="122" textAnchor="middle" fill={color} fontFamily={fonts.serif} fontSize="66">I</Text>
    <Text x="135" y="122" textAnchor="middle" fill={color} fontFamily={fonts.serif} fontSize="66">D</Text>
    <Text x="100" y="119" textAnchor="middle" fill={foil} fontFamily={fonts.serif} fontSize="44">&amp;</Text>
    <G transform="translate(100 146)" fill="none" stroke={foil} strokeWidth="1.1" strokeLinecap="round">
      <Path d="M-22 0 Q0 -5 22 0" />
      {[-15, -7, 7, 15].map(x => <Ellipse key={x} cx={x} cy={-4.6} rx="3.4" ry="1.5" transform={`rotate(${x < 0 ? -28 : 28} ${x} -4.6)`} />)}
      {[-11, 11].map(x => <Ellipse key={x} cx={x} cy={2.6} rx="3.2" ry="1.4" transform={`rotate(${x < 0 ? 24 : -24} ${x} 2.6)`} />)}
    </G>
  </Svg>
}
