// ==UserScript==
// @name              阿里云签到
// @namespace         https://soulsign.inu1255.cn?account=inu1255
// @version           1.0.4
// @author            inu1255
// @loginURL          https://account.aliyun.com/login/qr_login.htm?oauth_callback=https%3A%2F%2Fclub.aliyun.com%2F%23%2F
// @updateURL         https://soulsign.inu1255.cn/script/inu1255/阿里云签到
// @expire            900000
// @domain            club.aliyun.com
// @domain            account.aliyun.com
// @domain            passport.aliyun.com
// @param             name 账号
// @param             pwd 密码
// ==/UserScript==

const opts = {headers: {referer: "https://club.aliyun.com/?spm=5176.12825654.amxosvpfn.27.45162c4a6Uuc9T"}};
exports.run = async function(param) {
	// 使用浏览器打开登录界面，并获取窗口句柄
	return await open("https://club.aliyun.com/", /** 调试时设置成true */ false, async (fb) => {
		var rate = 0.5; // 间隔时间倍率,值越小脚本执行越快
		await fb.sleep(1772 * rate)
		if(!await fb.click(".aliyun-front-btn.aliyun-front-medium.aliyun-front-btn-secondary>.aliyun-front-btn-helper:nth-child(2)")) throw '签到失败'
		await fb.sleep(1760 * rate)
		await fb.click(".ture-table>tbody>:nth-child(3)>:nth-child(3)")
		await fb.sleep(6853 * rate)
		await fb.click(".aliyun-front-icon")
		return "签到成功";
	});
	var {data} = await axios.get("https://club.aliyun.com/json/UserSignIn.json?signSource=pc&signCompany=aliyun", opts);
	if (data.success) return `获得${data.data.todayPoints}金币`;
	throw JSON.stringify(data);
};

exports.check = async function(param) {
	var {data} = await axios.get("https://club.aliyun.com/json/GetUserAllPoint.json", opts);
	if (data.success) return true;
	if (!(param.name && param.pwd)) return false;
	return await open(
		"https://account.aliyun.com/login/qr_login.htm?oauth_callback=https%3A%2F%2Fclub.aliyun.com%2F%23%2F",
		/** 调试时设置成true */ false,
		async (fb) => {
			let n = 500;
			while (n--) {
				// 获取页面所有iframe
				let frames = await fb.iframes();
				for (let fb of frames) {
					// 定位目标iframe,并模拟登录
					if (fb.url.startsWith("https://passport.aliyun.com/mini_login.htm")) {
						await tools.sleep(1e3);
						await fb.value("#fm-login-id", param.name);
						await fb.value("#fm-login-password", param.pwd);
						await fb.click(".fm-button.fm-submit.password-login");
						await fb.waitLoaded();
						return true;
					}
				}
				await tools.sleep(1e3);
			}
			return false;
		},
		function() {
			function o(cb) {
				this.cb = cb;
			}
			o.prototype.unobserve = function() {};
			o.prototype.disconnect = function() {};
			o.prototype.takeRecords = function() {};
			o.prototype.observe = function(target) {
				setTimeout(() => {
					this.cb([{target, isIntersecting: true}]);
				}, 0);
			};
			window.IntersectionObserver = o;
		}
	);
};
