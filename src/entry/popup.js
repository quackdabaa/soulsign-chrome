import Vue from "vue";
import Root from "../popup/Root.vue";
import "../common/base.less";
import "../common/polyfill";

Vue.config.productionTip = false;

/* eslint-disable no-new */
let vue = new Vue({
	el: "#app",
	render: (h) => h(Root),
});
