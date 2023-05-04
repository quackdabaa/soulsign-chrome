import Vue from "vue";
import filter from "./filter";
import IDate from "./IDate.vue";
import IRate from "./IRate.vue";
import IForm from "./IForm.vue";
for (let k in filter) {
	Vue.filter(k, filter[k]);
}
Vue.component("IDate", IDate);
Vue.component("IRate", IRate);
Vue.component("IForm", IForm);
Vue.directive("focus", {
	inserted: function (el) {
		let input;
		if (el.tagName == "input") input = el;
		else {
			let rows = el.querySelectorAll(`input,textarea,select,[contenteditable='true']`);
			for (let i = 0; i < rows.length; i++) {
				let row = rows[i];
				if (row.offsetWidth * row.offsetHeight > 0) {
					input = row;
					break;
				}
			}
		}
		if (input)
			setTimeout(function () {
				input.focus();
			}, 100);
	},
});
