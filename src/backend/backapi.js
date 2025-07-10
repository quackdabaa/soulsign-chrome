import {syncSave} from "@/common/chrome";
import config from "./config";
import scriptbuild from "./scriptbuild";
import {getCode, beginCode, onCode, startRecord} from "./scriptrecord";
import {addTask, delTask, getTasks, runTask, setTask} from "./utils";

export default {
	"config/get"() {
		return config;
	},
	"config/set"(body) {
		Object.assign(config, body);
		return syncSave({config});
	},
	"task/list"() {
		return getTasks();
	},
	"task/del"(name) {
		return delTask(name);
	},
	"task/add"(task) {
		return addTask(scriptbuild(task));
	},
	"task/set"(task) {
		return setTask(task);
	},
	"task/run"(name) {
		return runTask(name);
	},
	"record/start"(data) {
		return startRecord(data);
	},
	"record/begin"(data) {
		return beginCode(data);
	},
	"record/code"(data) {
		return onCode(data);
	},
	"record/end"(data) {
		return getCode(data);
	},
	// WebDAV相关API
	"webdav/test"() {
		const client = createWebDAVClient();
		if (!client) {
		return Promise.resolve({ success: false, message: "WebDAV未配置或未启用" });
		}
		return client.testConnection().then(success => {
		return { success, message: success ? "连接成功" : "连接失败" };
		});
	},
	"webdav/backup"() {
		return createBackup();
	},
	"webdav/list"() {
		return getBackupList();
	},
	"webdav/restore"(filename) {
		return restoreBackup(filename);
	},
	"webdav/delete"(filename) {
		return deleteBackup(filename);
	}
};
