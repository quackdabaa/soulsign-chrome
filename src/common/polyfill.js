import Vue from "vue";

Vue.prototype.$icon = (url) => {
	if (/Chrome\//.test(navigator.userAgent)) {
		return `chrome://favicon/${url}`;
	}
	return `https://www.google.com/s2/favicons?domain=${url}`;
};
