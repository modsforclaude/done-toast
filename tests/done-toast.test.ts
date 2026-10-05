import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

// Stands in for the engine: answers the events the mod passes on and records
// every toast it shows.
const fake = (on: On) => {
  const toasts: string[] = []

  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('ui.toast', (_, e) => {
    toasts.push(e.text)

    return { value: undefined }
  })

  return toasts
}

const turn = (durationMs: number) =>
  ({ answer: 'Done.', durationMs, isAborted: false, turnId: 't1', reason: 'answer' }) as const

const prompt = (text: string) => ({ text, wait: false, origin: { kind: 'composer' } }) as const

test('shows the duration and tool calls of a long turn', async ($, on) => {
  const toasts = fake(on)

  await $.prompt.submit(prompt('go'))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a.md' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/b.md' })
  await $.turn.complete(turn(125_000))

  expect(toasts).toEqual(['Turn finished in 2m 05s · 2 tool calls'])
})

test('stays quiet for a short turn', async ($, on) => {
  const toasts = fake(on)

  await $.prompt.submit(prompt('go'))
  await $.turn.complete(turn(59_000))

  expect(toasts).toEqual([])
})

test('starts counting again with each turn', async ($, on) => {
  const toasts = fake(on)

  await $.prompt.submit(prompt('one'))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a.md' })
  await $.turn.complete(turn(60_000))
  await $.prompt.submit(prompt('two'))
  await $.turn.complete(turn(61_000))

  expect(toasts).toEqual(['Turn finished in 1m 00s · 1 tool call', 'Turn finished in 1m 01s · 0 tool calls'])
})

test('keeps counting when a prompt is typed into a running turn', async ($, on) => {
  const toasts = fake(on)

  await $.prompt.submit(prompt('go'))
  await $.tool.call({ tool: 'Read', file_path: '/repo/a.md' })
  await $.prompt.submit({ ...prompt('also this'), turnId: 't1' })
  await $.tool.call({ tool: 'Read', file_path: '/repo/b.md' })
  await $.turn.complete(turn(90_000))

  expect(toasts).toEqual(['Turn finished in 1m 30s · 2 tool calls'])
})

test('ignores subagent turns and interrupted turns', async ($, on) => {
  const toasts = fake(on)

  await $.turn.complete({ ...turn(300_000), agentId: 'agent-1' })
  await $.turn.complete({ ...turn(300_000), isAborted: true, reason: 'aborted' })

  expect(toasts).toEqual([])
})

test('uses the configured threshold', { options: { thresholdSeconds: 5 } }, async ($, on) => {
  const toasts = fake(on)

  await $.turn.complete(turn(6_000))

  expect(toasts).toEqual(['Turn finished in 6s · 0 tool calls'])
})
