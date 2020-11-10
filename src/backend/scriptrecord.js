import {frameRunner} from "./scriptbuild";

function contentRecord() {
	if (!window.__soulsign_record__) {
		console.log("魂签录制中...");
		window.__soulsign_record__ = true;
		var frameURL = location.href.split("?")[0];
		function getSelector(el) {
			let s = "";
			if (el.id) {
				s = "#" + CSS.escape(el.id);
				if (document.querySelector(s) == el) return s;
			}
			for (let css of el.className.trim().split(/\s+/)) {
				if (css) {
					s += "." + css;
					if (document.querySelector(s) == el) return s;
				}
			}
			if (!s) s = el.tagName.toLowerCase();
			let ps = getSelector(el.parentElement);
			if (ps) s = ps + ">" + s;
			let list = document.querySelectorAll(s);
			if (list[0] == el) return s;
			for (let i = 1; i < list.length; i++) {
				if (list[i] == el) {
					s += `:nth-child(${i + 1})`;
					break;
				}
			}
			if (document.querySelector(s) == el) return s;
		}
		function send(body, cb) {
			if (window.__soulsign_record_main__) body = `await ${body}`;
			else body = `await fb.getFrame(${JSON.stringify(frameURL)},2).then(fb=>${body})`;
			chrome.runtime.sendMessage({path: "record/code", body}, cb);
		}
		function bindInput(el, s) {
			if (!s) s = getSelector(el);
			if (["INPUT", "TEXTAREA"].indexOf(el.tagName) >= 0 && !/submit|button/.test(el.type) && !el.__soulsign__input__) {
				el.__soulsign__input__ = function() {
					send(`fb.value(${JSON.stringify(s)},${JSON.stringify(el.value)})`);
				};
				el.addEventListener("change", el.__soulsign__input__);
			}
		}
		function press(s, v) {
			if (typeof v === "number") v = {keyCode: v};
			let el = typeof s === "string" ? document.querySelector(s) : s;
			["keydown", "keypress", "keyup"].forEach(function(type, i) {
				var keyboardEvent = document.createEvent("KeyboardEvent");
				keyboardEvent[keyboardEvent.initKeyboardEvent ? "initKeyboardEvent" : "initKeyEvent"](
					type, // event type: keydown, keyup, keypress
					true, // bubbles
					true, // cancelable
					window, // view: should be window
					v.ctrlKey || false, // ctrlKey
					v.altKey || false, // altKey
					v.shiftKey || false, // shiftKey
					v.metaKey || false, // metaKey
					v.keyCode || 0, // keyCode: unsigned long - the virtual key code, else 0
					v.charCode || 0 // charCode: unsigned long - the Unicode character associated with the depressed key, else 0
				);
				el.dispatchEvent(keyboardEvent);
			});
			if (v.keyCode == 13) {
				let p = el.parentElement;
				while (p) {
					if (p.tagName == "FORM") {
						p.submit();
						break;
					}
					p = p.parentElement;
				}
			}
		}
		document.addEventListener("keyup", function(e) {
			if (e.key == "Tab") bindInput(e.target);
		});
		document.addEventListener(
			"keypress",
			function(e) {
				if (!e.isTrusted) return;
				if (e.key == "Enter") {
					e.stopPropagation();
					e.preventDefault();
					let el = e.target;
					let s = getSelector(el);
					if (["INPUT", "TEXTAREA"].indexOf(el.tagName) >= 0 && !/submit|button/.test(el.type)) {
						send(`fb.value(${JSON.stringify(s)},${JSON.stringify(el.value)})`, function() {
							send(`fb.press(${JSON.stringify(s)}, 13)`, () => press(el, 13));
						});
					} else {
						send(`fb.press(${JSON.stringify(s)}, 13)`, () => press(el, 13));
					}
				}
			},
			true
		);
		document.addEventListener(
			"click",
			function(e) {
				if (!e.isTrusted) return;
				e.stopPropagation();
				e.preventDefault();
				let s = getSelector(e.target);
				send(`fb.click(${JSON.stringify(s)})`, () => e.target.click());
				bindInput(e.target, s);
			},
			true
		);
		let els = document.querySelectorAll("input");
		for (let i = 0; i < els.length; i++) {
			let el = els[i];
			bindInput(el);
		}
	}
}

chrome.tabs.onUpdated.addListener(function(tabId, info) {
	if (tabId == prevTab) {
		// console.log(info);
		if (info.status == "loading") {
			if (code && !prevCode.startsWith("await fb.waitLoaded()")) {
				onCode(`await fb.waitLoaded(); // ${info.url}`, true);
			}
		} else if (info.status == "complete") {
			var fb = frameRunner(prevTab, 0, ["*"]);
			fb.iframes()
				.then((iframes) => {
					// console.log(iframes);
					let all = [fb.eval(contentRecord)];
					iframes.map((x) => x.eval(contentRecord));
					return Promise.all(all);
				})
				.then(() =>
					fb.eval(
						code
							? `window.__soulsign_record_main__ = true`
							: function() {
									window.__soulsign_record_main__ = true;
									alert("点击确定开始录制, 切换回魂签界面结束录制");
									chrome.runtime.sendMessage({path: "record/code", body: ""});
							  }
					)
				);
		}
	}
});

// chrome.webNavigation.onDOMContentLoaded.addListener(function(info) {
// 	if (info.tabId == prevTab) {
// 		console.log("onDOMContentLoaded", info.frameId, info.url);
// 	}
// });

// chrome.webNavigation.onCompleted.addListener(function(info) {
// 	if (info.tabId == prevTab) {
// 		console.log("onCompleted", info.frameId, info.url);
// 	}
// });

let code = "";
let prevTab = 0;
let prevTime = 0;
let prevCode = "";
export function startRecord(body) {
	if (prevTab) {
		chrome.tabs.remove(prevTab);
		prevTab = 0;
	}
	chrome.tabs.create({url: body.url, active: true}, function(tab) {
		chrome.cookies.set({url: body.url, name: "__soulsign_record__", value: "1"}, function() {
			code = "";
			prevTab = tab.id;
		});
	});
}

export function onCode(s, nosleep) {
	console.log("oncode", s, nosleep);
	if (s) {
		prevCode = s;
		if (!nosleep) code += `await fb.sleep(${Date.now() - prevTime} * rate)\n`;
		code += s + "\n";
	}
	prevTime = Date.now();
}

export function getCode() {
	if (prevTab) {
		code += `await fb.sleep(${Date.now() - prevTime} * rate)`;
		var tabId = prevTab;
		setTimeout(() => {
			chrome.tabs.remove(tabId);
		}, 1e3);
		prevTab = 0;
	}
	return code;
}
