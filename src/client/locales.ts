/**
 * Peak-hours copy: zh-first dictionaries with an English fallback, selected
 * by the document language. Kept dependency-free (no dsh locale service) so
 * the DOM-injected entry row reads one tiny lookup, matching the task-board /
 * ssh precedent.
 */

/** zh dictionary (key-set source of truth). */
export const zh = {
  'entry.peak': '高峰期',
  'entry.offpeak': '非高峰期',
  'entry.countdownToPeak': '距高峰 {time}',
  'entry.countdownToEnd': '距结束 {time}',
  'entry.aria': '高峰时段状态',
  // 插件设置卡片（web-ui.plugin.item 席位）。
  'settings.title': '高峰时段',
  'settings.description': '控制侧边栏高峰状态与倒计时的显示。',
  'settings.enabled': '启用高峰时段提示',
  'settings.enabledHint': '关闭后隐藏侧边栏入口。',
  'settings.timezone': '时区',
  'settings.timezoneHint': '高峰时段按该时区判定；默认北京时间（Asia/Shanghai）。',
  'settings.inherit': '继承',
  'settings.on': '开',
  'settings.off': '关',
  'settings.overridden': '已覆盖',
  'settings.reset': '恢复默认',
  'settings.notExposed': '当前 DSH 版本未向设置页暴露本插件的配置命名空间，表单不可用。可编辑 ~/.dsh/settings.yaml 直接配置，或为 dsh-host-apiproxy 的 WEB_SETTINGS_NAMESPACES 白名单补充本命名空间后重启。',
  'settings.readOnly': '当前部署的设置只读。',
  'settings.expand': '展开设置',
  'settings.collapse': '收起设置',
  'settings.save': '保存',
  'settings.saving': '保存中…',
  'settings.discard': '放弃',
  'settings.unsaved': '未保存',
  'settings.saveFailed': '部署未接受这些值，已保留供你修改。',
  'settings.invalidNumber': '请输入数字，留空则使用默认值。',
} satisfies Record<string, string>

/** en dictionary, complete against the zh key set. */
export const en: Record<keyof typeof zh, string> = {
  'entry.peak': 'Peak hours',
  'entry.offpeak': 'Off-peak',
  'entry.countdownToPeak': 'Peak in {time}',
  'entry.countdownToEnd': 'Ends in {time}',
  'entry.aria': 'Peak-hours status',
  // Plugin settings card (the `web-ui.plugin.item` seat).
  'settings.title': 'Peak Hours',
  'settings.description': 'How the sidebar peak-hours status and countdown display.',
  'settings.enabled': 'Enable the peak-hours status',
  'settings.enabledHint': 'When off, the sidebar entry is hidden.',
  'settings.timezone': 'Time zone',
  'settings.timezoneHint': 'Peak hours are judged in this time zone; defaults to Beijing time (Asia/Shanghai).',
  'settings.inherit': 'Inherit',
  'settings.on': 'On',
  'settings.off': 'Off',
  'settings.overridden': 'Overridden',
  'settings.reset': 'Reset to default',
  'settings.notExposed': 'This DSH version does not expose this plugin\'s settings namespace to the configuration page, so the form is unavailable. Edit ~/.dsh/settings.yaml directly, or add the namespace to dsh-host-apiproxy\'s WEB_SETTINGS_NAMESPACES allowlist and restart.',
  'settings.readOnly': 'This deployment stores settings read-only.',
  'settings.expand': 'Show settings',
  'settings.collapse': 'Hide settings',
  'settings.save': 'Save',
  'settings.saving': 'Saving…',
  'settings.discard': 'Discard',
  'settings.unsaved': 'Unsaved',
  'settings.saveFailed': 'The deployment did not accept these values; they were left for you to correct.',
  'settings.invalidNumber': 'Enter a number, or leave blank to use the default.',
}

/** The dictionary key union. */
export type PeakHoursKey = keyof typeof zh

/** Active dictionary, picked by the document language at call time. */
export function dictionary(): Record<PeakHoursKey, string> {
  const lang = typeof document !== 'undefined' ? document.documentElement.lang : 'zh'
  return lang.toLowerCase().startsWith('en') ? en : zh
}

/** Translate a key with optional {name} template params. */
export function t(key: PeakHoursKey, params?: Record<string, string>): string {
  let text: string = dictionary()[key]
  if (params !== undefined) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, value)
    }
  }
  return text
}
