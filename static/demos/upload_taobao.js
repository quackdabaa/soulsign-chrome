// ==UserScript==
// @name              定期上报淘宝cookie
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.3
// @author            inu1255
// @loginURL          http://www.taobao.com
// @expire            900e3
// @grant             cookie
// @domain            www.taobao.com
// @domain            login.taobao.com
// @domain            www.taobao.com
// @domain            savemoney.inu1255.cn
// @domain            localhost
// @param             name 账号
// @param             pwd 密码
// @param             port 端口
// ==/UserScript==

async function getNickname() {
	var {data} = await axios.get("https://login.taobao.com/member/login.jhtml", {
		headers: {},
	});
	let m = /hasLoginUsername":"([^"]+)"/.exec(data);
	return m ? m[1] : "";
}

async function login(param) {
	await open("https://login.taobao.com/member/login.jhtml", false, async (fb) => {
		await fb.sleep(1e3);
		await Promise.race([
			fb.click(".fm-submit"),
			(async () => {
				await fb.value("#fm-login-id", param.name);
				await fb.value("#fm-login-password", param.pwd);
				await fb.click(".password-login");
			})(),
		]);
		await fb.waitLoaded();
	});
}

exports.run = async function (param) {
	await login(param);
	let data = await checkCookie(param);
	if (data.code == 0) return await getNickname();
	return false;
};

exports.check = async function (param) {
	let _m_h5_tk = (await getCookie("https://www.taobao.com", "_m_h5_tk")) || "";
	if (!_m_h5_tk) {
		await open("https://www.taobao.com/", false, async (fb) => {
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
	let _m_h5_tk = (await getCookie("https://www.taobao.com", "_m_h5_tk")) || "";
	let _m_h5_tk_enc = (await getCookie("https://www.taobao.com", "_m_h5_tk_enc")) || "";
	let cookie2 = (await getCookie("https://www.taobao.com", "cookie2")) || "";
	let _tb_token_ = (await getCookie("https://www.taobao.com", "_tb_token_")) || "";
	let isg = (await getCookie("https://www.taobao.com", "isg")) || "";
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
