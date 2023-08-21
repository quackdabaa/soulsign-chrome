self.addEventListener("install", function (event) {
	console.log("sw install");
	event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});

// 发起请求时去根据uri去匹配缓存，无法命中缓存则发起请求，并且缓存请求
self.addEventListener("fetch", function (event) {
	return fetch(event.request);
});
