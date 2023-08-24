import Vue from "vue";

Vue.prototype.$icon = (url) => {
	if (/Chrome\//.test(navigator.userAgent)) {
		return `chrome://favicon/${url}`;
	}
	return `https://www.google.com/s2/favicons?domain=${url}`;
};

/**
 * @param {string} [name]
 * @param {Function} fn
 */
Vue.prototype.$with = function (name, fn) {
	if (arguments.length < 2) {
		fn = name;
		name = "loading";
	}
	if (this[name]) return;
	this[name] = true;
	var that = this;
	return Promise.resolve(fn.call(this)).then(
		function (data) {
			that[name] = false;
			return data;
		},
		function (err) {
			that[name] = false;
			return Promise.reject(err);
		}
	);
};
