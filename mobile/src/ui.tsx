import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts, shadow } from './theme'

export function Screen({ children, onRefresh, refreshing = false, padBottom = 110 }: { children: ReactNode; onRefresh?: () => void; refreshing?: boolean; padBottom?: number }) {
  const insets = useSafeAreaInsets()
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + padBottom }]}
    keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} /> : undefined}>
    {children}
  </ScrollView>
}

export const Eyebrow = ({ children, style }: { children: ReactNode; style?: TextStyle }) => <Text style={[styles.eyebrow, style]}>{children}</Text>
export const Title = ({ children, style }: { children: ReactNode; style?: TextStyle }) => <Text style={[styles.title, style]} accessibilityRole="header">{children}</Text>
export const Heading = ({ children, style }: { children: ReactNode; style?: TextStyle }) => <Text style={[styles.heading, style]} accessibilityRole="header">{children}</Text>
export const Body = ({ children, style, muted }: { children: ReactNode; style?: TextStyle; muted?: boolean }) => <Text style={[styles.body, muted && { color: colors.muted }, style]}>{children}</Text>
export const Hint = ({ children, style }: { children: ReactNode; style?: TextStyle }) => <Text style={[styles.hint, style]}>{children}</Text>
export const Script = ({ children, style }: { children: ReactNode; style?: TextStyle }) => <Text style={[styles.script, style]}>{children}</Text>
export const ErrorText = ({ children }: { children: ReactNode }) => children ? <Text style={styles.error} accessibilityRole="alert">{children}</Text> : null

export function ScreenHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <View style={{ gap: 4, marginBottom: 4 }}><Eyebrow>{eyebrow}</Eyebrow><Title>{title}</Title></View>
}

export const Card = ({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) => <View style={[styles.card, style]}>{children}</View>

export function Button({ label, onPress, variant = 'outline', disabled, busy, small, style }: { label: string; onPress: () => void; variant?: 'primary' | 'outline' | 'ghost'; disabled?: boolean; busy?: boolean; small?: boolean; style?: ViewStyle }) {
  const primary = variant === 'primary'
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || busy}
    style={({ pressed }) => [styles.button, small && styles.buttonSmall, primary && styles.buttonPrimary, variant === 'ghost' && styles.buttonGhost, (disabled || busy) && { opacity: 0.55 }, pressed && { transform: [{ scale: 0.97 }] }, style]}>
    {busy ? <ActivityIndicator color={primary ? colors.paper : colors.ink} /> : <Text style={[styles.buttonText, small && { fontSize: 11 }, primary && { color: colors.paper }]}>{label.toUpperCase()}</Text>}
  </Pressable>
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}><Text style={styles.link}>{label}</Text></Pressable>
}

export function Chip({ label, on, onPress, disabled, highlight }: { label: string; on?: boolean; onPress: () => void; disabled?: boolean; highlight?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: on, disabled }} onPress={onPress} disabled={disabled}
    style={[styles.chip, on && styles.chipOn, highlight && styles.chipHighlight]}>
    <Text style={[styles.chipText, on && { color: colors.paper }]}>{label}</Text>
  </Pressable>
}

export const Choices = ({ children }: { children: ReactNode }) => <View style={styles.choices}>{children}</View>

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor="#9a9f88" {...props} style={[styles.input, props.multiline && { minHeight: 84, textAlignVertical: 'top' }, style]} />
  </View>
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <View style={styles.segmented} accessibilityRole="tablist">
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)}
      style={[styles.segment, value === option.value && styles.segmentOn]}>
      <Text style={[styles.segmentText, value === option.value && { color: colors.ink }]}>{option.label}</Text>
    </Pressable>)}
  </View>
}

export const Pill = ({ children }: { children: ReactNode }) => <View style={styles.pill}><Text style={styles.pillText}>{children}</Text></View>

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingHorizontal: 16, gap: 16, maxWidth: 620, width: '100%', alignSelf: 'center' },
  eyebrow: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.gold },
  title: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 40, color: colors.ink },
  heading: { fontFamily: fonts.serif, fontSize: 23, lineHeight: 27, color: colors.ink },
  body: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 25, color: colors.inkSoft },
  hint: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted },
  script: { fontFamily: fonts.script, fontSize: 40, lineHeight: 56, color: colors.ink },
  error: { fontFamily: fonts.sans, fontSize: 14, color: colors.error },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.rule, padding: 18, gap: 12, ...shadow },
  button: { minHeight: 48, borderRadius: 999, borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 22, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonSmall: { minHeight: 38, paddingHorizontal: 14, paddingVertical: 8 },
  buttonPrimary: { backgroundColor: colors.ink },
  buttonGhost: { borderColor: colors.ruleStrong },
  buttonText: { fontFamily: fonts.sansMedium, fontSize: 12.5, letterSpacing: 1.8, color: colors.ink },
  link: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textDecorationLine: 'underline' },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.ruleStrong, backgroundColor: colors.card, paddingHorizontal: 15, paddingVertical: 10 },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipHighlight: { borderColor: colors.goldBright, borderWidth: 2 },
  chipText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontFamily: fonts.sans, fontSize: 13, letterSpacing: 0.4, color: colors.muted },
  input: { fontFamily: fonts.sans, fontSize: 16, color: colors.ink, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.ruleStrong, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  segmented: { flexDirection: 'row', backgroundColor: colors.sageMist, borderRadius: 999, padding: 4, gap: 4 },
  segment: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.card, ...shadow, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
  segmentText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkSoft },
  pill: { backgroundColor: colors.sageMist, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  pillText: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft },
})
