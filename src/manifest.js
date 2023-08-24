const manifest = {
	name: "魂签",
	description: "自动签到",
	author: "inu1255",
	homepage_url: "https://github.com/inu1255/soulsign-chrome",
	manifest_version: 2,
	icons: {
		16: "icons/16.png",
		48: "icons/48.png",
		96: "icons/96.png",
		128: "icons/128.png",
	},
	permissions: [
		"<all_urls>",
		"tabs",
		"cookies",
		"background",
		// 'contextMenus',
		// 'unlimitedStorage',
		"storage",
		"notifications",
		// 'identity',
		// 'identity.email',
		"offscreen",
		"webNavigation",
		"webRequest",
		"webRequestBlocking",
		"declarativeNetRequest",
	],
	host_permissions: ["<all_urls>"],
	browser_action: {
		// action: {
		default_title: "魂签",
		default_icon: "icons/48.png",
		default_popup: "popup.html",
	},
	background: {
		page: "background.html",
	},
	// background: {
	// 	service_worker: "js/background.js",
	// 	type: "module",
	// },
	// sandbox: {
	// 	pages: ["sandbox.html"],
	// },
	//   devtools_page: 'devtools.html',
	options_page: "options.html",
	content_scripts: [
		{
			js: ["js/content.js"],
			run_at: "document_start",
			matches: ["<all_urls>"],
			all_frames: true,
		},
	],
	content_security_policy:
		"script-src 'self' 'unsafe-eval'; object-src 'self'; script-src-elem 'self'",
	web_accessible_resources: ["icons/*"],
	// web_accessible_resources: [
	// 	{
	// 		matches: ["*://*/*"],
	// 		resources: ["icons/*", "sandbox.js"],
	// 	},
	// ],
};

if (manifest.manifest_version == 2) {
	delete manifest.host_permissions;
	let permissions_v3 = new Set(["offscreen"]);
	manifest.permissions = manifest.permissions.filter((x) => !permissions_v3.has(x));
}

module.exports = manifest;
