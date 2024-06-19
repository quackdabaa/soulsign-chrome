import {sleep} from "@/common/utils";
import scriptbuild from "./scriptbuild";
import compareVersions from "compare-versions";
import {getManifest, localGet, localSave, syncGet, syncSave} from "@/common/chrome";

export function fromNow(v, digits, def) {
	digits = digits || 0;
	if (!v) return def || "未设置";
	if (typeof v === "number" && v < 1e12) {
		v *= 1e3;
	}
	v = new Date(v) - new Date();
	let s = diff(Math.abs(v), digits, v > 0 ? "后" : "前");
	if (s) return s;
	return "现在";
}

const ts = [
	[86400e3 * 365, "年"],
	[86400e3 * 30, "月"],
	[86400e3, "天"],
	[3600e3, "小时"],
	[60e3, "分钟"],
	[1e3, "秒"],
];
export function diff(v, digits, suffix) {
	suffix = suffix || "";
	let s = "";
	for (let unit of ts) {
		let diff = v / unit[0];
		let tmp = Math.floor(diff);
		if (tmp) {
			if (digits) {
				let n = Math.pow(10, digits);
				s = Math.floor((v / unit[0]) * n) / n;
			} else {
				s = tmp;
			}
			s += unit[1];
			break;
		}
	}
	if (s) return s + suffix;
}

export function compileTask(text) {
	let beg = text.indexOf("==UserScript==");
	let end = text.indexOf("==/UserScript==");
	if (beg < 0 || end < 0 || beg > end) return;
	let task = {code: text};
	text = text.slice(beg + 14, end);
	text = text.replace(/\n\s*\/\/ ?/g, "\n");
	text = text.split(/\n\s*@/);
	text = text.map((x) => x.trim()).filter((x) => x);
	for (let line of text) {
		let name = /\w+\s*/.exec(line);
		if (name) {
			name = name[0];
			let value = line
				.slice(name.length)
				.replace(
					new RegExp(
						Array.from({length: name.length + 1})
							.fill(" ")
							.join(""),
						"g"
					),
					""
				)
				.trim();
			name = name.trim();
			let one = task[name];
			if (one) {
				let ones = task[name + "s"];
				if (ones) ones.push(value);
				else task[name + "s"] = [one, value];
			}
			task[name] = value;
		}
	}
	// console.log(task)
	if (!task) throw "格式非法,找不到==UserScript==区域";
	if (!task.author) task.author = "";
	if (!task.name) throw "缺少@name";
	if (!task.domain) throw "缺少@domain";
	else if (!task.domains) task.domains = [task.domain];
	if (task.grant && !task.grants) task.grants = task.grant.split(",");
	if (task.param && !task.params) task.params = [task.param];
	if (task.freq) task.freq = +task.freq || 0;
	if (task.params) {
		task._params = {};
		task.params = task.params.map((x) => {
			let param = {};
			let ss = x.split(/\s+/);
			param.placeholder = param.label = param.name = ss[0];
			param.type = "text";
			if (ss.length > 2) {
				param.label = ss.slice(2).join(" ");
				try {
					param.type = "select";
					param.options = `[${ss[1]}]`;
				} catch (error) {
					param.type = ss[1];
				}
			} else if (ss.length == 2) {
				param.label = ss[1];
			}
			let ll = param.label.split(",");
			param.label = ll[0];
			if (ll.length > 1) param.placeholder = ll.slice(1).join(",");
			return param;
		});
	}
	delete task.param;
	delete task.domain;
	task.expire = +task.expire || 900e3; // 默认15分钟过期
	task.enable = false;
	return task;
}

export const TASK_EXT = {
	online_at: 0,
	run_at: 0,
	success_at: 0,
	failure_at: 0,
	result: "",
	enable: true,
	ok: 0,
	cnt: 0,
	_params: {},
};

let cacheTasks;
/**
 * @returns {Promise<soulsign.Task[]>}
 */
export function getTasks() {
	if (cacheTasks) return Promise.resolve(cacheTasks);
	return syncGet("tasks").then((names) => {
		if (!names || !names.length) return (cacheTasks = []);
		return localGet(names).then((tmap) => {
			let tasks = [];
			for (let name of names) {
				try {
					tasks.push(scriptbuild(tmap[name]));
				} catch (e) {
					console.error(`脚本${name}错误`, e);
				}
			}
			return (cacheTasks = tasks);
		});
	});
}

