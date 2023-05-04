// ==UserScript==
// @name              阿里妈妈
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.0
// @author            inu1255
// @loginURL          https://pub.alimama.com/fourth/effect/account/total/index.htm
// @expire            300e3
// @grant             cookie
// @domain            pub.alimama.com
// @domain            login.taobao.com
// @domain            quan2go.inu1255.cn
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

exports.run = async function() {
	let cookie2 = (await getCookie("https://pub.alimama.com/", "cookie2")) || "";
	return `cookie2=${cookie2}`;
};

exports.check = async function(param) {
	var {data} = await axios.post("https://pub.alimama.com/openapi/param2/1/gateway.unionpub/report.getTbkOrderGrayTime.json");
	if (data.success) return true;
	if (!(param.name && param.pwd)) return false;
	// 使用浏览器打开登录界面，并获取窗口句柄
	await open("https://pub.alimama.com/fourth/effect/account/total/index.htm", /** 调试时设置成true */ false, async (fb) => {
		// 获取页面所有iframe
		let frames = await fb.iframes();
		for (let fb of frames) {
			// 定位目标iframe,并模拟登录
			if (fb.url.startsWith("https://login.taobao.com/")) {
				await fb.value("#fm-login-id", param.name);
				await fb.value("#fm-login-password", param.pwd);
				await fb.click(".fm-button.fm-submit.password-login");
				await fb.waitLoaded();
				return true;
			}
		}
	});
	// var {data} = await axios.post("https://quan2go.inu1255.cn/api/material/alimama_cookie", {cookie: `pin=${pin}; thor=${thor};`});
	// if (data.no == 200) return true;
	// throw data.msg;
	return true;
};
