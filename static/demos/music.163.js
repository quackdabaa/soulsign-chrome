// ==UserScript==
// @name              网易云音乐
// @namespace         https://soulsign.inu1255.cn?account=inu1255
// @version           1.0.1
// @author            inu1255
// @loginURL          https://music.163.com/#/login
// @expire            900000
// @domain            music.163.com
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

exports.run = async function () {
	// 手机签到
	var {data} = await axios.get("http://music.163.com/api/point/dailyTask?type=0");
	if (data.code != 200 && data.code != -2) throw data.msg;
	// 电脑签到
	var {data} = await axios.get("http://music.163.com/api/point/dailyTask?type=1");
	if (data.code == -2) return "重复签到";
	if (data.code != 200) throw data.msg;
};

exports.check = async function (param) {
	var {data} = await axios.get("http://music.163.com/api/point/dailyTask?type=1");
	if (data.code == 200 || data.code == -2) return true;
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://music.163.com/#/login", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(1500 * rate);
		await fb.getFrame("https://music.163.com/login", 2).then((fb) => fb.click("._3xIXD0Q6"));
		await fb.sleep(1500 * rate);
		await fb.getFrame("https://music.163.com/login", 2).then((fb) => fb.click("#j-official-terms"));
		await fb.sleep(1500 * rate);
		await fb
			.getFrame("https://music.163.com/login", 2)
			.then((fb) => fb.value("#j-official-terms", "on"));
		await fb.sleep(1500 * rate);
		await fb
			.getFrame("https://music.163.com/login", 2)
			.then((fb) => fb.value("#j-official-terms", "on"));
		await fb.sleep(1500 * rate);
		await fb.getFrame("https://music.163.com/login", 2).then((fb) => fb.click(".tan2MIhq"));
		await fb.sleep(1500 * rate);
		await fb.click("._3Mb1fXSG>a");
		await fb.sleep(1500 * rate);
		await fb.value("._2OT0mQUQ", param.name);
		await fb.sleep(1500 * rate);
		await fb.value(".sR89MU1J", param.pwd);
		await fb.sleep(1500 * rate);
		await fb.click(".tan2MIhq");
		await fb.waitLoaded();
		return "签到成功";
	});
};
