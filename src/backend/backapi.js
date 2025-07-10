import { syncSave } from "@/common/chrome";
import config from "./config";
import scriptbuild from "./scriptbuild";
import { getCode, beginCode, onCode, startRecord } from "./scriptrecord";
import { addTask, delTask, getTasks, runTask, setTask } from "./utils";
import { 
  createBackup, 
  getBackupList, 
  restoreBackup, 
  deleteBackup, 
  createWebDAVClient 
} from "./webdav";

export default {
  "config/get"() {
    return config;
  },
  "config/set"(body) {
    Object.assign(config, body);
    return syncSave({ config });
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
    try {
      const client = createWebDAVClient();
      if (!client) {
        return Promise.resolve({ success: false, message: "WebDAV未配置或未启用" });
      }
      return client.testConnection().then(success => {
        return { success, message: success ? "连接成功" : "连接失败" };
      }).catch(error => {
        console.error("WebDAV测试连接失败", error);
        return { success: false, message: `连接失败: ${error.message || error}` };
      });
    } catch (error) {
      console.error("WebDAV测试连接异常", error);
      return Promise.resolve({ success: false, message: `连接异常: ${error.message || error}` });
    }
  },
  "webdav/backup"() {
    try {
      return createBackup().catch(error => {
        console.error("WebDAV备份失败", error);
        return { success: false, message: `备份失败: ${error.message || error}` };
      });
    } catch (error) {
      console.error("WebDAV备份异常", error);
      return Promise.resolve({ success: false, message: `备份异常: ${error.message || error}` });
    }
  },
  "webdav/list"() {
    try {
      return getBackupList().catch(error => {
        console.error("获取WebDAV备份列表失败", error);
        return [];
      });
    } catch (error) {
      console.error("获取WebDAV备份列表异常", error);
      return Promise.resolve([]);
    }
  },
  "webdav/restore"(filename) {
    try {
      return restoreBackup(filename).catch(error => {
        console.error("恢复WebDAV备份失败", error);
        return { success: false, message: `恢复失败: ${error.message || error}` };
      });
    } catch (error) {
      console.error("恢复WebDAV备份异常", error);
      return Promise.resolve({ success: false, message: `恢复异常: ${error.message || error}` });
    }
  },
  "webdav/delete"(filename) {
    try {
      return deleteBackup(filename).catch(error => {
        console.error("删除WebDAV备份失败", error);
        return { success: false, message: `删除失败: ${error.message || error}` };
      });
    } catch (error) {
      console.error("删除WebDAV备份异常", error);
      return Promise.resolve({ success: false, message: `删除异常: ${error.message || error}` });
    }
  }
};