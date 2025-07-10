import axios from "axios";
import JSZip from "jszip";
import { format } from "@/common/utils";
import config from "./config";
import { getTasks } from "./utils";

class WebDAVClient {
  constructor(url, username, password) {
    this.url = url.endsWith("/") ? url : url + "/";
    this.username = username;
    this.password = password;
    this.client = axios.create({
      auth: {
        username: this.username,
        password: this.password,
      },
      headers: {
        "Content-Type": "application/xml",
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });
  }

  /**
   * 测试WebDAV连接
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      // 使用request方法替代propfind
      const response = await this.client.request({
        method: "PROPFIND",
        url: this.url,
        headers: {
          Depth: "0",
        },
      });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error("WebDAV连接测试失败", error);
      return false;
    }
  }

  /**
   * 创建文件夹
   * @param {string} path 
   * @returns {Promise<boolean>}
   */
  async createFolder(path) {
    try {
      const fullPath = this.url + path;
      const response = await this.client.request({
        method: "MKCOL",
        url: fullPath,
      });
      return response.status === 201 || response.status === 405; // 405表示文件夹已存在
    } catch (error) {
      console.error(`创建文件夹失败: ${path}`, error);
      return false;
    }
  }

  /**
   * 上传文件
   * @param {string} path 
   * @param {Blob|string} content 
   * @returns {Promise<boolean>}
   */
  async uploadFile(path, content) {
    try {
      const fullPath = this.url + path;
      const response = await this.client.put(fullPath, content);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error(`上传文件失败: ${path}`, error);
      return false;
    }
  }

  /**
   * 下载文件
   * @param {string} path 
   * @returns {Promise<Blob>}
   */
  async downloadFile(path) {
    try {
      const fullPath = this.url + path;
      const response = await this.client.get(fullPath, {
        responseType: "blob",
      });
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      }
      throw new Error(`下载文件失败: ${response.status}`);
    } catch (error) {
      console.error(`下载文件失败: ${path}`, error);
      throw error;
    }
  }

  /**
   * 列出文件夹内容
   * @param {string} path 
   * @returns {Promise<Array<{name: string, isDirectory: boolean, lastModified: Date}>>}
   */
  async listFiles(path) {
    try {
      const fullPath = this.url + path;
      // 使用request方法替代propfind
      const response = await this.client.request({
        method: "PROPFIND",
        url: fullPath,
        headers: {
          Depth: "1",
        },
      });
      
      if (response.status >= 200 && response.status < 300) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");
        const responses = xmlDoc.getElementsByTagNameNS("DAV:", "response");
        
        const files = [];
        for (let i = 0; i < responses.length; i++) {
          const href = responses[i].getElementsByTagNameNS("DAV:", "href")[0].textContent;
          const name = decodeURIComponent(href.split("/").pop());
          
          // 跳过当前目录
          if (name === "" || href === fullPath) continue;
          
          const resourceType = responses[i].getElementsByTagNameNS("DAV:", "resourcetype")[0];
          const isDirectory = resourceType.getElementsByTagNameNS("DAV:", "collection").length > 0;
          
          const lastModified = responses[i].getElementsByTagNameNS("DAV:", "getlastmodified")[0]?.textContent;
          
          files.push({
            name,
            isDirectory,
            lastModified: lastModified ? new Date(lastModified) : null,
          });
        }
        
        return files;
      }
      
      throw new Error(`列出文件夹内容失败: ${response.status}`);
    } catch (error) {
      console.error(`列出文件夹内容失败: ${path}`, error);
      return [];
    }
  }

  /**
   * 删除文件
   * @param {string} path 
   * @returns {Promise<boolean>}
   */
  async deleteFile(path) {
    try {
      const fullPath = this.url + path;
      const response = await this.client.delete(fullPath);
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.error(`删除文件失败: ${path}`, error);
      return false;
    }
  }
}

/**
 * 创建WebDAV客户端
 * @returns {WebDAVClient|null}
 */
export function createWebDAVClient() {
  const { webdav } = config;
  if (!webdav.enabled || !webdav.url || !webdav.username || !webdav.password) {
    return null;
  }
  
  return new WebDAVClient(webdav.url, webdav.username, webdav.password);
}

