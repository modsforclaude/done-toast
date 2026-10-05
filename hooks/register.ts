import type { Register } from 'claude-code'

const duration = (ms: number): string => {
  const seconds = Math.round(ms / 1000)

  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

export const register: Register = (on, options) => {
  const thresholdMs = Number(options.thresholdSeconds ?? 60) * 1000
  let tools = 0

  // A new prompt starts a new count, unless it was typed into a running turn.
  on('prompt.submit', ($, e, next) => {
    if (e.turnId === undefined) {
      tools = 0
    }

    return next(e)
  })

  on('tool.call', ($, e, next) => {
    tools += 1

    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    // A subagent finishing is not the end of the turn.
    if (e.agentId !== undefined) {
      return next(e)
    }

    // No toast for an interrupted turn: whoever stopped it is already watching.
    if (!e.isAborted && e.durationMs >= thresholdMs) {
      $.ui.toast(`Turn finished in ${duration(e.durationMs)} · ${tools} tool ${tools === 1 ? 'call' : 'calls'}`, {
        timeoutMs: 10000,
      })
    }

    tools = 0

    return next(e)
  })
}
