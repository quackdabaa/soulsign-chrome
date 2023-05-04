export function newNotification(title) {
	return new Notification(title);
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
