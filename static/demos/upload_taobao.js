// ==UserScript==
// @name              定期上报淘宝cookie
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.3
// @author            inu1255
// @loginURL          https://login.m.taobao.com/login.htm
// @expire            900e3
// @grant             cookie
// @domain            pages-fast.m.taobao.com
// @domain            main.m.taobao.com
// @domain            login.m.taobao.com
// @domain            savemoney.inu1255.cn
// @domain            localhost
// @param             name 账号
// @param             pwd 密码
// @param             port 端口
// ==/UserScript==

async function getNickname() {
	return "ok";
}

async function login(param) {
	await open("https://main.m.taobao.com/mytaobao/index.html", false, async (fb) => {
		await fb.sleep(1e3);
		await fb.getFrame("https://login.m.taobao.com/login.htm", 2).then(async (fb) => {
			fb.click(".fm-agreement-text");
			await fb.click(".password-login-link");
			await fb.value("#fm-login-id", param.name);
			await fb.value("#fm-login-password", param.pwd);
			await fb.click(".password-login");
			fb.click(".dialog-btn-ok");
			await fb.sleep(3e3);
		});
		await fb.waitLoaded();
		await fb.sleep(2e3);
	});
}

exports.run = async function (param) {
	let data = await checkCookie(param);
	if (data.code == 0) return await getNickname();
	await login(param);
	data = await checkCookie(param);
	if (data.code == 0) return await getNickname();
	return false;
};

exports.check = async function (param) {
	let _m_h5_tk = (await getCookie("https://pages-fast.m.taobao.com", "_m_h5_tk")) || "";
	if (!_m_h5_tk) {
		await open("https://login.m.taobao.com/login.htm", false, async (fb) => {
			await fb.sleep(1e3);
		});
	}
	if (await getNickname()) {
		let data = await checkCookie(param);
		if (data.code == 0) return true;
	}
	await login(param);
	if (await getNickname()) {
		let data = await checkCookie(param);
		if (data.code == 0) return true;
	}
	return false;
};

async function checkCookie(param) {
	let _m_h5_tk = (await getCookie("https://pages-fast.m.taobao.com", "_m_h5_tk")) || "";
	let _m_h5_tk_enc = (await getCookie("https:/pages-fast.m.taobao.com", "_m_h5_tk_enc")) || "";
	let cookie2 = (await getCookie("https://pages-fast.m.taobao.com", "cookie2")) || "";
	let _tb_token_ = (await getCookie("https://pages-fast.m.taobao.com", "_tb_token_")) || "";
	let isg = (await getCookie("https://pages-fast.m.taobao.com", "isg")) || "";
	let cookie = `_m_h5_tk=${_m_h5_tk};_m_h5_tk_enc=${_m_h5_tk_enc};cookie2=${cookie2};_tb_token_=${_tb_token_};isg=${isg}`;
	if (param.port) {
		axios.post("http://localhost:" + param.port + "/api/pintuan/setcookie", {
			user_type: 1,
			cookie,
		});
	}
	var {data} = await axios.post("https://savemoney.inu1255.cn/api/pintuan/setcookie", {
		user_type: 1,
		cookie,
	});
	if (!data) return false;
	return data;
}
