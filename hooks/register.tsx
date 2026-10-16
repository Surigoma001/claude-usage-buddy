import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit, Snapshot } from '../types'

const snapshot = atom({ plugin: 'usage-buddy', key: 'snapshot' } as const, null)
const isOpen = atom({ plugin: 'usage-buddy', key: 'isOpen' } as const, false)

type Mood = 'ok' | 'warn' | 'danger'

// 体の色はテーマに追従する（ライト/ダーク/色覚配慮）
const BODY: Record<Mood, string> = { ok: 'claude', warn: 'warning', danger: 'error' }
// 目: 平常は本物どおり。ピンチだけ半目にして、色以外でも差が出るようにする
const EYES: Record<Mood, [string, string]> = {
  ok: ['▛', '▜'],
  warn: ['▛', '▜'],
  danger: ['▀', '▀'],
}

const MASCOT_WIDTH = 10 // 縦積み。「100%/4h59m」(10セル)がこの幅に収まる

const moodOf = (usedPercent: number): Mood =>
  usedPercent >= 85 ? 'danger' : usedPercent >= 60 ? 'warn' : 'ok'

const bar = (usedPercent: number, width: number): string => {
  const filled = Math.min(width, Math.round((usedPercent / 100) * width))
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const isPast = (iso: string | undefined, nowMs: number): boolean =>
  iso !== undefined && Date.parse(iso) <= nowMs

// リセット時刻を過ぎた枠は、次の応答が来るまで古い値が残るので 0% 扱いにする
const usedOf = (l: Limit, nowMs: number): number =>
  isPast(l.resetsAt, nowMs) ? 0 : l.percentUsed

const until = (iso: string | undefined, nowMs: number): string => {
  if (!iso) return ''
  const diff = Date.parse(iso) - nowMs
  if (!Number.isFinite(diff)) return ''
  if (diff <= 0) return 'リセット済'
  const minutes = Math.floor(diff / 60000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days > 0) return `${days}日${hours}時間後`
  if (hours > 0) return `${hours}時間${minutes % 60}分後`
  return `${minutes}分後`
}

// 数字の行用の短い残り時間: 4h51m / 51m / 3d（ASCIIだけなので幅がずれない）
const shortUntil = (iso: string | undefined, nowMs: number): string => {
  if (!iso) return ''
  const diff = Date.parse(iso) - nowMs
  if (!Number.isFinite(diff) || diff <= 0) return '0m'
  const minutes = Math.floor(diff / 60000)
  const days = Math.floor(minutes / 1440)
  if (days > 0) return `${days}d`
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours}h${String(minutes % 60).padStart(2, '0')}m` : `${minutes}m`
}

const left = (usedPercent: number): number =>
  Math.max(0, Math.min(100, Math.round(100 - usedPercent)))

const toSnapshot = (
  contextPercent: number | null | undefined,
  limits: readonly Limit[],
): Snapshot => ({
  contextPercent: contextPercent ?? null,
  limits: limits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
})

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const usage = await $.session.usage()
    await update($, snapshot, () => toSnapshot(usage.context.percent, usage.rateLimits))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, snapshot, () => toSnapshot(e.context.percent, e.rateLimits))

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const snap = await read($, snapshot)
    const width = e.props.bodyColumns

    // アンケート中・測定前・幅が足りないときは、何も描かずエンジンに譲る
    if (e.props.hasSurvey || snap === null || width < MASCOT_WIDTH) {
      return next(e)
    }

    const { Box, Text, Button } = $.ui.resolve(e)
    const open = await read($, isOpen)
    const now = await $.clock.now()
    const five = snap.limits.find(l => l.kind === 'five_hour')
    const week = snap.limits.find(l => l.kind === 'seven_day')

    // キャラの気分は、全枠とコンテキストのうち一番高い値。数字の色は5時間枠だけで決める
    const worst = Math.max(
      snap.contextPercent ?? 0,
      ...snap.limits.map(l => usedOf(l, now)),
    )
    const fiveUsed = five === undefined ? 0 : usedOf(five, now)
    const body = BODY[moodOf(worst)]
    const numColor = BODY[moodOf(fiveUsed)]
    const [eyeL, eyeR] = EYES[moodOf(worst)]
    const time = five === undefined ? '' : shortUntil(five.resetsAt, now)
    const rest =
      five === undefined ? '' : time === '' ? `${left(fiveUsed)}%` : `${left(fiveUsed)}%/${time}`

    const details: string[] = []
    if (open) {
      if (five) {
        details.push(`5時間 ${bar(fiveUsed, 8)} 残${left(fiveUsed)}% ${until(five.resetsAt, now)}`)
      }
      if (week) {
        details.push(`週間 残${left(usedOf(week, now))}% ${until(week.resetsAt, now)}`)
      }
      if (snap.contextPercent !== null) {
        details.push(`ctx ${Math.round(snap.contextPercent)}%`)
      }
    }

    // 押せるのは Button だけ。子は Text のみ許される（Box は拒否される）
    const toggle =
      rest === '' ? null : (
        <Button
          key="toggle"
          plain
          label="使用量を開閉"
          onPress={() => update($, isOpen, v => !v)}
        >
          <Text color={numColor} bold>
            {rest}
          </Text>
        </Button>
      )

    const detailRows = details.map(d => (
      <Text key={d} dimColor wrap="truncate-end">
        {d}
      </Text>
    ))

    // 縦積み: 上にキャラ、すぐ下に残り%（幅は MASCOT_WIDTH セルで固定）。詳細は開いたときだけ
    return (
      <Box flexDirection="column" alignItems="flex-end">
        <Box flexDirection="column" flexShrink={0} width={MASCOT_WIDTH}>
          <Text color={body}>{` ▐${eyeL}███${eyeR}▌`}</Text>
          <Text color={body}>{'▝▜█████▛▘'}</Text>
          <Text color={body}>{'  ▘▘ ▝▝'}</Text>
        </Box>
        {toggle !== null && (
          <Box width={MASCOT_WIDTH} justifyContent="center" flexShrink={0}>
            {toggle}
          </Box>
        )}
        {detailRows}
      </Box>
    )
  })
}
