## Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.8] - 2023-08-25

### 🛠 修复

- 修复Firefox下每次打开浏览器都会签到的问题

## [2.5.7] - 2023-08-24

### 🛠 修复

- 修复Firefox下的问题
- 代码整理

## [2.5.6] - 2023-08-24

### 🛠 修复

- 修复Firefox下无法安装脚本的问题
- 修复Firefox无法显示脚本图标的问题

## [2.5.5] - 2023-08-21

### 🛠 修复

- 删除serviceWorker修复2.4.3版本升级到2.5.0版本后的问题
如果 2.4.3 升级到 2.5.5, 请重新加载插件两次

## [2.5.4] - 2023-08-18

### 🎉 增加

- 签到失败通知

## [2.5.3] - 2023-08-18

### 🛠 修复

- 参数设置界面优化
- 弹窗修复点击mask误关闭的问题

## [2.5.2] - 2023-08-18

### 🛠 修复

- 脚本推荐页面无法安装脚本问题
- 支持关闭浏览器通知

## [2.5.1] - 2023-08-18

### 🛠 修复

- axios支持设置user-agent
- 修复部分 headers 设置不生效的问题

## [2.5.0] - 2023-08-18

### 🎉 增加

- 增加 `getLocal` 获取 `localStorage`, 参考脚本 [阿里云 获取 localStorage](./static//demos/aliyundrive.js)
- 支持设置通知URL, 掉线时向通知URL推送通知
- 脚本支持 `@freq` 自定义运行频率

## [2.4.3] - 2021-02-08

### 🛠 修复

- 优化自动更新

## [2.4.2] - 2020-11-11

### 🎉 增加

- 初步支持脚本录制功能,支持录制点击、输入框输入、表单提交
- popup页面增加cookie管理小工具
- 模拟点击句柄支持press(模拟按键),getFrame(根据url获取iframe页面),详细参见`@types/index.d.ts`

### 🚀 改变

- 模拟点击句柄`waitLoaded`默认10秒超时，如果不想超时请传-1

### 🛠 修复

- 修复有的元素无法生成`css选择器`的bug

## [2.4.0] - 2020-11-11

### 🎉 增加

- 初步支持脚本录制功能,支持录制点击、输入框输入、表单提交
- popup页面增加cookie管理小工具
- 模拟点击句柄支持press(模拟按键),getFrame(根据url获取iframe页面),详细参见`@types/index.d.ts`

### 🚀 改变

- 模拟点击句柄`waitLoaded`默认10秒超时，如果不想超时请传-1

## [2.3.0] - 2020-09-22

### 🎉 增加

- 脚本支持使用窗口或Tab页方式打开页面
- 脚本打开页面支持预执行脚本
- 脚本打开页面支持调用页面内的方法

### 🚀 改变

- 脚本的`open`函数在MacOS上表现为打开新窗口,在其它平台为打开Tab页,可通过`openTab`/`openWindow`明确打开方式
- `open`返回的页面句柄的`eval`/`inject`函数支持传入一个函数和对应的参数(之前只能手动拼字符串)

## [2.2.0] - 2020-09-16

### 🛠 修复

- 修复 `manifest` 获取版本错误

### 🎉 增加

- 增加自动发布和镜像同步的 `workflows`
- 增加 `CHANGELOG.md`
- 添加忽略发布文件（`./build` 和 `build.zip`）
- 增加新的分支 `gh-pages`
- 在仓库 `README.md` 增加 `workflows` 徽章

### 🚀 改变

- 删除仓库中的生产文件，并发布到 `release`
- 将 `./build` 发布到 `gh-pages` 分支
- 更新仓库 `README.md` 中的 `build.zip` 的下载地址
