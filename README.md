**English** | [日本語](./README.ja.md)

# usage-buddy

> A tiny buddy above your prompt that tells you how much of your Claude limit is left.

`usage-buddy` is a mod (plugin) for [Claude Code](https://docs.claude.com/en/docs/claude-code). It sits just above the input box, aligned to the right, and shows a small Claude-style mascot with your **5-hour limit remaining and the time until it resets** underneath it.

```
 ▐▛███▜▌
▝▜█████▛▘
  ▘▘ ▝▝
93%/4h51m
```

## Why

If you split VS Code into three vertical panes and run Claude Code in one of them, a full status line gets cut off or wraps and becomes hard to read. usage-buddy was designed for exactly that layout: it is only 10 cells wide, never wraps, and tells you at a glance whether you can keep going or should slow down.

## Features

- **Stays small in narrow panes.** The mascot and the number fit in a fixed 10-cell column (the widest value, `100%/4h59m`, is exactly 10 cells). Lines are never wrapped. If the pane is narrower than 10 cells, nothing is drawn at all.
- **Click to expand.** Clicking the number toggles a detail list: 5-hour limit (with a small bar), weekly limit, and context window usage. Click again to close it.
- **Mood by color.** The mascot's body changes color as usage climbs, and its eyes droop when things get tight.
- **Follows your theme.** Colors use Claude Code's theme colors (`claude` / `warning` / `error`), so they adapt to light, dark and color-blind-friendly themes.

### States

The mascot's mood is based on the **highest** of: 5-hour usage, weekly usage, and context usage. The number's color is based on the 5-hour limit only.

| Usage | Body color | Eyes | Looks like |
|---|---|---|---|
| under 60% | Claude orange | normal | ` ▐▛███▜▌` |
| 60% to under 85% | yellow (warning) | normal | ` ▐▛███▜▌` |
| 85% and above | red (error) | half-closed | ` ▐▀███▀▌` |

Once a limit's reset time has passed, it is treated as 0% used until the next response brings fresh numbers.

### Detail view (when opened)

```
 ▐▛███▜▌
▝▜█████▛▘
  ▘▘ ▝▝
93%/4h51m
5時間 █░░░░░░░ 残93% 4時間51分後
週間 残71% 3日2時間後
ctx 24%
```

Note: in version 0.1.0 the detail labels are in Japanese (`5時間` = 5-hour, `週間` = weekly, `残` = remaining, `後` = from now). The compact number (`93%/4h51m`) is ASCII only. See [Customization](#customization) to change the labels.

## Install

At the prompt of a Claude Code session **in a terminal**, type:

```
/plugin install usage-buddy --marketplace Surigoma001/claude-usage-buddy
```

Then:

1. When asked `Add marketplace?` (source `github:Surigoma001/claude-usage-buddy`), answer `y`.
2. Choose a scope. The user scope is listed first; press Enter to install it for all your sessions.
3. You should see `Installed usage-buddy. Plugin is now active.` The mascot appears after Claude's first response in the session.

If you have already added this marketplace, step 1 is skipped.

## Update and uninstall

Update to the latest version:

```
claude plugin update usage-buddy@claude-usage-buddy
```

Then restart Claude Code, or run `/reload-plugins` in an open session.

Uninstall:

```
claude plugin uninstall usage-buddy@claude-usage-buddy
```

To also remove the marketplace entry:

```
claude plugin marketplace remove claude-usage-buddy
```

## Requirements and limitations

- **Subscription plans only (Pro / Max).** The 5-hour and weekly limits are only reported when you sign in with a Claude subscription. With pay-as-you-go API billing there are no such limits, so only the mascot is drawn: no number appears, and because the number is the click target, the detail view cannot be opened either. (The mascot's color still reacts to context usage.)
- **Nothing until the first response.** The numbers come from API responses, so the mascot is hidden until Claude has replied at least once in the session.
- **No credit balance.** Cloud / API credit balance is not available through the data Claude Code exposes, so it cannot be shown.
- **VS Code: use the integrated terminal.** It works when Claude Code runs as a CLI in VS Code's integrated terminal. It is not shown in the VS Code extension's chat panel.
- **Clicking may require fullscreen mode (unverified).** Mouse clicks in the terminal may only reach the mod when Claude Code is in its fullscreen display mode. This has not been confirmed. If clicking does nothing, the compact number still works.
- **Desktop app: untested.** Claude Code's docs say a mod installed at the user scope also loads in the desktop app's local Code sessions, but this mod has not been tested there.
- **Install command is terminal-only.** `/plugin install` is not available in the desktop app's Code tab; run it from a terminal session.

## Customization

Everything lives in [`hooks/register.tsx`](./hooks/register.tsx). Fork the repository, edit, and load your copy (see [Development](#development-and-testing)).

| What | Where |
|---|---|
| Colors per mood | `BODY` (theme color names: `claude`, `warning`, `error`, ...) |
| Eyes per mood | `EYES` (left/right eye characters) |
| Thresholds (60% / 85%) | `moodOf` |
| Width of the column | `MASCOT_WIDTH` (default `10`; the narrowest pane in which anything is drawn) |
| Mascot shape | the three `<Text>` lines near the end of the `ui.render` hook |
| Detail labels and language | the `details.push(...)` lines and the `until` function |

If you change the mascot or the number format, keep every line within `MASCOT_WIDTH` cells so it does not wrap in narrow panes.

## Development and testing

```
git clone https://github.com/Surigoma001/claude-usage-buddy.git
cd claude-usage-buddy

claude plugin validate .   # checks the marketplace file, manifest and hooks module
claude plugin test .       # runs tests/*.test.tsx against the engine
claude --plugin-dir .      # try it in a session without installing
```

Repository layout:

```
.claude-plugin/
  marketplace.json   # makes this repository a marketplace (source "./")
  plugin.json        # the mod's manifest
hooks/
  hooks.json         # points at register.tsx
  register.tsx       # the mod itself
types/index.d.ts     # state typings
tests/band.test.tsx  # tests
```

Issues and pull requests are welcome.

## License

[MIT](./LICENSE) © 2026 Shun Inc.

This is an unofficial community mod and is not affiliated with or endorsed by Anthropic.
