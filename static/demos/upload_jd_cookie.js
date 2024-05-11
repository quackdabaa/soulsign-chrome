// ==UserScript==
// @name              定期上报京东cookie
// @namespace         https://github.com/inu1255/soulsign-chrome
// @version           1.0.3
// @author            inu1255
// @loginURL          https://jingfenapp.jd.com/
// @expire            900e3
// @grant             cookie
// @domain            api.m.jd.com
// @domain            plogin.m.jd.com
// @domain            passport.jd.com
// @domain            savemoney.inu1255.cn
// @domain            localhost
// @param             name 账号
// @param             pwd 密码
// @param             port 端口
// ==/UserScript==

async function check() {
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
		return data.result.accountName;
	}
	throw data;
}

exports.run = async function (param) {
	return (await checkCookie(param)) && (await check());
};

exports.check = async function (param) {
	return (await check()) && (await checkCookie(param));
};

async function checkCookie(param) {
	let pt_key = (await getCookie("https://api.m.jd.com/api", "pt_key")) || "";
	if (!pt_key) {
		await open(
			"https://plogin.m.jd.com/login/login?returnurl=https%3A%2F%2Fjingfenapp.jd.com%2F",
			true,
			async (fb) => {
				console.log("pt_key", pt_key);
				await fb.sleep(1e3);
				await fb.click('[report-eventid="MLoginRegister_SMSLogin"] + .quick-btn > .planBLogin');
				await fb.value("#username", param.name);
				await fb.value("#pwd", param.pwd);
				await fb.click(".policy_tip-checkbox");
				await fb.click(".J_ping.btn-active");
				await fb.waitLoaded();
				await fb.waitLoaded();
				await fb.waitLoaded();
			}
		);
	}
	if (!pt_key) throw "未获取到cookie";
	if (param.port) {
		axios.post("http://localhost:" + param.port + "/api/rebate/setcookie", {
			user_type: 5,
			cookie: `pt_key=${pt_key};`,
		});
	}
	var {data} = await axios.post("https://savemoney.inu1255.cn/api/rebate/setcookie", {
		user_type: 5,
		cookie: `pt_key=${pt_key};`,
	});
	if (data.code != 0) return false;
	return true;
}
