window.__ModuleLoader__.load({
	id: "@jdnt/dsh-client-ui-peak-hours",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		//#region lib/types/client/apply-guard.js
		/**
		* Cross-module-instance apply guard for the peak-hours client bundle.
		*
		* The client factory can run more than once in a single page lifetime (for
		* example when a stale bundle is mixed with a rebuilt one while `dsh web` is
		* restarted). Without a guard, every factory run mounts its own sidebar
		* status row, so the shell ends up showing two entries.
		*
		* The flag lives on globalThis so separate module instances (independent
		* factory runs) still share one guard. First claim wins; later claims become
		* no-ops until the claim is released (fiber unload / hot-reload) or the page
		* reloads.
		*/
		/** Claims the plugin apply slot. Returns true when this call won the slot. */
		function claimPeakHoursApply() {
			if (globalThis.__dshPeakHoursApplied === true) return false;
			globalThis.__dshPeakHoursApplied = true;
			return true;
		}
		/**
		* Releases the claim. Called from the client fiber cleanup so that a
		* hot-reloaded bundle can claim again instead of being silently dropped.
		*/
		function releasePeakHoursApply() {
			globalThis.__dshPeakHoursApplied = void 0;
		}
		//#endregion
		//#region lib/types/client/time.js
		/**
		* Pure peak-hours time computation. Peak windows are fixed on the clock:
		* 09:00–12:00 and 14:00–18:00 on weekdays, interpreted in the configured IANA
		* timezone (default Asia/Shanghai = UTC+8, no DST). Saturday and Sunday are
		* non-peak all day. Every function is pure over a `Date` plus a timezone
		* string, so it is unit-testable without the DOM.
		*/
		/** IANA timezone used when none (or an invalid one) is configured. */
		const DEFAULT_TIMEZONE = "Asia/Shanghai";
		/** Peak windows, seconds after midnight. */
		const MORNING_START = 9 * 3600;
		const MORNING_END = 12 * 3600;
		const AFTERNOON_START = 14 * 3600;
		const AFTERNOON_END = 18 * 3600;
		const DAY_SECONDS = 24 * 3600;
		/** Weekday indices returned by {@link weekdayInTimeZone}. */
		const SUNDAY = 0;
		const FRIDAY = 5;
		const SATURDAY = 6;
		/**
		* Validate a timezone against Intl, returning the default when unusable.
		* @param timezone - the configured IANA timezone, or undefined for the default.
		* @returns the timezone to compute with.
		*/
		function resolveTimeZone(timezone) {
			if (timezone === void 0 || timezone === "") return DEFAULT_TIMEZONE;
			try {
				new Intl.DateTimeFormat("en-US", { timeZone: timezone });
				return timezone;
			} catch {
				return DEFAULT_TIMEZONE;
			}
		}
		/**
		* Seconds since midnight for `now` interpreted in `timeZone`.
		* @param now - the instant to read.
		* @param timeZone - the IANA timezone to read it in.
		* @returns 0..86399.
		*/
		function secondsInTimeZone(now, timeZone) {
			const parts = new Intl.DateTimeFormat("en-US", {
				timeZone,
				hourCycle: "h23",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit"
			}).formatToParts(now);
			const get = (type) => Number(parts.find((part) => part.type === type)?.value ?? 0);
			return get("hour") * 3600 + get("minute") * 60 + get("second");
		}
		/** Weekday abbreviations to their `Date.getDay()`-style index. */
		const WEEKDAY_INDEX = {
			Sun: 0,
			Mon: 1,
			Tue: 2,
			Wed: 3,
			Thu: 4,
			Fri: 5,
			Sat: 6
		};
		/**
		* Day-of-week for `now` interpreted in `timeZone`, as `Date.getDay()` would
		* return it (0 = Sunday … 6 = Saturday).
		* @param now - the instant to read.
		* @param timeZone - the IANA timezone to read it in.
		* @returns 0..6.
		*/
		function weekdayInTimeZone(now, timeZone) {
			const part = new Intl.DateTimeFormat("en-US", {
				timeZone,
				weekday: "short"
			}).formatToParts(now).find((entry) => entry.type === "weekday");
			return WEEKDAY_INDEX[part?.value ?? ""] ?? SUNDAY;
		}
		/** Whether the weekday index is Saturday or Sunday. */
		function isWeekend(weekday) {
			return weekday === SATURDAY || weekday === SUNDAY;
		}
		/** Whole days from `weekday` to the next weekday 09:00, skipping the weekend. */
		function daysToNextPeakStart(weekday) {
			switch (weekday) {
				case FRIDAY: return 3;
				case SATURDAY: return 2;
				case SUNDAY: return 1;
				default: return 1;
			}
		}
		/** Seconds from a non-peak instant to the next peak start (next weekday 09:00). */
		function secondsToNextPeakStart(weekday, seconds) {
			return daysToNextPeakStart(weekday) * DAY_SECONDS - seconds + MORNING_START;
		}
		/**
		* Classify one instant into peak/non-peak plus the seconds to the next boundary.
		* Weekends are non-peak all day.
		* @param now - the instant to classify.
		* @param timeZone - the IANA timezone to read it in.
		* @returns the resolved state.
		*/
		function classifyPeak(now, timeZone) {
			const seconds = secondsInTimeZone(now, timeZone);
			const weekday = weekdayInTimeZone(now, timeZone);
			if (isWeekend(weekday)) return {
				peak: false,
				countdownSeconds: secondsToNextPeakStart(weekday, seconds)
			};
			if (seconds >= MORNING_START && seconds < MORNING_END) return {
				peak: true,
				countdownSeconds: MORNING_END - seconds
			};
			if (seconds >= AFTERNOON_START && seconds < AFTERNOON_END) return {
				peak: true,
				countdownSeconds: AFTERNOON_END - seconds
			};
			if (seconds < MORNING_START) return {
				peak: false,
				countdownSeconds: MORNING_START - seconds
			};
			if (seconds < AFTERNOON_START) return {
				peak: false,
				countdownSeconds: AFTERNOON_START - seconds
			};
			return {
				peak: false,
				countdownSeconds: secondsToNextPeakStart(weekday, seconds)
			};
		}
		/**
		* Format a non-negative second count as HH:MM:SS.
		* @param totalSeconds - the count to format.
		* @returns zero-padded HH:MM:SS.
		*/
		function formatCountdown(totalSeconds) {
			const s = Math.max(0, Math.floor(totalSeconds));
			const pad = (n) => String(n).padStart(2, "0");
			return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
		}
		//#endregion
		//#region lib/types/client/locales.js
		/**
		* Peak-hours copy: zh-first dictionaries with an English fallback, selected
		* by the document language. Kept dependency-free (no dsh locale service) so
		* the DOM-injected entry row reads one tiny lookup, matching the task-board /
		* ssh precedent.
		*/
		/** zh dictionary (key-set source of truth). */
		const zh = {
			"entry.peak": "高峰期",
			"entry.offpeak": "非高峰期",
			"entry.countdownToPeak": "距高峰 {time}",
			"entry.countdownToEnd": "距结束 {time}",
			"entry.aria": "高峰时段状态",
			"settings.title": "高峰时段",
			"settings.description": "控制侧边栏高峰状态与倒计时的显示。",
			"settings.enabled": "启用高峰时段提示",
			"settings.enabledHint": "关闭后隐藏侧边栏入口。",
			"settings.timezone": "时区",
			"settings.timezoneHint": "高峰时段按该时区判定；默认北京时间（Asia/Shanghai）。",
			"settings.inherit": "继承",
			"settings.on": "开",
			"settings.off": "关",
			"settings.overridden": "已覆盖",
			"settings.reset": "恢复默认",
			"settings.notExposed": "当前 DSH 版本未向设置页暴露本插件的配置命名空间，表单不可用。可编辑 ~/.dsh/settings.yaml 直接配置，或为 dsh-host-apiproxy 的 WEB_SETTINGS_NAMESPACES 白名单补充本命名空间后重启。",
			"settings.readOnly": "当前部署的设置只读。",
			"settings.expand": "展开设置",
			"settings.collapse": "收起设置",
			"settings.save": "保存",
			"settings.saving": "保存中…",
			"settings.discard": "放弃",
			"settings.unsaved": "未保存",
			"settings.saveFailed": "部署未接受这些值，已保留供你修改。",
			"settings.invalidNumber": "请输入数字，留空则使用默认值。"
		};
		/** en dictionary, complete against the zh key set. */
		const en = {
			"entry.peak": "Peak hours",
			"entry.offpeak": "Off-peak",
			"entry.countdownToPeak": "Peak in {time}",
			"entry.countdownToEnd": "Ends in {time}",
			"entry.aria": "Peak-hours status",
			"settings.title": "Peak Hours",
			"settings.description": "How the sidebar peak-hours status and countdown display.",
			"settings.enabled": "Enable the peak-hours status",
			"settings.enabledHint": "When off, the sidebar entry is hidden.",
			"settings.timezone": "Time zone",
			"settings.timezoneHint": "Peak hours are judged in this time zone; defaults to Beijing time (Asia/Shanghai).",
			"settings.inherit": "Inherit",
			"settings.on": "On",
			"settings.off": "Off",
			"settings.overridden": "Overridden",
			"settings.reset": "Reset to default",
			"settings.notExposed": "This DSH version does not expose this plugin's settings namespace to the configuration page, so the form is unavailable. Edit ~/.dsh/settings.yaml directly, or add the namespace to dsh-host-apiproxy's WEB_SETTINGS_NAMESPACES allowlist and restart.",
			"settings.readOnly": "This deployment stores settings read-only.",
			"settings.expand": "Show settings",
			"settings.collapse": "Hide settings",
			"settings.save": "Save",
			"settings.saving": "Saving…",
			"settings.discard": "Discard",
			"settings.unsaved": "Unsaved",
			"settings.saveFailed": "The deployment did not accept these values; they were left for you to correct.",
			"settings.invalidNumber": "Enter a number, or leave blank to use the default."
		};
		/** Active dictionary, picked by the document language at call time. */
		function dictionary() {
			return (typeof document !== "undefined" ? document.documentElement.lang : "zh").toLowerCase().startsWith("en") ? en : zh;
		}
		/** Translate a key with optional {name} template params. */
		function t(key, params) {
			let text = dictionary()[key];
			if (params !== void 0) for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, value);
			return text;
		}
		//#endregion
		//#region \0dsh-css:H:\dsh-client-ui-peak-hours\src\client\peak-hours.module.css.mjs
		const css$1 = ".pPotoa_entry{box-sizing:border-box;width:100%;color:var(--dsw-alias-state-success-primary);cursor:default;user-select:none;align-items:center;gap:8px;padding:4px 12px;display:flex}.pPotoa_entry[data-peak]{color:var(--dsw-alias-state-warn-primary)}.pPotoa_icon{flex:none;justify-content:center;align-items:center;display:inline-flex}.pPotoa_body{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.pPotoa_label{white-space:nowrap;text-overflow:ellipsis;font-size:13px;font-weight:500;line-height:18px;overflow:hidden}.pPotoa_countdown{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11.5px;line-height:16px;overflow:hidden}[data-dsh-frame][data-sidebar-collapsed] .pPotoa_entry{justify-content:center;padding:0}[data-dsh-frame][data-sidebar-collapsed] .pPotoa_body{display:none}";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin=\"@jdnt/dsh-client-ui-peak-hours\"]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@jdnt/dsh-client-ui-peak-hours";
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var peak_hours_module_css_default = {
			"countdown": "pPotoa_countdown",
			"entry": "pPotoa_entry",
			"label": "pPotoa_label",
			"body": "pPotoa_body",
			"icon": "pPotoa_icon"
		};
		/** Inline clock icon (matches the shell's 16px nav-icon look). */
		const ICON = "<svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"8\" cy=\"8\" r=\"6\"/><path d=\"M8 4.5V8l2.5 1.5\"/></svg>";
		/** Find the sidebar shell root element, or undefined while not yet mounted. */
		function sidebarRoot() {
			const column = document.querySelector("[data-pane=\"sidebar\"], [class*=\"sidebarCol\"]");
			if (column === null) return void 0;
			return column.querySelector("[class*=\"logoRow\"]")?.parentElement ?? column.firstElementChild;
		}
		/** The New Session button: nested in the logo row on current shells, a direct child on legacy shells. */
		function newSessionButton(root) {
			const nested = root.querySelector("button[class*=\"newSession\"]");
			if (nested !== null) return nested;
			for (const child of root.children) if (child.tagName === "BUTTON") return child;
		}
		/** Build the status row (a detached div; insert once the shell is up). */
		function createEntry() {
			const entry = document.createElement("div");
			entry.dataset.dshPeakhoursEntry = "";
			entry.className = peak_hours_module_css_default.entry;
			entry.setAttribute("role", "status");
			entry.setAttribute("aria-label", t("entry.aria"));
			const icon = document.createElement("span");
			icon.className = peak_hours_module_css_default.icon;
			icon.innerHTML = ICON;
			const body = document.createElement("span");
			body.className = peak_hours_module_css_default.body;
			const label = document.createElement("span");
			label.className = peak_hours_module_css_default.label;
			const countdown = document.createElement("span");
			countdown.className = peak_hours_module_css_default.countdown;
			body.append(label, countdown);
			entry.append(icon, body);
			return {
				entry,
				label,
				countdown
			};
		}
		/** Re-insert the status row after the New Session row (before the entry family + browser region). */
		function placeEntry(root, entry) {
			const button = newSessionButton(root);
			if (button === void 0) return false;
			if (entry.parentElement !== root) {
				const row = button.closest("[class*=\"logoRow\"]");
				const base = row !== null && row.parentElement === root ? row : button;
				const family = Array.from(root.children).filter((el) => el instanceof HTMLElement && el.matches("[data-dsh-peakhours-entry], [data-dsh-taskboard-entry], [data-dsh-ssh-entry]"));
				const anchor = family.length > 0 ? family[0] : base.nextElementSibling;
				root.insertBefore(entry, anchor);
			}
			return true;
		}
		/**
		* Mount the sidebar status row, waiting for the shell to render, self-healing
		* on later React re-renders, and refreshing the clock every second.
		* @param source - the live timezone source.
		* @returns disposer removing the entry, observers, and interval.
		*/
		function mountSidebarEntry(source) {
			if (typeof document !== "undefined" && document.querySelector("[data-dsh-peakhours-entry]") !== null) return () => {};
			const { entry, label, countdown } = createEntry();
			let root;
			let placed = false;
			const render = (state) => {
				if (state.peak) entry.dataset.peak = "true";
				else delete entry.dataset.peak;
				label.textContent = state.peak ? t("entry.peak") : t("entry.offpeak");
				const time = formatCountdown(state.countdownSeconds);
				countdown.textContent = state.peak ? t("entry.countdownToEnd", { time }) : t("entry.countdownToPeak", { time });
			};
			const tick = () => {
				render(classifyPeak(/* @__PURE__ */ new Date(), resolveTimeZone(source.getTimeZone())));
			};
			const tryPlace = () => {
				if (root !== void 0 && !root.isConnected) {
					rootObserver.disconnect();
					root = void 0;
					placed = false;
				}
				if (placed) {
					if (document.body.contains(entry)) return;
					rootObserver.disconnect();
					root = void 0;
					placed = false;
				}
				root ??= sidebarRoot();
				if (root === void 0) return;
				placed = placeEntry(root, entry);
				if (placed) rootObserver.observe(root, {
					childList: true,
					subtree: true
				});
			};
			const waitObserver = new MutationObserver(() => {
				tryPlace();
			});
			waitObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
			const rootObserver = new MutationObserver(() => {
				if (root === void 0 || !root.isConnected) {
					placed = false;
					tryPlace();
					return;
				}
				if (!root.contains(entry)) placed = placeEntry(root, entry);
			});
			tryPlace();
			tick();
			const interval = window.setInterval(tick, 1e3);
			return () => {
				waitObserver.disconnect();
				rootObserver.disconnect();
				window.clearInterval(interval);
				entry.remove();
			};
		}
		//#endregion
		//#region \0dsh-css:H:\dsh-client-ui-peak-hours\src\client\settings-card.module.css.mjs
		const css = ".tHYlNq_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.tHYlNq_card:hover{border-color:var(--dsw-alias-label-dimmed)}.tHYlNq_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.tHYlNq_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.tHYlNq_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.tHYlNq_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.tHYlNq_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.tHYlNq_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.tHYlNq_pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.tHYlNq_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.tHYlNq_chevronOpen{transform:rotate(180deg)}.tHYlNq_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}.tHYlNq_readOnly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}.tHYlNq_notExposed{color:var(--dsw-alias-state-warn-primary);margin:12px 0 0;font-size:12px;line-height:1.5}.tHYlNq_footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}.tHYlNq_failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}.tHYlNq_discard,.tHYlNq_save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}.tHYlNq_discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}.tHYlNq_discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.tHYlNq_save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}.tHYlNq_discard:disabled,.tHYlNq_save:disabled{opacity:.4;cursor:default}.tHYlNq_discard:focus-visible,.tHYlNq_save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.tHYlNq_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.tHYlNq_field+.tHYlNq_field{border-top:1px solid var(--dsw-alias-border-l2)}.tHYlNq_head{align-items:center;gap:8px;display:flex}.tHYlNq_label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}.tHYlNq_badges{align-items:center;gap:8px;display:inline-flex}.tHYlNq_badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}.tHYlNq_reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}.tHYlNq_reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}.tHYlNq_reset:disabled{cursor:default}.tHYlNq_reset:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.tHYlNq_input,.tHYlNq_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.tHYlNq_input:focus-visible,.tHYlNq_select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.tHYlNq_input:disabled,.tHYlNq_select:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}.tHYlNq_inputInvalid{border:1px solid var(--dsw-alias-label-error);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.tHYlNq_inputInvalid:focus-visible{outline:2px solid var(--dsw-alias-label-error);outline-offset:1px;border-color:var(--dsw-alias-label-error)}.tHYlNq_invalid{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}.tHYlNq_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}@media (prefers-reduced-motion:reduce){.tHYlNq_card,.tHYlNq_header,.tHYlNq_chevron,.tHYlNq_chevronOpen,.tHYlNq_discard,.tHYlNq_save{transition:none}}";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin=\"@jdnt/dsh-client-ui-peak-hours\"]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@jdnt/dsh-client-ui-peak-hours";
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var settings_card_module_css_default = {
			"badges": "tHYlNq_badges",
			"badge": "tHYlNq_badge",
			"save": "tHYlNq_save",
			"notExposed": "tHYlNq_notExposed",
			"reset": "tHYlNq_reset",
			"input": "tHYlNq_input",
			"select": "tHYlNq_select",
			"readOnly": "tHYlNq_readOnly",
			"inputInvalid": "tHYlNq_inputInvalid",
			"hint": "tHYlNq_hint",
			"field": "tHYlNq_field",
			"footer": "tHYlNq_footer",
			"headText": "tHYlNq_headText",
			"name": "tHYlNq_name",
			"chevron": "tHYlNq_chevron",
			"invalid": "tHYlNq_invalid",
			"description": "tHYlNq_description",
			"body": "tHYlNq_body",
			"header": "tHYlNq_header",
			"cardOpen": "tHYlNq_cardOpen",
			"discard": "tHYlNq_discard",
			"failed": "tHYlNq_failed",
			"head": "tHYlNq_head",
			"label": "tHYlNq_label",
			"card": "tHYlNq_card",
			"chevronOpen": "tHYlNq_chevronOpen",
			"pending": "tHYlNq_pending"
		};
		//#endregion
		//#region lib/types/client/PluginSettingsCard.js
		/**
		* Family-shared chrome for plugin settings cards: a disclosure header naming
		* the plugin and what its settings govern, the controls inside, and the save
		* that writes them. Renders nothing while the namespace is unavailable — a
		* deployment that does not compose the owning plugin should show no trace of
		* it. Inlined into each consumer's client bundle; mirrors the official
		* ui-plugin-config PluginCard in a self-contained slice.
		*/
		/**
		* Render one plugin settings card.
		* @param props - the plugin's copy keys, its form state, and its controls.
		* @returns the card, or nothing while the namespace is still loading.
		*/
		function PluginSettingsCard(props) {
			const [open, setOpen] = (0, react.useState)(false);
			const { state } = props;
			if (!state.available) return null;
			const title = props.t(props.titleKey);
			const description = props.t(props.descriptionKey);
			const blocked = !state.dirty || state.invalid || state.saving;
			const cardClass = open ? `${settings_card_module_css_default.cardOpen} ${settings_card_module_css_default.card}` : settings_card_module_css_default.card;
			if (!state.exposed) return (0, react_jsx_runtime.jsxs)("li", {
				className: cardClass,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: settings_card_module_css_default.header,
					"aria-expanded": open,
					"aria-label": `${props.t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
					onClick: () => {
						setOpen(!open);
					},
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: settings_card_module_css_default.headText,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.name,
							title,
							children: title
						}), (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.description,
							title: description,
							children: description
						})]
					}), (0, react_jsx_runtime.jsx)("svg", {
						width: "14",
						height: "14",
						viewBox: "0 0 14 14",
						fill: "none",
						xmlns: "http://www.w3.org/2000/svg",
						className: open ? `${settings_card_module_css_default.chevron} ${settings_card_module_css_default.chevronOpen}` : settings_card_module_css_default.chevron,
						children: (0, react_jsx_runtime.jsx)("path", {
							d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
							fill: "currentColor"
						})
					})]
				}), open ? (0, react_jsx_runtime.jsx)("div", {
					className: settings_card_module_css_default.body,
					children: (0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.notExposed,
						role: "status",
						children: props.t("settings.notExposed")
					})
				}) : null]
			});
			return (0, react_jsx_runtime.jsxs)("li", {
				className: cardClass,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: settings_card_module_css_default.header,
					"aria-expanded": open,
					"aria-label": `${props.t(open ? "settings.collapse" : "settings.expand")}: ${title}`,
					onClick: () => {
						setOpen(!open);
					},
					children: [
						(0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.headText,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.name,
								title,
								children: title
							}), (0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.description,
								title: description,
								children: description
							})]
						}),
						state.dirty ? (0, react_jsx_runtime.jsx)("span", {
							className: settings_card_module_css_default.pending,
							title: props.t("settings.unsaved"),
							children: props.t("settings.unsaved")
						}) : null,
						(0, react_jsx_runtime.jsx)("svg", {
							width: "14",
							height: "14",
							viewBox: "0 0 14 14",
							fill: "none",
							xmlns: "http://www.w3.org/2000/svg",
							className: open ? `${settings_card_module_css_default.chevron} ${settings_card_module_css_default.chevronOpen}` : settings_card_module_css_default.chevron,
							children: (0, react_jsx_runtime.jsx)("path", {
								d: "M11.8486 5.5L11.4238 5.92383L8.69727 8.65137C8.44157 8.90706 8.21562 9.13382 8.01172 9.29785C7.79912 9.46883 7.55595 9.61756 7.25 9.66602C7.08435 9.69222 6.91565 9.69222 6.75 9.66602C6.44405 9.61756 6.20088 9.46883 5.98828 9.29785C5.78438 9.13382 5.55843 8.90706 5.30273 8.65137L2.57617 5.92383L2.15137 5.5L3 4.65137L3.42383 5.07617L6.15137 7.80273C6.42595 8.07732 6.59876 8.24849 6.74023 8.3623C6.87291 8.46904 6.92272 8.47813 6.9375 8.48047C6.97895 8.48703 7.02105 8.48703 7.0625 8.48047C7.07728 8.47813 7.12709 8.46904 7.25977 8.3623C7.40124 8.24849 7.57405 8.07732 7.84863 7.80273L10.5762 5.07617L11 4.65137L11.8486 5.5Z",
								fill: "currentColor"
							})
						})
					]
				}), open ? (0, react_jsx_runtime.jsxs)("div", {
					className: settings_card_module_css_default.body,
					children: [
						!state.writable ? (0, react_jsx_runtime.jsx)("p", {
							className: settings_card_module_css_default.readOnly,
							role: "status",
							children: props.t("settings.readOnly")
						}) : null,
						props.children,
						(0, react_jsx_runtime.jsxs)("div", {
							className: settings_card_module_css_default.footer,
							children: [
								state.failed ? (0, react_jsx_runtime.jsx)("p", {
									className: settings_card_module_css_default.failed,
									role: "status",
									children: props.t("settings.saveFailed")
								}) : null,
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.discard,
									disabled: !state.dirty || state.saving,
									onClick: props.onDiscard,
									children: props.t("settings.discard")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: settings_card_module_css_default.save,
									disabled: blocked,
									onClick: props.onSave,
									children: props.t(!state.saving ? "settings.save" : "settings.saving")
								})
							]
						})
					]
				}) : null]
			});
		}
		/** A staged boolean field: 继承 / 开 / 关. */
		function BooleanField(props) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [(0, react_jsx_runtime.jsx)("label", {
							className: settings_card_module_css_default.label,
							htmlFor: props.id,
							children: props.label
						}), props.overridden ? (0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.badges,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.badge,
								children: props.overriddenLabel
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null]
					}),
					(0, react_jsx_runtime.jsxs)("select", {
						id: props.id,
						className: settings_card_module_css_default.select,
						value: props.text,
						disabled: props.disabled,
						onChange: (event) => {
							props.onEdit(event.target.value);
						},
						children: [
							(0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: props.inheritLabel
							}),
							(0, react_jsx_runtime.jsx)("option", {
								value: "true",
								children: props.onLabel
							}),
							(0, react_jsx_runtime.jsx)("option", {
								value: "false",
								children: props.offLabel
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: settings_card_module_css_default.hint,
						children: props.hint
					})
				]
			});
		}
		/** A staged enumerated field rendered as a select. */
		function ChoiceField(props) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: settings_card_module_css_default.field,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: settings_card_module_css_default.head,
						children: [(0, react_jsx_runtime.jsx)("label", {
							className: settings_card_module_css_default.label,
							htmlFor: props.id,
							children: props.label
						}), props.overridden ? (0, react_jsx_runtime.jsxs)("span", {
							className: settings_card_module_css_default.badges,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: settings_card_module_css_default.badge,
								children: props.overriddenLabel
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: settings_card_module_css_default.reset,
								disabled: props.disabled,
								onClick: props.onReset,
								children: props.resetLabel
							})]
						}) : null]
					}),
					(0, react_jsx_runtime.jsxs)("select", {
						id: props.id,
						className: settings_card_module_css_default.select,
						value: props.text,
						disabled: props.disabled,
						onChange: (event) => {
							props.onEdit(event.target.value);
						},
						children: [(0, react_jsx_runtime.jsx)("option", {
							value: "",
							children: props.inheritLabel
						}), props.choices.map((choice) => (0, react_jsx_runtime.jsx)("option", {
							value: choice.value,
							children: choice.label
						}, choice.value))]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: props.invalid ? settings_card_module_css_default.invalid : settings_card_module_css_default.hint,
						children: props.invalid ? props.invalidLabel : props.hint
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/settings-form.js
		/**
		* Staged form model behind the plugin settings card. A card stages what the
		* user types and writes it only when they save — the settings write is a
		* durable, revision-fenced document mutation, so staging keeps what is on
		* screen exactly what a save would store. Family-shared slice inlined into
		* each plugin's client bundle; mirrors the official ui-plugin-config
		* card-store pattern.
		*/
		/** A boolean field, edited through true/false draft text. */
		function booleanField(field) {
			return {
				field,
				format: (value) => typeof value === "boolean" ? String(value) : "",
				parse: (text) => {
					const trimmed = text.trim();
					if (trimmed === "") return { kind: "clear" };
					if (trimmed === "true") return {
						kind: "set",
						value: true
					};
					if (trimmed === "false") return {
						kind: "set",
						value: false
					};
				}
			};
		}
		/** An enumerated string field; only the listed choices are accepted. An empty draft clears the field. */
		function choiceField(field, choices) {
			return {
				field,
				format: (value) => typeof value === "string" && choices.includes(value) ? value : "",
				parse: (text) => {
					if (text === "") return { kind: "clear" };
					return choices.includes(text) ? {
						kind: "set",
						value: text
					} : void 0;
				}
			};
		}
		/**
		* Stages one card's edits over one settings namespace and writes them on save.
		*
		* The Host is the only authority on whether a value was accepted — its
		* validators own the constraints no schema can express — so the outcome is
		* read back from the section rather than predicted here. A save that did not
		* land keeps its drafts, so the user can correct them instead of retyping.
		*/
		var CardForm = class {
			scope;
			specs;
			staged = /* @__PURE__ */ new Map();
			listeners = /* @__PURE__ */ new Set();
			saving = false;
			failed = false;
			/** @param scope - the bound settings scope for this card's namespace. */
			constructor(scope, specs) {
				this.scope = scope;
				this.specs = new Map(specs.map((spec) => [spec.field, spec]));
				scope.subscribe(() => {
					this.publish();
				});
			}
			/** Publish a projection of this form, rebuilt whenever the scope or a draft changes. */
			bind(project) {
				const store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)(project());
				this.listeners.add(() => {
					store.set(project());
				});
				return store;
			}
			/** Read the card-level state: what the Host serves, and what a save would do. */
			shell() {
				const snapshot = this.scope.getSnapshot();
				const plan = this.plan();
				return {
					available: snapshot.status !== "loading",
					exposed: snapshot.status === "ready",
					writable: snapshot.writable,
					dirty: plan.length > 0,
					invalid: plan.some((item) => item.run === void 0),
					saving: this.saving,
					failed: this.failed
				};
			}
			/** Read one field's state from the effective section and its staged draft. */
			field(field) {
				const spec = this.specOf(field);
				const staged = this.staged.get(field);
				if (staged === void 0) return {
					text: spec.format(this.sectionValue(field)),
					overridden: this.stored(field),
					invalid: false
				};
				const write = staged.clear ? { kind: "clear" } : spec.parse(staged.text);
				return {
					text: staged.text,
					overridden: write?.kind === "set",
					invalid: write === void 0
				};
			}
			/** The actions the card's slot registration injects. */
			actions() {
				return {
					edit: (field, text) => {
						this.stage(field, {
							text,
							clear: false
						});
					},
					resetField: (field) => {
						this.stage(field, {
							text: this.specOf(field).format(this.baseValue(field)),
							clear: true
						});
					},
					save: () => {
						this.save();
					},
					discard: () => {
						if (this.staged.size === 0 && !this.failed) return;
						this.staged.clear();
						this.failed = false;
						this.publish();
					}
				};
			}
			/**
			* Write every staged edit, then re-seed from what the Host accepted.
			* @returns settlement after every write and the read-back.
			*/
			async save() {
				const plan = this.plan();
				const writes = plan.flatMap((item) => item.run === void 0 ? [] : [item.run]);
				if (plan.length === 0 || this.saving || writes.length !== plan.length) return;
				const fields = new Set(plan.map((item) => item.field));
				this.saving = true;
				this.failed = false;
				this.publish();
				let landed = true;
				for (const write of writes) landed = await write() && landed;
				if (landed) for (const field of fields) this.staged.delete(field);
				this.saving = false;
				this.failed = !landed;
				this.publish();
			}
			/**
			* Every staged edit a save would write. An entry whose draft is not a value
			* its field accepts carries no write: the form is still dirty, and the save
			* refuses rather than dropping the edit. A staged edit that matches the
			* effective section is not a write at all.
			* @returns the planned writes, in the order the fields were staged.
			*/
			plan() {
				const plan = [];
				for (const [field, staged] of this.staged) {
					const spec = this.specOf(field);
					if (staged.clear) {
						if (this.stored(field)) plan.push({
							field,
							run: () => this.clear(field)
						});
						continue;
					}
					if (staged.text === spec.format(this.sectionValue(field))) continue;
					const write = spec.parse(staged.text);
					if (write === void 0) plan.push({
						field,
						run: void 0
					});
					else if (write.kind === "clear") plan.push({
						field,
						run: () => this.clear(field)
					});
					else plan.push({
						field,
						run: () => this.store(field, write.value)
					});
				}
				return plan;
			}
			async clear(field) {
				await this.scope.unset(field);
				return !this.stored(field);
			}
			async store(field, value) {
				await this.scope.set(field, value);
				return this.userLayer()?.[field] === value;
			}
			stage(field, edit) {
				this.staged.set(field, edit);
				this.failed = false;
				this.publish();
			}
			specOf(field) {
				const spec = this.specs.get(field);
				if (spec === void 0) throw new Error(`settings card has no field ${field}`);
				return spec;
			}
			snapshotOf() {
				return this.scope.getSnapshot();
			}
			sectionValue(field) {
				return this.snapshotOf().value?.[field];
			}
			baseValue(field) {
				return this.snapshotOf().base?.[field];
			}
			userLayer() {
				return this.snapshotOf().user;
			}
			stored(field) {
				const user = this.userLayer();
				return user !== void 0 && Object.hasOwn(user, field);
			}
			publish() {
				for (const listener of this.listeners) listener();
			}
		};
		//#endregion
		//#region lib/types/client/PeakHoursSettingsCard.js
		/** IANA timezones the card offers, Beijing first (the composition default). */
		const TIMEZONE_CHOICES = [
			{
				value: "Asia/Shanghai",
				label: "Asia/Shanghai (UTC+8)"
			},
			{
				value: "Asia/Hong_Kong",
				label: "Asia/Hong_Kong (UTC+8)"
			},
			{
				value: "Asia/Tokyo",
				label: "Asia/Tokyo (UTC+9)"
			},
			{
				value: "Asia/Singapore",
				label: "Asia/Singapore (UTC+8)"
			},
			{
				value: "Asia/Kolkata",
				label: "Asia/Kolkata (UTC+5:30)"
			},
			{
				value: "UTC",
				label: "UTC"
			},
			{
				value: "Europe/London",
				label: "Europe/London"
			},
			{
				value: "Europe/Berlin",
				label: "Europe/Berlin (UTC+1)"
			},
			{
				value: "America/New_York",
				label: "America/New_York"
			},
			{
				value: "America/Los_Angeles",
				label: "America/Los_Angeles"
			}
		];
		/** The choice values, so the form spec and the select render the same set. */
		const TIMEZONE_VALUES = TIMEZONE_CHOICES.map((choice) => choice.value);
		/** Bridges the `peak-hours` scope onto the card's staged form. */
		var PeakHoursSettingsCardController = class {
			form;
			store;
			/** @param scope - the bound settings scope for the `peak-hours` namespace. */
			constructor(scope) {
				this.form = new CardForm(scope, [booleanField("enabled"), choiceField("timezone", TIMEZONE_VALUES)]);
				this.store = this.form.bind(() => this.projection());
			}
			projection() {
				return {
					...this.form.shell(),
					enabled: this.form.field("enabled"),
					timezone: this.form.field("timezone")
				};
			}
			/**
			* Build the face the card's slot registration injects.
			* @returns the card's snapshot and its form actions.
			*/
			inject() {
				return {
					hooks: { peakHoursSettingsCard: this.store },
					...this.form.actions()
				};
			}
		};
		/**
		* Render the peak-hours card.
		* @param props - locale copy, the card snapshot, and its form actions.
		* @returns the card.
		*/
		function PeakHoursSettingsCard(props) {
			const { t } = props;
			const state = props.usePeakHoursSettingsCard((snapshot) => snapshot);
			const disabled = !state.writable;
			const fieldProps = {
				overriddenLabel: t("settings.overridden"),
				resetLabel: t("settings.reset"),
				invalidLabel: t("settings.invalidNumber"),
				disabled
			};
			return (0, react_jsx_runtime.jsxs)(PluginSettingsCard, {
				t,
				titleKey: "settings.title",
				descriptionKey: "settings.description",
				state,
				onSave: props.save,
				onDiscard: props.discard,
				children: [(0, react_jsx_runtime.jsx)(BooleanField, {
					id: "settings-peak-hours-enabled",
					label: t("settings.enabled"),
					hint: t("settings.enabledHint"),
					inheritLabel: t("settings.inherit"),
					onLabel: t("settings.on"),
					offLabel: t("settings.off"),
					...fieldProps,
					...state.enabled,
					onEdit: (text) => {
						props.edit("enabled", text);
					},
					onReset: () => {
						props.resetField("enabled");
					}
				}), (0, react_jsx_runtime.jsx)(ChoiceField, {
					id: "settings-peak-hours-timezone",
					label: t("settings.timezone"),
					hint: t("settings.timezoneHint"),
					inheritLabel: t("settings.inherit"),
					choices: [...TIMEZONE_CHOICES],
					...fieldProps,
					...state.timezone,
					onEdit: (text) => {
						props.edit("timezone", text);
					},
					onReset: () => {
						props.resetField("timezone");
					}
				})]
			});
		}
		//#endregion
		//#region lib/types/client/index.js
		/**
		* Peak-hours client plugin: binds the `peak-hours` settings scope (timezone +
		* enabled) and mounts the single DOM surface — the sidebar status row.
		*
		* Fully standalone: it depends only on the dsh platform (the runtime settings
		* scope and the official `settings.plugin.item` card slot), never on any
		* dsh-web-ui sibling plugin. The settings card registers into the core
		* `settings.plugin.item` slot, so it appears on the standard Plugin
		* configuration page with no group-plugin prerequisite.
		*
		* Failure policy: DOM mounting problems are logged, never thrown — the web
		* shell fails the whole boot when a plugin apply throws, and an external
		* plugin must not take the GUI down.
		*/
		/** Locale namespace this plugin owns. */
		const NS = "peak-hours";
		/** Settings namespace the settings card edits (the Host plugin registers it). */
		const PEAK_HOURS_NS = "peak-hours";
		/** Required services (fiber inject waiting — the runtime must be up first). */
		const inject = [
			"slots",
			"settingsScope",
			"locale"
		];
		/**
		* Mount the peak-hours status row and its settings card.
		* @param ctx - client root context (services: settingsScope, locale, slots).
		*/
		function apply(ctx) {
			if (!claimPeakHoursApply()) return;
			ctx.effect(() => releasePeakHoursApply, "peak-hours: apply claim");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "peak-hours: dictionaries");
			const settingsScope = ctx.settingsScope.bind({ namespace: PEAK_HOURS_NS });
			const settingsCard = new PeakHoursSettingsCardController(settingsScope);
			ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
				name: "settings.plugin.item",
				key: PEAK_HOURS_NS,
				locale: NS,
				inject: () => settingsCard.inject()
			}, PeakHoursSettingsCard));
			let uiDisposer;
			const mountUi = () => {
				if (uiDisposer !== void 0) return;
				try {
					uiDisposer = mountSidebarEntry({ getTimeZone: () => settingsScope.getSnapshot().value?.timezone });
				} catch (error) {
					console.warn("[dsh-peak-hours] mount failed:", error);
				}
			};
			const syncEnabled = () => {
				const snapshot = settingsScope.getSnapshot();
				if (snapshot.status === "ready" ? snapshot.value?.enabled ?? true : snapshot.status === "unavailable") mountUi();
				else uiDisposer?.();
			};
			settingsScope.subscribe(syncEnabled);
			syncEnabled();
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map