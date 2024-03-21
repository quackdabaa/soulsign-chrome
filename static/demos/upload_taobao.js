// ==UserScript==
// @name              定期上报淘宝cookie
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.3
// @author            inu1255
// @loginURL          http://pub.alimama.com
// @expire            900e3
// @grant             cookie
// @domain            pub.alimama.com
// @domain            login.taobao.com
// @domain            savemoney.inu1255.cn
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

/**
 * 将data编码为URL的query参数
 * @param {{[key:string]:any}} data 要编码的数据。
 * @param {number} [limit] 限制过大的参数
 * @returns {string} 编码后的字符串
 * @example
 * encodeQuery({a: 1, b: 2}) // a=1&b=2
 */
function encodeQuery(data, limit) {
	var ss = [];
	for (var k in data) {
		var v = data[k];
		if (v == null || typeof v === "function") continue;
		if (typeof v === "object") v = JSON.stringify(v);
		else v = v.toString();
		if (v.length > limit) continue;
		ss.push(encodeURI(k) + "=" + encodeURI(v));
	}
	return ss.join("&");
}

async function getNickname() {
	var {data} = await axios.get("https://pub.alimama.com/common/getUnionPubContextInfo.json", {
		headers: {},
	});
	if (data.ok) return data.data.mmNick;
}

exports.run = async function () {
	let name = await getNickname();
	let data = await checkCookie();
	if (data.code == 0) return name;
};

exports.check = async function (param) {
	if (await getNickname()) {
		let data = await checkCookie();
		if (data.code == 0) return true;
	}
	await open("https://pub.alimama.com/", false, async (fb) => {
		await fb.sleep(1e3);
		await fb.getFrame("https://login.taobao.com/member/login.jhtml").then(async (fb) => {
			await fb.value("#fm-login-id", param.name);
			await fb.value("#fm-login-password", param.pwd);
			await fb.click(".password-login");
		});
		await fb.waitLoaded();
	});
	if (await getNickname()) {
		let data = await checkCookie();
		if (data.code == 0) return true;
	}
	return false;
};

async function checkCookie() {
	let unb = (await getCookie("https://pub.alimama.com/api", "unb")) || "";
	let cookie2 = (await getCookie("https://pub.alimama.com/api", "cookie2")) || "";
	let _tb_token_ = (await getCookie("https://pub.alimama.com/api", "_tb_token_")) || "";
	let x5sec = (await getCookie("https://pub.alimama.com/api", "x5sec")) || "";
	let cookie = `unb=${unb};cookie2=${cookie2};_tb_token_=${_tb_token_}`;
	if (x5sec) cookie += `;x5sec=${x5sec}`;
	var {data} = await axios.post("https://savemoney.inu1255.cn/api/rebate/tbcookie", {
		cookie: cookie,
	});
	return data;
}
