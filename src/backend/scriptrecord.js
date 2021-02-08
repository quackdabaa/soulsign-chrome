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
			let ss = el.className.trim().split(/\s+/);
			for (let i = 0; i < ss.length; i++) {
				let css = ss[i];
				if (css) {
					s += "." + css;
					if (document.querySelector(s) == el) return s;
				}
			}
			if (!s) {
				s = el.tagName.toLowerCase();
				if (document.querySelector(s) == el) return s;
			}
			let ps = getSelector(el.parentElement);
			if (!ps) return "";
			s = ps + ">" + s;
			if (document.querySelector(s) == el) return s;
			let list = document.querySelectorAll(ps + ">*");
			for (let i = 0; i < list.length; i++) {
				if (list[i] == el) {
					s = ps + `>:nth-child(${i + 1})`;
					break;
				}
			}
			if (document.querySelector(s) == el) return s;
			return "";
		}
		function send(body, cb) {
			if (window.__soulsign_record_main__) body = `await ${body}`;
			else body = `await fb.getFrame(${JSON.stringify(frameURL)},2).then(fb=>${body})`;
			chrome.runtime.sendMessage({path: "record/code", body}, cb);
		}
		function bindInput(el, s) {
			if (!s) s = getSelector(el);
			if (["INPUT", "TEXTAREA"].indexOf(el.tagName) >= 0 && !/submit|button/.test(el.type) && !el.__soulsign__input__) {
				if (el.value) send(`fb.value(${JSON.stringify(s)},${JSON.stringify(el.value)})`);
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
		let el = document.activeElement;
		if (el) bindInput(el);
	}
}

chrome.tabs.onUpdated.addListener(function(tabId, info) {
	if (tabId == prevTab) {
		// console.log(info);
		if (info.url) prevURL = info.url;
		if (info.status == "loading") {
			if (codes.length) {
				if (prevCodeIsWaitLoad) codes[codes.length - 1] = `await fb.waitLoaded(); // ${info.url}`;
				else codes.push(`await fb.waitLoaded(); // ${info.url}`);
				prevCodeIsWaitLoad = true;
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
						codeInited
							? `window.__soulsign_record_main__ = true`
							: function() {
									window.__soulsign_record_main__ = true;
									alert("点击确定开始录制, 切换回魂签界面结束录制");
									chrome.runtime.sendMessage({path: "record/begin", body: ""});
							  }
					)
				);
		}
	}
});

chrome.webNavigation.onDOMContentLoaded.addListener(function(info) {
	if (info.tabId == prevTab) {
		frameRunner(prevTab, info.frameId, ["*"]).eval(contentRecord);
	}
});

// chrome.webNavigation.onCompleted.addListener(function(info) {
// 	if (info.tabId == prevTab) {
// 		console.log("onCompleted", info.frameId, info.url);
// 	}
// });

let codes = [];
let prevTab = 0;
let prevTime = 0;
let prevURL = "";
let prevCodeIsWaitLoad = false;
let codeInited = false;
export function startRecord(body) {
	if (prevTab) {
		prevTab = 0;
	}
	chrome.tabs.create({url: body.url, active: true}, function(tab) {
		chrome.cookies.set({url: body.url, name: "__soulsign_record__", value: "1"}, function() {
			codes = [];
			prevTab = tab.id;
			codeInited = false;
			prevURL = body.url;
		});
	});
}

export function beginCode() {
	codeInited = true;
	prevTime = Date.now();
}

export function onCode(s) {
	console.log("oncode", s);
	if (s) {
		prevCodeIsWaitLoad = false;
		if (codeInited) codes.push(`await fb.sleep(${Date.now() - prevTime} * rate)`);
		codes.push(s);
	}
	prevTime = Date.now();
}

export function getCode() {
	if (prevTab) {
		if (prevCodeIsWaitLoad) {
			codes.push(`if(!(await fb.eval("location.href")).startsWith(${JSON.stringify(prevURL.split("?")[0])})) throw '签到失败'`);
		} else {
			if (codes.length) codes[codes.length - 1] = `if(!${codes[codes.length - 1]}) throw '签到失败'`;
		}
		prevTab = 0;
	}
	return codes.join("\n");
}
