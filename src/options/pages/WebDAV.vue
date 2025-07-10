// src/options/pages/WebDAV.vue
<template>
  <div class="webdav-page">
    <h2>WebDAV备份设置</h2>
    
    <div class="settings-section">
      <label>
        <span>启用WebDAV备份</span>
        <input v-model="webdav.enabled" type="checkbox" />
      </label>
      
      <label>
        <span>WebDAV服务器地址</span>
        <input v-model="webdav.url" class="full" placeholder="https://dav.example.com/remote.php/dav/files/username/" />
      </label>
      
      <label>
        <span>用户名</span>
        <input v-model="webdav.username" class="full" />
      </label>
      
      <label>
        <span>密码</span>
        <input v-model="webdav.password" type="password" class="full" />
      </label>
      
      <label>
        <span>备份文件夹名称</span>
        <input v-model="webdav.folder" class="full" placeholder="soulsign-backup" />
      </label>
      
      <label>
        <span>启用自动备份</span>
        <input v-model="webdav.autoBackup" type="checkbox" />
      </label>
      
      <label>
        <span>自动备份频率(秒)</span>
        <input v-model="webdav.backupFreq" type="number" />
      </label>
      
      <label>
        <span>最大备份数量</span>
        <input v-model="webdav.maxBackups" type="number" />
      </label>
      
      <div class="buttons">
        <mu-button color="primary" @click="testConnection">测试连接</mu-button>
        <mu-button color="primary" @click="saveSettings">保存设置</mu-button>
      </div>
    </div>
    
    <div class="backup-section">
      <h3>备份管理</h3>
      <div class="buttons">
        <mu-button color="primary" @click="createBackup">创建备份</mu-button>
        <mu-button color="primary" @click="refreshBackupList">获取备份列表</mu-button>
      </div>
      
      <mu-data-table v-if="backups.length > 0" :loading="loading" :columns="columns" :data="backups">
        <template slot-scope="scope">
          <td>{{ scope.row.name }}</td>
          <td>{{ formatDate(scope.row.date) }}</td>
          <td>
            <mu-button small color="primary" @click="restore(scope.row)">恢复</mu-button>
            <mu-button small color="secondary" @click="deleteBackup(scope.row)">删除</mu-button>
          </td>
        </template>
      </mu-data-table>
      <div v-else-if="listRequested">
        <p v-if="loading">正在加载备份列表...</p>
        <p v-else>暂无备份数据</p>
      </div>
    </div>
  </div>
</template>

<script>
import { sendMessage } from "@/common/chrome";
import { format } from "@/common/utils";

export default {
  data() {
    return {
      loading: false,
      listRequested: false, // 标记是否已请求过列表
      webdav: {
        enabled: false,
        url: "",
        username: "",
        password: "",
        folder: "soulsign-backup",
        autoBackup: false,
        backupFreq: 86400,
        maxBackups: 10,
      },
      backups: [],
      columns: [
        { title: "备份文件名", name: "name", width: 300 },
        { title: "备份时间", name: "date", width: 200 },
        { title: "操作", name: "actions", width: 200 },
      ],
    };
  },
  
  async mounted() {
    await this.loadSettings();
    // 不再自动请求备份列表
  },
  
  methods: {
    async loadSettings() {
      try {
        const config = await sendMessage("config/get");
        if (config && config.webdav) {
          this.webdav = { ...config.webdav };
        }
      } catch (error) {
        console.error("加载设置失败", error);
      }
    },
    
    async saveSettings() {
      try {
        await sendMessage("config/set", { webdav: this.webdav });
        this.$toast.success("WebDAV设置已保存");
      } catch (error) {
        this.$toast.error(`保存设置失败: ${error.message || error}`);
        console.error("保存设置失败", error);
      }
    },
    
    async testConnection() {
      try {
        // 先保存当前设置
        await sendMessage("config/set", { webdav: this.webdav });
        
        // 测试连接
        const response = await sendMessage("webdav/test");
        if (response && response.success) {
          this.$toast.success("WebDAV连接成功");
        } else {
          this.$toast.error(`WebDAV连接失败: ${response ? response.message : '未知错误'}`);
        }
      } catch (error) {
        this.$toast.error(`测试连接失败: ${error.message || error}`);
        console.error("测试连接失败", error);
      }
    },
    
    async createBackup() {
      try {
        const result = await sendMessage("webdav/backup");
        if (result && result.success) {
          this.$toast.success("备份创建成功");
          await this.refreshBackupList();
        } else {
          this.$toast.error(`备份创建失败: ${result ? result.message : '未知错误'}`);
        }
      } catch (error) {
        this.$toast.error(`备份创建失败: ${error.message || error}`);
        console.error("备份创建失败", error);
      }
    },
    
    async refreshBackupList() {
      this.loading = true;
      this.listRequested = true;
      try {
        const backups = await sendMessage("webdav/list");
        if (Array.isArray(backups)) {
          this.backups = backups;
        } else {
          this.backups = [];
          console.error("获取备份列表返回格式错误", backups);
        }
      } catch (error) {
        this.$toast.error(`获取备份列表失败: ${error.message || error}`);
        console.error("获取备份列表失败", error);
        this.backups = [];
      } finally {
        this.loading = false;
      }
    },
    
    async restore(backup) {
      try {
        const { result } = await this.$message.confirm(`确定要恢复备份 ${backup.name} 吗？这将覆盖当前的所有配置和任务。`);
        if (!result) return;
        
        const response = await sendMessage("webdav/restore", backup.name);
        if (response && response.success) {
          // 应用恢复的配置和任务
          await sendMessage("config/set", response.config);
          
          let add_cnt = 0;
          let set_cnt = 0;
          if (Array.isArray(response.tasks)) {
            for (let task of response.tasks) {
              if (await sendMessage("task/add", task)) set_cnt++;
              else add_cnt++;
            }
          }
          
          this.$toast.success(`备份恢复成功，导入${add_cnt}条，更新${set_cnt}条`);
          
          // 刷新页面以应用新配置
          setTimeout(() => {
            location.reload();
          }, 1500);
        } else {
          this.$toast.error(`备份恢复失败: ${response ? response.message : '未知错误'}`);
        }
      } catch (error) {
        this.$toast.error(`备份恢复失败: ${error.message || error}`);
        console.error("备份恢复失败", error);
      }
    },
    
    async deleteBackup(backup) {
      try {
        const { result } = await this.$message.confirm(`确定要删除备份 ${backup.name} 吗？`);
        if (!result) return;
        
        const response = await sendMessage("webdav/delete", backup.name);
        if (response && response.success) {
          this.$toast.success("备份删除成功");
          await this.refreshBackupList();
        } else {
          this.$toast.error(`备份删除失败: ${response ? response.message : '未知错误'}`);
        }
      } catch (error) {
        this.$toast.error(`备份删除失败: ${error.message || error}`);
        console.error("备份删除失败", error);
      }
    },
    
    formatDate(date) {
      if (!date) return "未知时间";
      return format("YYYY-MM-DD hh:mm:ss", date);
    },
  },
};
</script>

<style lang="less">
.webdav-page {
  padding: 10px;
  
  h2 {
    margin-bottom: 20px;
  }
  
  .settings-section {
    margin-bottom: 30px;
    
    label {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      
      span {
        min-width: 150px;
      }
      
      input.full {
        flex: 1;
      }
      
      input[type="number"] {
        width: 100px;
      }
    }
  }
  
  .backup-section {
    h3 {
      margin-bottom: 15px;
    }
  }
  
  .buttons {
    margin: 15px 0;
    
    button {
      margin-right: 10px;
    }
  }
}
</style>