// ==UserScript==
// @name              光速联
// @version           1.0.0
// @author            kegme
// @loginURL          https://www.fangyb.com/#/Login?pageId=Login&from=
// @expire            900000
// @domain            www.fangyb.com
// @grant             require
// @param             name 账号
// @param             pwd 密码
// @param             token token可以不填写
// ==/UserScript==

exports.run = async function(param) {
	var {data} = await axios.post("https://www.fangyb.com:2039/biz/common/myOrder.action", {userName: param.name}, {headers: {Authorization: param.token}});
	if (data.code) throw data.msg;
	let orderId = "";
	let className;
	try {
		for (let item of data.data.orderDetail.list) {
			if (item.isValid == 1) {
				orderId = item.orderId;
				className = item.className;
				break;
			}
		}
	} catch (error) {}
	if (!orderId) throw "没有找到订单";
	var {data} = await axios.post("https://www.fangyb.com:2039/biz/common/stateSvc.do", {userName: param.name}, {headers: {Authorization: param.token}});
	if (!data.code) return data.msg;
	var {data} = await axios.post("https://www.fangyb.com:2039/biz/common/openSpeed.action", {userName: param.name, orderId, className}, {headers: {Authorization: param.token}});
	if (data.code) throw data.msg;
	return "提速成功";
};

exports.check = async function(param) {
	var {data} = await axios.post("https://www.fangyb.com:2039/biz/common/myOrder.action", {userName: param.name}, {headers: {Authorization: param.token}});
	if (!data.code) {
		if (this.success_at + 8 * 3600e3 < Date.now()) await exports.run(param);
		return true;
	}
	if (!(param.name && param.pwd)) return false;
	let md5 = await require("https://cdn.jsdelivr.net/npm/js-md5@0.7.3/src/md5.min.js");
	let userPassword = md5(param.pwd);
	var {data} = await axios.post("https://www.fangyb.com:2039/biz/user/login.do", {userName: param.name, userPassword});
	if (data.code) throw data.msg;
	param.token = data.data;
	return true;
};
