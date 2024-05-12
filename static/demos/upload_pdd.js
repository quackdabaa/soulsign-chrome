// ==UserScript==
// @name              定期上报拼多多cookie
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.0
// @author            inu1255
// @loginURL          https://mobile.yangkeduo.com/pincard_ask.html?__rp_name=brand_amazing_price_group&_pdd_tc=ffffff&_pdd_sbs=1&group_order_id=2579401541774933400&refer_share_channel=wx_qrcode&_x_no_login_launch=1&refer_page_name=login&refer_page_id=10169_1715053601865_rdpdu7m47w&refer_page_sn=10169
// @expire            900e3
// @grant             cookie
// @domain            mobile.yangkeduo.com
// @domain            savemoney.inu1255.cn
// @domain            localhost
// @param             name 账号
// @param             pwd 密码
// @param             port 端口
// ==/UserScript==

async function isOnline() {
	var {data} = await axios.get("https://mobile.yangkeduo.com/personal.html", {
		headers: {},
	});
	return /class="nickname"/.test(data);
}

exports.run = async function (param) {
	return await checkCookie(param);
};

exports.check = async function (param) {
	if (!(await isOnline())) {
		return false;
	}
	await checkCookie(param);
	return true;
};

async function checkCookie(param) {
	let PDDAccessToken = (await getCookie("https://mobile.yangkeduo.com/", "PDDAccessToken")) || "";
	let cookie = `PDDAccessToken=${PDDAccessToken}`;
	if (param.port) {
		axios.post("http://localhost:" + param.port + "/api/pintuan/setcookie", {
			user_type: 3,
			cookie,
		});
	}
	var {data} = await axios.post("https://savemoney.inu1255.cn/api/pintuan/setcookie", {
		user_type: 3,
		cookie,
	});
	if (data.data) return true;
	throw data.msg;
}
