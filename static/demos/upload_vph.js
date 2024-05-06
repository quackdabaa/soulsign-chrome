// ==UserScript==
// @name              定期上报唯品会cookie
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.0
// @author            inu1255
// @loginURL          http://union.vip.com
// @expire            900e3
// @grant             cookie
// @domain            union.vip.com
// @domain            savemoney.inu1255.cn
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

async function isOnline() {
	var {data} = await axios.get("https://union.vip.com/", {
		headers: {},
	});
	return /center_userType_value = '机构'/.test(data);
}

exports.run = async function () {};

exports.check = async function (param) {
	if (!(await isOnline())) {
		return false;
	}
	await checkCookie();
	return true;
};

async function checkCookie() {
	let JSESSIONID = (await getCookie("https://union.vip.com/", "JSESSIONID")) || "";
	let cookie = `JSESSIONID=${JSESSIONID}`;
	var {data} = await axios.post("https://savemoney.inu1255.cn/api/rebate/vphcookie", {
		cookie: cookie,
	});
	if (data.code == 0) return true;
	throw data.msg;
}
