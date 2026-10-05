# done-toast

A Claude Code mod that shows a toast when a long turn finishes, so you notice that Claude is done:

```
Turn finished in 2m 05s · 14 tool calls
```

The toast appears when a turn took at least 60 seconds (configurable) and stays for 10 seconds. Turns you interrupted yourself do not get a toast.

## Events it hooks into

| Event | Why |
| --- | --- |
| `prompt.submit` | A new prompt starts a new tool call count. |
| `tool.call` (all tools) | Counts the tool calls of the turn, including those of subagents. |
| `turn.complete` | The end of the turn. The engine reports the turn's duration here; the mod compares it with the threshold and shows the toast. |

It calls `$.ui.toast` to show the toast. Site categories: Prompt, Tool call, UI (plus the turn's end, `turn.complete`).

## What it can see

The hooks receive the prompt text, the input of every tool call and the final answer of the turn. The mod uses none of that content: it only counts tool calls and reads the turn's duration. It passes every event through unchanged.

No network calls, no dependencies, nothing written to disk, nothing stored.

The toast is shown inside Claude Code. It is not an operating system notification, so you will not see it while another window is in front.

## Loading it

Mods are an early-access Claude Code feature and need a recent version (built and tested on 2.1.286).

```bash
git clone https://github.com/modsforclaude/done-toast
```

```bash
claude --plugin-dir ./done-toast
```

Listed on [modsforClaude.com](https://modsforclaude.com/mods/done-toast/), with its review and pinned commit.

## Configuration

| Option | Default | Meaning |
| --- | --- | --- |
| `thresholdSeconds` | `60` | Show the toast when a turn took at least this many seconds. |

Change it in the config menu (`/config`), or in `settings.json`:

```json
{
  "pluginConfigs": {
    "done-toast": {
      "options": {
        "thresholdSeconds": 120
      }
    }
  }
}
```

## Development

```bash
claude plugin validate /path/to/done-toast
```

```bash
claude plugin test /path/to/done-toast
```

The whole mod is [hooks/register.ts](hooks/register.ts).

## License

MIT, see [LICENSE](LICENSE).

Unofficial community mod, not affiliated with Anthropic.
