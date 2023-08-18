import config from "@/backend/config";
import utils from "@/backend/utils";

export function newNotification(title, opt) {
	let {body, url} = Object.assign({}, opt);
	if (body) title += "@" + body;
	if (config.notify_url) {
		utils.axios
			.get(
				config.notify_url
					.replace("$MSG", encodeURIComponent(title))
					.replace("$URL", encodeURIComponent(url || ""))
			)
			.catch(console.error);
	}
	let n = new Notification(title);
	n.onclick = function () {
		this.close();
		if (url) chrome.tabs.create({url});
	};
	return n;
	// chrome.notifications.create(
	// 	title,
	// 	{
	// 		type: "basic",
	// 		title,
	// 		iconUrl: "icons/48.png",
	// 		message: "已经将旧版本的数据迁移到新版本，旧版本的数据已经清除",
	// 		isClickable: true,
	// 	},
	// 	() => {
	// 		chrome.notifications.onClicked.addListener(() => {
	// 			chrome.tabs.create({url: "/pages/options.html"});
	// 		});
	// 	}
	// );
}

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
