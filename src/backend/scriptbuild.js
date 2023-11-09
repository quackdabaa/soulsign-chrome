/**
 * 生成安全的脚本
 */
import axios from "axios";
import Listener from "@/common/Listener";
import {newNotification, withHost} from "@/common/chrome";
import {sleep} from "@/common/utils";
import {TASK_EXT, extTask} from "./utils";

const evt = new Listener();
chrome.tabs.onUpdated.addListener(function (tabId, info) {
	let event = new CustomEvent(tabId + ":" + info.status, {detail: info});
	evt.dispatchEvent(event);
});

function checkDomain(domains, url) {
	let m = /https?:\/\/([^:\/]+)/.exec(url);
	if (!m) return false;
	let ss = m[1].split(".");
	return domains.reduce(function (a, b) {
		if (a) return true;
		if (b == "*") return true;
		let dd = b.split(".");
		if (dd.length != ss.length) return false;
		for (let i = 0; i < ss.length; i++) {
			if (dd[i] != "*" && ss[i] != dd[i]) return false;
		}
		return true;
	}, false);
}

export function frameRunner(tabId, frameId, domains, url) {
	return {
		url,
		eval(code, ...args) {
			if (typeof code === "function") code = `(${code})(${args.map((x) => JSON.stringify(x))});`;
			code = `try{${code}}catch(e){({soulsign_error: e+''})}`;
			return new Promise(function (resolve, reject) {
				chrome.tabs.executeScript(
					tabId,
					{code, frameId, runAt: "document_end", matchAboutBlank: true},
					function (result) {
						result = result && result[0];
						if (result && result.soulsign_error) reject(result.soulsign_error);
						else resolve(result);
					}
				);
			});
		},
		inject(code, ...args) {
			if (typeof code === "function") code = `(${code})(${args.map((x) => JSON.stringify(x))});`;
			return this.eval(function (code) {
				var s = document.createElement("script");
				s.setAttribute("soulsign", "");
				s.innerHTML = code;
				(document.documentElement || document.head).appendChild(s);
			}, code);
		},
		waitLoaded(timeout = 10e3) {
			return new Promise(function (resolve, reject) {
				function fn() {
					resolve(true);
					evt.removeEventListener(tabId + ":complete", fn);
				}
				evt.addEventListener(tabId + ":complete", fn);
				if (timeout > 0)
					setTimeout(function () {
						reject(`页面跳转超时>${timeout / 1e3}s`);
						evt.removeEventListener(tabId + ":complete", fn);
					}, timeout);
			});
		},
		async waitUntil(selector, timeout = 10e3) {
			let retryCount = timeout / 1e3;
			let ret;
			while (retryCount > 0) {
				if (
					(ret = await (typeof selector == "function"
						? selector()
						: this.eval((s) => !!document.querySelector(s), selector)
					).catch(() => false))
				)
					return ret;
				if (--retryCount <= 0) throw `等待${selector}超时>${timeout / 1e3}s`;
				await sleep(1e3);
			}
		},
		async click(selector, timeout = 10e3) {
			await this.waitUntil(selector, timeout).catch((x) =>
				Promise.reject(x.replace("等待", "点击"))
			);
			await this.eval((s) => {
				let el = document.querySelector(s);
				el.click();
			}, selector);
			return true;
		},
		async emit(selector, event, timeout = 10e3) {
			await this.waitUntil(selector, timeout).catch((x) =>
				Promise.reject(x.replace("等待", "点击"))
			);
			await this.eval(
				(s, e) => {
					let el = document.querySelector(s);
					if (/key/.test(event)) event = new KeyboardEvent(e, {bubbles: true});
					else if (/mouse|click/.test(event)) event = new MouseEvent(e, {bubbles: true});
					else if (/touch/.test(event)) event = new TouchEvent(e, {bubbles: true});
					else if (/pointer/.test(event)) event = new PointerEvent(e, {bubbles: true});
					else if (/focus/.test(event)) event = new FocusEvent(e, {bubbles: true});
					else event = new Event(e, {bubbles: true});
					el.dispatchEvent(event);
				},
				selector,
				event
			);
			return true;
		},
		async value(selector, value, timeout = 10e3) {
			await this.waitUntil(selector, timeout).catch((x) =>
				Promise.reject(x.replace("等待", "输入"))
			);
			await this.eval(
				(s, v) => {
					let el = document.querySelector(s);
					el.value = v;
					el.dispatchEvent(new Event("input", {bubbles: true}));
				},
				selector,
				value
			);
			return true;
		},
		async press(selector, value, timeout = 10e3) {
			if (typeof value === "number") value = {keyCode: value};
			if (!value.keyCode && !value.charCode) throw "keypress need keyCode";
			await this.waitUntil(selector, timeout).catch((x) =>
				Promise.reject(x.replace("等待", "按键"))
			);
			await this.eval(
				function press(s, v) {
					if (typeof v === "number") v = {keyCode: v};
					let el = typeof s === "string" ? document.querySelector(s) : s;
					["keydown", "keypress", "keyup"].forEach(function (type, i) {
						var keyboardEvent = document.createEvent("KeyboardEvent");
						keyboardEvent[keyboardEvent.initKeyboardEvent ? "initKeyboardEvent" : "initKeyEvent"](
							type, // event type: keydown, keyup, keypress
							true, // bubbles
							true, // cancelable
							window, // view: should be window
							v.ctrlKey || false, // ctrlKey
							v.altKey || false, // altKey
							v.shiftKey || false, // shiftKey
							v.metaKey || false, // metaKey
							v.keyCode || 0, // keyCode: unsigned long - the virtual key code, else 0
							v.charCode || 0 // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
						);
						el.dispatchEvent(keyboardEvent);
					});
					if (v.keyCode == 13) {
						let p = el.parentElement;
						while (p) {
							if (p.tagName == "FORM") {
								p.submit();
								break;
							}
							p = p.parentElement;
						}
					}
				},
				selector,
				value
			);
			return true;
		},
		iframes() {
			return new Promise(function (resolve, reject) {
				chrome.webNavigation.getAllFrames({tabId: tabId}, function (details) {
					resolve(
						details
							.filter((x) => checkDomain(domains, x.url))
							.map((x) => frameRunner(tabId, x.frameId, domains, x.url))
					);
				});
			});
		},
		sleep,
		/**
		 * @param {string} url
		 * @param {number} fuzzy 模糊匹配模式 3: 匹配host, 2 : 匹配path, 1: 严格匹配, 0: 最佳匹配
		 * @param {number} [timeout=10e3]
		 */
		async getFrame(url, fuzzy, timeout = 10e3) {
			let waitCount = timeout / 1e3;
			fuzzy = fuzzy || 0;
			let urlHost = url.replace(/^(https?:\/\/[^\/]+)[\s\S]*$/, "$1");
			let urlPath = url.split("?")[0];
			if (fuzzy > 2) url = urlHost;
			else if (fuzzy > 1) url = urlPath;
			while (true) {
				let frames = await this.iframes();
				if (!fuzzy || fuzzy == 1) {
					for (let item of frames) {
						if (item.url == url) return item;
					}
				}
				if (fuzzy > 1) {
					for (let item of frames) {
						if (item.url.startsWith(url)) return item;
					}
				} else if (!fuzzy) {
					for (let item of frames) {
						if (item.url.startsWith(urlPath)) return item;
					}
					for (let item of frames) {
						if (item.url.startsWith(urlHost)) return item;
					}
				}
				if (--waitCount < 1) break;
				await this.sleep(1e3);
			}
			throw `等待iframe: ${url} 超时>${timeout / 1e3}s`;
		},
	};
}

