// ==UserScript==
// @name              unicloud续费
// @version           1.0.0
// @author            inu1255
// @loginURL          https://unicloud.dcloud.net.cn/
// @expire            300e3
// @domain            unicloud.dcloud.net.cn
// @domain            unicloud-api.dcloud.net.cn
// @domain            account.dcloud.net.cn
// @grant             localStorage
// @param             token token
// @param             name 用户名
// @param             passwd 密码
// ==/UserScript==

exports.run = async function (param) {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open(
		"https://unicloud.dcloud.net.cn/",
		/** 调试时设置成true */ false,
		async (fb) => {
			var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
			await fb.sleep(1586 * rate);
			var href = await fb.eval(`location.href`);
			if (href.indexOf("/login") >= 0) {
				let fb1 = await fb.getFrame("https://account.dcloud.net.cn");
				await fb1.value(".uni-input-input", param.name);
				await fb1.value(".uni-forms-item:last-child .uni-input-input", param.passwd);
				await fb1.click(".btn-type-green");
				await fb1.waitLoaded();
			}
			var text = await fb.waitUntil(() =>
				fb.eval(
					`Array.from(document.querySelectorAll('uni-button')).find(x=>['变配','续费'].indexOf(x.innerText)>=0).innerText`
				)
			);
			console.log(text);
			if (text == "续费") {
				let [name, space_id, provider, state, end_at] = await fb.eval(
					`Array.from(document.querySelectorAll('tr:nth-child(2) td')).map(x=>x.innerText)`
				);
				let m = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.exec(end_at);
				let url = `https://unicloud.dcloud.net.cn/uni_modules/uni-trade/pages/create-order/create-order?buy_type=2&provider=aliyun&space_id=${space_id}&package_id=free&name=main&pay_mode=1&end_at=${encodeURIComponent(
					m[0]
				)}`;
				await fb.eval(`location.href="${url}"`);
				await fb.waitLoaded();
				await fb.sleep(1e3);
				await fb.click(".footer-button .uni-btn");
				await fb.waitLoaded();
				await fb.sleep(1e3);
				await fb.click(".order-btn");
				await fb.waitLoaded();
				return "续费成功";
			}
			return text;
		}
	);
};

exports.check = async function (param) {
	if (!param.token)
		param.token = await getLocal("https://unicloud.dcloud.net.cn/", "$UNICLOUD_DB").then((x) => {
			return JSON.parse(x).data.token;
		});
	let {data, status} = await axios.get(
		"https://unicloud-api.dcloud.net.cn/unicloud/api/user/info",
		{
			headers: {
				Token: param.token,
			},
			validateStatus: () => true,
		}
	);
	if (status == 401) {
		delete param.token;
	}
	return data.ret == 0;
};
