import Vue from "vue";
import Root from "../options/Root.vue";

import "muse-ui/dist/muse-ui.css";
import MuseUI from "muse-ui";
// Helpers
import Helpers from "muse-ui/lib/Helpers";
// 进度条
import "muse-ui-progress/dist/muse-ui-progress.css";
import MuseUIProgress from "muse-ui-progress";
// toast
import Toast from "muse-ui-toast";
// loading
import "muse-ui-loading/dist/muse-ui-loading.css"; // load css
import Loading from "muse-ui-loading";
// 提示框
import "muse-ui-message/dist/muse-ui-message.css";
import Message from "muse-ui-message";
import "../common/base.less";
import "@/common/polyfill";

import VueClipboard from "vue-clipboard2";
Vue.use(MuseUI);
Vue.use(Helpers);
Vue.use(MuseUIProgress, {
	color: "red",
});
Vue.use(Toast, {
	position: "top",
});
Vue.use(Loading);
Vue.use(Message);

Vue.config.productionTip = false;
Vue.use(VueClipboard);
VueClipboard.config.autoSetContainer = true;

/* eslint-disable no-new */
let vue = new Vue({
	el: "#app",
	render: (h) => h(Root),
});

var link = document.createElement("link");
link.type = "text/css";
link.rel = "stylesheet";
link.href = "https://cdn.bootcss.com/material-design-icons/3.0.1/iconfont/material-icons.css";
document.head.appendChild(link);