/**
 *
 * @param {soulsign.Task} task 脚本允许访问的
 */
export default function (task) {
	let request = axios.create({timeout: 10e3});
	const domains = task.domains.concat();
	request.interceptors.request.use(function (config) {
		if (!checkDomain(domains, config.url)) return Promise.reject(`domain配置不正确`);
		if (config.headers) {
			if (config.headers.Referer) {
				config.headers._referer = config.headers.Referer;
				delete config.headers.Referer;
			} else if (config.headers.referer) {
				config.headers._referer = config.headers.referer;
				delete config.headers.referer;
			}
			if (config.headers.Origin) {
				config.headers._origin = config.headers.Origin;
				delete config.headers.Origin;
			} else if (config.headers.origin) {
				config.headers._origin = config.headers.origin;
				delete config.headers.origin;
			}
			if (config.headers["User-Agent"]) {
				config.headers._user_agent = config.headers["User-Agent"];
				delete config.headers["user-agent"];
			} else if (config.headers["user-agent"]) {
				config.headers._user_agent = config.headers["user-agent"];
				delete config.headers["user-agent"];
			}
		}
		return config;
	});
	let grant = new Set(task.grants);
	let inject = {
		axios: request,
		tools: extTask(),
		/**
		 * 引入第三方JS脚本
		 * @param {string} url
		 */
		require(url) {
			if (!grant.has("require") && !grant.has("loadjs")) return Promise.reject("需要@grant loadjs");
			return axios.get(url, {validateStatus: () => true}).then(function ({data}) {
				let module = {exports: {}};
				if (data.startsWith("var ")) {
					data = data.replace(/^var\s+[^=]+=/, "return ");
				}
				let mod = new Function("exports", "module", data).call(
					module.exports,
					module.exports,
					module
				);
				if (mod) module.exports = mod;
				return module.exports;
			});
		},
		loadjs(url) {
			return inject.require(url);
		},
		/**
		 * 获取指定url指定名字的cookie
		 * @param {string} url
		 * @param {string} name
		 */
		getCookie(url, name) {
			if (!grant.has("cookie")) return Promise.reject("需要@grant cookie");
			return new Promise((resolve, reject) => {
				chrome.cookies.get({url, name}, (x) => resolve(x && x.value));
			});
		},
		/**
		 * 设置指定url指定名字的cookie
		 * @param {string} url
		 * @param {string} name
		 * @param {string} value
		 */
		setCookie(url, name, value) {
			if (!grant.has("cookie")) return Promise.reject("需要@grant cookie");
			return new Promise((resolve, reject) => {
				chrome.cookies.set({url, name, value}, (x) => resolve(x && x.value));
			});
		},
		/**
		 * 获取指定url指定名字的localStorage
		 * @param {string} url
		 * @param {string} name
		 */
		getLocal(url, name) {
			if (!grant.has("localStorage")) return Promise.reject("需要@grant localStorage");
			return withHost(
				url.replace(/(https?:\/\/)?([^\/]+)[^]*/, "$2"),
				`localStorage.getItem(${JSON.stringify(name)})`
			);
		},
		/**
		 * 设置指定url指定名字的localStorage
		 * @param {string} url
		 * @param {string} name
		 * @param {string} value
		 */
		setLocal(url, name, value) {
			if (!grant.has("localStorage")) return Promise.reject("需要@grant localStorage");
			return withHost(
				url.replace(/(https?:\/\/)?([^\/]+)[^]*/, "$2"),
				`localStorage.setItem(${JSON.stringify(name)}, ${JSON.stringify(value)})`
			);
		},
		$(html) {
			var div = document.createElement("div");
			div.innerHTML = html;
			return div.childNodes.length > 1 ? Array.from(div.childNodes) : div.childNodes[0];
		},
		notify(body, url, timeout) {
			if (!grant.has("notify")) throw "需要@grant notify";
			let n = newNotification(task.name, {
				body,
				url,
			});
			setTimeout(function () {
				n.close();
			}, timeout || 300e3);
		},
		openWindow(url, dev, fn, preload) {
			if (!checkDomain(domains, url)) return Promise.reject(`domain配置不正确`);
			return new Promise(function (resolve, reject) {
				chrome.windows.create(
					dev
						? {
								left: 0,
								top: 0,
								width: window.screen.availWidth,
								height: window.screen.availHeight,
								focused: dev,
								type: "normal",
						  }
						: {state: "minimized", focused: false, type: "normal"},
					function (w) {
						if (!dev)
							chrome.windows.update(w.id, {
								state: "minimized",
								drawAttention: false,
								focused: false,
							});
						inject
							.openTab(url, true, fn, preload, w.id)
							.then(resolve, reject)
							.finally(() => chrome.windows.remove(w.id));
					}
				);
			});
		},
		openTab(url, dev, fn, preload, windowId) {
			if (!checkDomain(domains, url)) return Promise.reject(`domain配置不正确`);
			return new Promise(function (resolve, reject) {
				chrome.tabs.create({url, active: dev, windowId}, function (tab) {
					let pms = Promise.resolve();
					if (preload) {
						if (typeof preload === "function") preload = `(${preload})();`;
						pms = new Promise(function (resolve, reject) {
							chrome.cookies.set(
								{url, name: "__soulsign_inject__", value: encodeURIComponent(preload)},
								resolve
							);
						});
					}
					pms
						.then(() => frameRunner(tab.id, 0, domains, url))
						.then((x) => x.waitLoaded().then(() => x))
						.then(fn)
						.then(resolve, reject)
						.finally(() => chrome.tabs.remove(tab.id));
				});
			});
		},
		open(url, dev, fn, preload) {
			if (!checkDomain(domains, url)) return Promise.reject(`domain配置不正确`);
			if (/macintosh|mac os x/i.test(navigator.userAgent))
				return inject.openWindow(url, dev, fn, preload);
			return inject.openTab(url, dev, fn, preload);
		},
	};
	if (!grant.has("eval")) {
		// 脚本中屏蔽以下内容
		Object.assign(inject, {
			window: undefined,
			document: undefined,
			Notification: undefined,
			location: undefined,
			eval: undefined,
			Function: undefined,
			chrome: undefined,
			globalThis: undefined,
		});
	}
	let inject_keys = Object.keys(inject);
	let inject_values = Object.values(inject);
	task = Object.assign({}, TASK_EXT, task);
	let module = {exports: {}};
	new Function("exports", "module", ...inject_keys, task.code)(
		module.exports,
		module,
		...inject_values
	);
	task.check = module.exports.check;
	task.run = module.exports.run;
	return task;
}
