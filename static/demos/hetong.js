// ==UserScript==
// @name              河童签到
// @namespace         https://soulsign.inu1255.cn?account=slkagura
// @version           1.0.4
// @author            inu1255
// @loginURL          https://hetong-123.info
// @expire            900000
// @domain            hetong-123.info
// @param             email 邮箱
// @param             passwd 密码
// ==/UserScript==

exports.run = async function(param) {
	var {data} = await axios.post("http://hetong-123.info/user/checkin");
	return data.msg;
};

exports.check = async function(param) {
	var {data} = await axios.get("http://hetong-123.info/user/profile");
	if (/我的账号/.test(data)) return true;
	var f = new FormData();
	f.append("email", param.email);
	f.append("passwd", param.passwd);
	f.append("code", "");
	f.append("remember_me", "on");
	var {data} = await axios.post("https://hetong-123.info/auth/login", f, {
		headers: {
			referer: "https://hetong-123.info/auth/login",
		},
	});
	return data.ret == 1;
};
