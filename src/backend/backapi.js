import config from "./config";
import utils from "./utils";
import scriptbuild from "./scriptbuild";
import {getCode, onCode, startRecord} from "./scriptrecord";

export default {
	"config/get"() {
		return config;
	},
	"config/set"(body) {
		Object.assign(config, body);
		return utils.syncSave({config});
	},
	"task/list"() {
		return utils.getTasks();
	},
	"task/del"(name) {
		return utils.delTask(name);
	},
	"task/add"(task) {
		return utils.addTask(scriptbuild(task));
	},
	"task/set"(task) {
		return utils.setTask(task);
	},
	"task/run"(name) {
		return utils.runTask(name);
	},
	"record/start"(data) {
		return startRecord(data);
	},
	"record/code"(data) {
		return onCode(data);
	},
	"record/end"(data) {
		return getCode(data);
	},
};
