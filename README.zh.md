# @linxin666/dsh-client-ui-peak-hours

[English](README.md) | 中文

DSH Web GUI 的高峰时段状态插件：在侧边栏「新会话」按钮正下方注入一条状态行，显示当前是否处于北京高峰时段，并按秒倒计时到下一个边界。

高峰时段固定为：**09:00–12:00**、**14:00–18:00**，按可配置的 IANA 时区判定（默认 `Asia/Shanghai`，即北京时间 UTC+8，无夏令时）。时段之外显示绿色时钟图标 +「非高峰期」，倒计时到下一个高峰开始；时段之内显示琥珀色图标 +「高峰期」，倒计时到该时段结束。时钟每秒刷新，状态与倒计时在边界时刻精确切换。

## 挂载方式

侧边栏 shell 没有暴露给外部插件注册的槽位（`sidebar.workspaces` / `sidebar.settings` 都是单占位），因此沿用 [task-board](https://github.com/zhu1090093659/dsh-web-ui) / ssh 的 DOM 级扩展先例：状态行是插入到 New Session 按钮之后的纯 DOM，用 `MutationObserver` 在 React 重渲染顶掉它时自愈重插。它不是 React 树，因此不会干扰 shell 的协调。

## 安装

```sh
dsh plugin --profile <name> add link:<本包路径>
```

或在 `~/.dsh/profiles/<name>/package.json` 中：

```json
{
  "dependencies": {
    "@linxin666/dsh-client-ui-peak-hours": "workspace:*"
  }
}
```

## 设置

`peak-hours` 设置命名空间有两个字段，可在 Web UI 插件组设置页（安装了组设置插件时）或直接改 `~/.dsh/settings.yaml`：

| 字段 | 默认 | 含义 |
|---|---|---|
| `enabled` | `true` | 为 `false` 时隐藏侧边栏入口 |
| `timezone` | `Asia/Shanghai` | 高峰时段判定的 IANA 时区；非法值回退到 `Asia/Shanghai` |

当部署的 `WEB_SETTINGS_NAMESPACES` 白名单未包含本命名空间时，GUI 卡片会提示命名空间未暴露；此时直接编辑 `settings.yaml`。

## 与入口 family 的集成

任务看板、SSH、高峰时段三条注入行组成 New Session 按钮下的一个「family 块」，靠各自相对同一块定位来保持稳定顺序。要让高峰时段在 React 并发重建时始终保持在最前，需要把它的属性加进另外两个成员的 family 选择器：

- `packages/dsh-ssh/src/client/sidebar-entry.ts` 与 `packages/dsh-client-ui-task-board/src/client/sidebar-entry.ts`：在 `placeEntry` 中把 `.matches(...)` 选择器从 `'[data-dsh-taskboard-entry], [data-dsh-ssh-entry]'` 扩为 `'[data-dsh-peakhours-entry], [data-dsh-taskboard-entry], [data-dsh-ssh-entry]'`。

不补这个补丁也能正常渲染；只有三行在同一帧内被同时顶掉的罕见情况下，高峰时段才可能落到另外两行之后。

## Model Experience

无：本插件只渲染浏览器端状态，任何内容都不会进入模型请求、会话日志或 provider 调用。

#### KV Cache 影响

无；本插件既不组装也不发送 provider 请求。

## 已知限制与后续工作

- 时区在每次一秒 tick 时从设置作用域读取，设置修改会在下一个 tick 生效；没有推送通知，但一秒间隔使延迟不可见。
- 时钟依赖 `Intl.DateTimeFormat`，即浏览器自带的 IANA 时区数据；过新或已改名的标识符会回退到 `Asia/Shanghai`。