/**
 * 创建备份
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function createBackup() {
  try {
    const client = createWebDAVClient();
    if (!client) {
      return { success: false, message: "WebDAV未配置或未启用" };
    }
    
    // 测试连接
    const connected = await client.testConnection();
    if (!connected) {
      return { success: false, message: "WebDAV连接失败，请检查配置" };
    }
    
    // 确保备份文件夹存在
    const folder = config.webdav.folder || "soulsign-backup";
    await client.createFolder(folder);
    
    // 创建备份文件
    const tasks = await getTasks();
    const zip = new JSZip();
    zip.file("config.json", JSON.stringify(config));
    zip.file("tasks.json", JSON.stringify(tasks));
    
    // 生成备份文件名
    const timestamp = format("YYYY-MM-DD_hh-mm-ss");
    const filename = `${folder}/backup_${timestamp}.soulsign`;
    
    // 生成ZIP文件
    const content = await zip.generateAsync({ type: "blob" });
    
    // 上传备份文件
    const uploaded = await client.uploadFile(filename, content);
    if (!uploaded) {
      return { success: false, message: "备份文件上传失败" };
    }
    
    // 更新最后备份时间
    config.webdav.lastBackup = Date.now();
    
    // 清理旧备份
    await cleanupOldBackups();
    
    return { success: true, message: "备份成功" };
  } catch (error) {
    console.error("创建备份失败", error);
    return { success: false, message: `备份失败: ${error.message}` };
  }
}

/**
 * 清理旧备份
 * @returns {Promise<void>}
 */
async function cleanupOldBackups() {
  try {
    const client = createWebDAVClient();
    if (!client) return;
    
    const folder = config.webdav.folder || "soulsign-backup";
    const files = await client.listFiles(folder);
    
    // 过滤出备份文件并按日期排序
    const backups = files
      .filter(file => !file.isDirectory && file.name.endsWith(".soulsign"))
      .sort((a, b) => {
        if (!a.lastModified || !b.lastModified) return 0;
        return b.lastModified.getTime() - a.lastModified.getTime();
      });
    
    // 保留最新的N个备份，删除其余的
    const maxBackups = config.webdav.maxBackups || 10;
    if (backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      for (const file of toDelete) {
        await client.deleteFile(`${folder}/${file.name}`);
      }
    }
  } catch (error) {
    console.error("清理旧备份失败", error);
  }
}

/**
 * 获取备份列表
 * @returns {Promise<Array<{name: string, date: Date}>>}
 */
export async function getBackupList() {
  try {
    const client = createWebDAVClient();
    if (!client) {
      return [];
    }
    
    const folder = config.webdav.folder || "soulsign-backup";
    await client.createFolder(folder);
    
    const files = await client.listFiles(folder);
    
    // 过滤出备份文件并按日期排序
    return files
      .filter(file => !file.isDirectory && file.name.endsWith(".soulsign"))
      .map(file => ({
        name: file.name,
        date: file.lastModified,
      }))
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return b.date.getTime() - a.date.getTime();
      });
  } catch (error) {
    console.error("获取备份列表失败", error);
    return [];
  }
}

/**
 * 恢复备份
 * @param {string} filename 
 * @returns {Promise<{success: boolean, message: string, config?: object, tasks?: Array}>}
 */
export async function restoreBackup(filename) {
  try {
    const client = createWebDAVClient();
    if (!client) {
      return { success: false, message: "WebDAV未配置或未启用" };
    }
    
    const folder = config.webdav.folder || "soulsign-backup";
    const blob = await client.downloadFile(`${folder}/${filename}`);
    
    // 解析备份文件
    const zip = new JSZip();
    await zip.loadAsync(blob);
    
    // 读取配置和任务
    const configText = await zip.file("config.json").async("string");
    const tasksText = await zip.file("tasks.json").async("string");
    
    const configData = JSON.parse(configText);
    const tasksData = JSON.parse(tasksText);
    
    return { 
      success: true, 
      message: "备份文件读取成功", 
      config: configData, 
      tasks: tasksData 
    };
  } catch (error) {
    console.error("恢复备份失败", error);
    return { success: false, message: `恢复备份失败: ${error.message}` };
  }
}

/**
 * 删除备份
 * @param {string} filename 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteBackup(filename) {
  try {
    const client = createWebDAVClient();
    if (!client) {
      return { success: false, message: "WebDAV未配置或未启用" };
    }
    
    const folder = config.webdav.folder || "soulsign-backup";
    const deleted = await client.deleteFile(`${folder}/${filename}`);
    
    if (!deleted) {
      return { success: false, message: "删除备份文件失败" };
    }
    
    return { success: true, message: "删除备份成功" };
  } catch (error) {
    console.error("删除备份失败", error);
    return { success: false, message: `删除备份失败: ${error.message}` };
  }
}

/**
 * 检查是否需要自动备份
 * @returns {Promise<void>}
 */
export async function checkAutoBackup() {
  try {
    const { webdav } = config;
    if (!webdav || !webdav.enabled || !webdav.autoBackup) return;
    
    const now = Date.now();
    const lastBackup = webdav.lastBackup || 0;
    const backupFreq = (webdav.backupFreq || 86400) * 1000; // 转换为毫秒
    
    if (now - lastBackup >= backupFreq) {
      await createBackup();
    }
  } catch (error) {
    console.error("自动备份检查失败", error);
  }
}