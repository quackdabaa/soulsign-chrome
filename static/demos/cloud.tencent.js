// ==UserScript==
// @name              腾讯云积分
// @version           1.0.0
// @author            脚本录制
// @loginURL          https://cloud.tencent.com/login?s_url=https%3A%2F%2Fcloud.tencent.com%2Fact%2Fintegralmall
// @expire            300e3
// @domain            cloud.tencent.com
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

exports.run = async function(param) {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://cloud.tencent.com/act/integralmall", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(1325 * rate);
		await fb.click(".bmh-oviewcard-cbtns-btn");
		await fb.sleep(1804 * rate);
		await fb.click(".dialog-box-foot>.act-btn.act-btn-primary>.act-btn-text");
		await fb.sleep(2147 * rate);
		await fb.click(".dialog-box-foot>.act-btn.act-btn-primary>.act-btn-text");
		await fb.waitLoaded();
		return "签到成功";
	});
};

exports.check = async function(param) {
	var {data} = await axios.get(`https://cloud.tencent.com/login?s_url=https%3A%2F%2Fcloud.tencent.com%2Fact%2Fintegralmall`);
	if (/>立即签到</.test(data)) return true;
	if (!param.name || !param.pwd) return false;
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://cloud.tencent.com/login?s_url=https%3A%2F%2Fcloud.tencent.com%2Fact%2Fintegralmall", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(1176 * rate);
		await fb.click(".clg-other-link>.J-btnSwitchLoginType>span");
		await fb.sleep(1281 * rate);
		await fb.click(".clg-input");
		await fb.sleep(0 * rate);
		await fb.value(".clg-input", param.name);
		await fb.sleep(1397 * rate);
		await fb.value(".clg-input.J-password", param.pwd);
		await fb.sleep(2174 * rate);
		await fb.click(".clg-btn");
		await fb.waitLoaded(); // https://cloud.tencent.com/act/integralmall
		if (!(await fb.eval("location.href")).startsWith("https://cloud.tencent.com/act/integralmall")) throw "签到失败";
		return "签到成功";
	});
};
