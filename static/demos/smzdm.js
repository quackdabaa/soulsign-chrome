// ==UserScript==
// @name              什么值得买
// @namespace         https://soulsign.inu1255.cn?account=inu1255
// @version           1.0.0
// @author            inu1255
// @loginURL          https://www.smzdm.com/
// @expire            900000
// @domain            zhiyou.smzdm.com
// @domain            www.smzdm.com
// ==/UserScript==

exports.run = async function () {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://www.smzdm.com/", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(1000 * rate);
		await fb.click(".J_punch");
		return await Promise.race([
			fb
				.waitUntil(".error-msg")
				.then(() => fb.eval(() => document.querySelector(".error-msg").innerText)),
			fb.waitUntil(".geetest_panel").then(() => Promise.reject("需要验证码")),
			fb
				.waitUntil(() => fb.eval(() => document.querySelector("#sign-model").clientWidth))
				.then(() => "签到成功"),
		]);
	});
};

exports.check = async function () {
	var {data} = await axios.post(
		"https://zhiyou.smzdm.com/user/article/ajax_get_user_all_series_titles?scene=login&rand=90",
		{headers: {Referer: "https://www.smzdm.com/"}}
	);
	return data.error_code == 0;
};