/**
 * @param {string[]} names
 */
export function saveTaskNames(names) {
	return syncSave({tasks: names});
}

/**
 * @param {soulsign.Task} task
 * @returns {boolean} exist
 */
export function addTask(task) {
	if (typeof task.run != "function" && typeof task.check != "function")
		return Promise.reject("脚本需要run/check函数");
	return getTasks().then((tasks) => {
		let exist = false;
		for (let i = 0; i < tasks.length; i++) {
			let oldtask = tasks[i];
			if (oldtask.name == task.name && oldtask.author == task.author) {
				for (let k in TASK_EXT) {
					// 复制原有变量
					if (task[k] == null || TASK_EXT[k] != null) task[k] = oldtask[k];
				}
				tasks.splice(i, 1, task);
				exist = true;
				break;
			}
		}
		let pms = Promise.resolve();
		let name = task.author + "/" + task.name;
		if (!exist) {
			pms = localGet(name).then((oldtask) => {
				if (oldtask) {
					for (let k in TASK_EXT) {
						// 复制原有变量
						if (task[k] == null || TASK_EXT[k] != null) task[k] = oldtask[k];
					}
				}
				tasks.push(task);
			});
		}
		return pms.then(() =>
			Promise.all([
				saveTaskNames(tasks.map((x) => x.author + "/" + x.name)),
				localSave({
					[name]: task,
				}),
			]).then(() => exist)
		);
	});
}

/**
 * @param {string} name
 * @returns {Promise<soulsign.Task>}
 */
export function getTask(name) {
	return getTasks().then((tasks) => {
		for (let task of tasks) {
			if (task.author + "/" + task.name == name) return task;
		}
	});
}

/**
 * @param {string} name
 * @returns {boolean} exist
 */
export function delTask(name) {
	return getTasks().then((tasks) => {
		let names = tasks.map((x) => x.author + "/" + x.name);
		let exist = false;
		for (let i = 0; i < names.length; i++) {
			if (name == names[i]) {
				tasks.splice(i, 1);
				names.splice(i, 1);
				exist = true;
				break;
			}
		}
		if (exist) return saveTaskNames(names).then(() => exist);
		return exist;
	});
}

/**
 * @param {string|soulsign.Task} task
 * @returns {soulsign.Task}
 */
export async function runTask(task) {
	if (typeof task === "string") task = await getTask(task);
	let now = Date.now();
	task.run_at = now;
	task.cnt++;
	console.log(task.name, "开始签到");
	try {
		filTask(task, await task.run(task._params));
		task.success_at = now;
		if (task.failure_at >= task.success_at) task.failure_at = 0;
		task.ok++;
		console.log(task.name, "签到成功");
	} catch (err) {
		filTask(task, err || "失败");
		task.failure_at = now;
		if (task.success_at >= task.failure_at) task.success_at = 0;
		console.error(task.name, "签到失败", err);
	}
	return task;
}

/**
 * @param {soulsign.Task} task
 */
export function setTask(task) {
	let name = task.author + "/" + task.name;
	console.log("setTask", name, task);
	return getTask(name).then(function (oldtask) {
		if (oldtask) {
			Object.assign(oldtask, task);
			localSave({
				[name]: oldtask,
			});
		}
		return !!oldtask;
	});
}

/**
 * @name filterTask filTask
 * @param {string|soulsign.Task.result} result
 * @returns {string|soulsign.Task.result}
 */
export function filTask(task, result = task.result) {
	let base = {
		summary: "",
		detail: [
			{
				domain: task.domains[0],
				url: "#",
				message: "NO_MESSAGE",
				errno: task.success_at < task.failure_at,
			},
		],
	};
	if (typeof result == "object" && result.summary) {
		base = Object.assign(base, result);
	} else {
		base.summary = result + "";
		base.detail[0].message = result;
		if (task.loginURL)
			base.detail[0].url =
				task.loginURL.match(/([^:]+:\/\/[^\/]+)+(.*)/)[Number(!base.detail[0].errno)];
	}
	if (base.summary === "") base.summary = "NO_SUMMARY";
	return (task.result = base);
}

/**
 * @name extendTask extTask
 * @returns {object}
 */
export function extTask() {
	return {
		version: function (version, soulsign_version = getManifest().version) {
			return compareVersions(soulsign_version, version);
		},
		sleep: sleep,
	};
}

export function buildScript(text) {
	let task = compileTask(text);
	return scriptbuild(task);
}
