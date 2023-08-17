// ==UserScript==
// @name              力扣2068
// @version           1.0.0
// @author            魂签录制
// @loginURL          https://leetcode.cn/
// @expire            300e3
// @domain            leetcode.cn
// @domain            leetcode-cn.com
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

exports.run = async function (param) {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://leetcode.cn/", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(10000 * rate);
		await fb.eval("location.href='https://leetcode.cn/store/'");
		await fb.waitLoaded(); // https://leetcode.cn/store/
		if (!(await fb.eval("location.href")).startsWith("https://leetcode.cn/store/"))
			throw "签到失败";
		return "签到成功";
	});
};

exports.check = async function (param) {
	let resp = await axios.get("https://leetcode-cn.com/explore/");
	return /isSignedIn: true/.test(resp.data);
};
