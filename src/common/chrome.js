import config from "@/backend/config";
import Axios from "axios";

export const isFirefox = /firefox/i.test(navigator.userAgent);

export function newNotification(title, opt) {
	let {body, url} = Object.assign({}, opt);
	if (body) title += "@" + body;
	if (config.notify_url) {
		let fullurl = /^https?:\/\//.test(url) ? url : "";
		Axios.get(
			config.notify_url
				.replace("$MSG", encodeURIComponent(title))
				.replace("$URL", encodeURIComponent(fullurl))
		).catch(console.error);
	}
	if (!config.local_notify) return;
	let n = new Notification(title);
	n.onclick = function () {
		this.close();
		if (url) chrome.tabs.create({url});
	};
	return n;
}

/**
 * 在指定域名下执行代码
 * @param {string} host 域名
 * @param {string} code
 * @returns 返回执行结果
 */
export function withHost(host, code) {
	return new Promise((resolve, reject) => {
		function exec(tab, fn) {
			chrome.tabs.executeScript(tab.id, {code, runAt: "document_idle"}, function (result) {
				resolve(result && result[0]);
				fn && fn();
			});
		}
		chrome.tabs.query({}, (tabs) => {
			for (let tab of tabs) {
				let url = new URL(tab.url);
				console.log(url.host, host);
				if (url.host == host) {
					exec(tab);
					return;
				}
			}
			chrome.tabs.create({url: `http://${host}/a.js`, active: false}, (tab) => {
				chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
					if (tabId == tab.id && info.status == "complete") {
						chrome.tabs.onUpdated.removeListener(listener);
						exec(tab, () => chrome.tabs.remove(tab.id));
					}
				});
			});
		});
	});
}

export function localSave(data) {
	return new Promise(function (resolve, reject) {
		if (isFirefox) data = JSON.parse(JSON.stringify(data));
		chrome.storage.local.set(data, resolve);
	});
}

export function localGet(keys) {
	return new Promise(function (resolve, reject) {
		chrome.storage.local.get(keys, function (data) {
			if (typeof keys === "string") resolve(data && data[keys]);
			else resolve(data);
		});
	});
}

export function syncSave(data) {
	return new Promise(function (resolve, reject) {
		if (isFirefox) data = JSON.parse(JSON.stringify(data));
		chrome.storage.sync.set(data, resolve);
	});
}

export function syncGet(keys) {
	return new Promise(function (resolve, reject) {
		chrome.storage.sync.get(keys, function (data) {
			if (typeof keys === "string") resolve(data && data[keys]);
			else resolve(data);
		});
	});
}

/**
 * 向background发送请求
 * @param {string} path
 * @param {any} body
 * @returns
 */
export function sendMessage(path, body) {
	return new Promise(function (resolve, reject) {
		chrome.runtime.sendMessage({path, body}, function (x) {
			if (x && x.no == 200) return resolve(x.data);
			reject(x && x.msg);
		});
	});
}

/**
 * @returns {chrome.runtime.getManifest}
 */
export function getManifest() {
	return Object.assign({version: "2.1.0"}, chrome.runtime.getManifest());
}
