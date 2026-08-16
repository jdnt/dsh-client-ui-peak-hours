# @linxin666/dsh-client-ui-peak-hours

English | [中文](README.zh.md)

Peak-hours status for the dsh web GUI: a sidebar entry injected right below the **New Session** button that shows whether it is currently Beijing peak hours, with a per-second countdown to the next boundary.

Peak windows are fixed on the clock: **09:00–12:00** and **14:00–18:00**, interpreted in a configurable IANA timezone (default `Asia/Shanghai`, UTC+8, no DST). Outside those windows the row shows a green clock icon + 「非高峰期」 and counts down to the next peak start; inside a window it shows an amber icon + 「高峰期」 and counts down to the window end. The clock refreshes every second, so the state and countdown roll over exactly at a boundary.

## How it mounts

The sidebar shell exposes no slot an external plugin can register into (`sidebar.workspaces` / `sidebar.settings` are single-occupant), so — following the [task-board](https://github.com/zhu1090093659/dsh-web-ui) / ssh precedent of DOM-level extension — the status row is plain DOM inserted after the New Session button, with a `MutationObserver` that re-inserts it when a React re-render displaces it. The row is not a React tree, so it never disturbs the shell's reconciliation.

## Install

```sh
dsh plugin --profile <name> add link:<path-to-this-package>
```

Or add to `~/.dsh/profiles/<name>/package.json`:

```json
{
  "dependencies": {
    "@linxin666/dsh-client-ui-peak-hours": "workspace:*"
  }
}
```

## Settings

The `peak-hours` settings namespace has two fields, editable from the Web UI plugin group's settings page (when the group settings plugin is present) or directly in `~/.dsh/settings.yaml`:

| field | default | meaning |
|---|---|---|
| `enabled` | `true` | hide the sidebar entry when `false` |
| `timezone` | `Asia/Shanghai` | IANA timezone the peak clock reads; an invalid value falls back to `Asia/Shanghai` |

The GUI card may report the namespace as not exposed when the deployment's `WEB_SETTINGS_NAMESPACES` allowlist omits it; edit `settings.yaml` in that case.

## Integration with the entry family

The task-board, ssh, and peak-hours rows form one injected "family" under the New Session button, and the family keeps a stable order because each member positions itself relative to the same block. For peak-hours to stay pinned first across a concurrent React teardown, add its attribute to the other two members' family selectors:

- `packages/dsh-ssh/src/client/sidebar-entry.ts` and `packages/dsh-client-ui-task-board/src/client/sidebar-entry.ts`: in `placeEntry`, extend the `.matches(...)` selector from `'[data-dsh-taskboard-entry], [data-dsh-ssh-entry]'` to `'[data-dsh-peakhours-entry], [data-dsh-taskboard-entry], [data-dsh-ssh-entry]'`.

Without that patch the row still renders correctly; only the rare case of all three entries being displaced in one frame can leave peak-hours after the other two.

## Model Experience

None: this plugin renders browser-side status only; nothing here reaches a model request, the session log, or a provider call.

#### KV Cache effect

None; the plugin neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

- The timezone is read from the settings scope on each one-second tick, so a settings edit applies on the next tick; there is no push notification, but the interval makes the delay invisible.
- The clock uses `Intl.DateTimeFormat`, which depends on the browser's IANA timezone data; very new or renamed identifiers fall back to `Asia/Shanghai`.
