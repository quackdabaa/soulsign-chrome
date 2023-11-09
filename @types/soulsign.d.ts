/**
 * 引入第三方JS脚本
 * @param {string} url
 * @example
 * let md5 = await loadjs('https://cdn.jsdelivr.net/npm/md5@2.3.0/dist/md5.min.js');
 * console.log(md5('123456'))
 *
 * let CryptoJS = await loadjs('https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/index.min.js');
 * console.log(CryptoJS)
 */
declare function loadjs(url: string): Promise<any>;

/**
 * 获取指定url指定名字的cookie
 * @param {string} url
 * @param {string} name
 */
declare function getCookie(url: string, name: string): Promise<string>;

/**
 * 设置指定url指定名字的cookie
 * @param {string} url
 * @param {string} name
 * @param {string} value
 */
declare function setCookie(url: string, name: string, value: string): Promise<void>;

/**
 * 获取指定url的localStorage
 * @param {string} url
 * @param {string} name
 */
declare function getLocal(url: string, name: string): Promise<string>;

/**
 * 设置指定url的localStorage
 * @param {string} url
 * @param {string} name
 * @param {string} value
 */
declare function setLocal(url: string, name: string, value: string): Promise<void>;

/**
 * 创建一个临时dom
 * @param {string} html
 * @example
 * let div = $('<div>&nbsp;</div>');
 * console.log(div.innerText)
 */
declare function $(html: string): Promise<HTMLElement>;

/**
 * 发送一个通知,如果设置了通知推送URL,也会发送到指定的URL
 * @param {string} msg 通知内容
 * @param {string} url 点击通知跳转的URL
 * @param {number} timeout 通知显示时间(毫秒),默认5分钟
 */
declare function notify(msg: string, url?: string, timeout?: number): Promise<void>;

interface Browser {
	/**
	 * 执行js代码
	 * @param code 要执行的代码
	 */
	eval(code: string | Function, ...args): Promise<any>;

	/**
	 * 等待指定时间(毫秒)
	 * @param {number} ms
	 */
	sleep(ms: number): Promise<void>;

	/**
	 * 用script标签注入js代码
	 * @param code js代码
	 */
	injec(code: string | Function, ...args): Promise<any>;

	/**
	 * 等待页面加载完成
	 * @param timeout 等待超时时间(毫秒),默认10秒
	 * @returns {Promise<boolean>} 是否加载完成
	 */
	waitLoaded(timeout?: number): Promise<boolean>;

	/**
	 * 等待指定选择器的元素出现或函数返回true
	 * @template T
	 * @param selector css选择器 或 一个函数
	 * @param timeout 等待超时时间(毫秒),默认10秒
	 * @returns {Promise<T>} 是否加载完成
	 * @example
	 * fb.waitUntil(() => fb.eval(() => document.querySelector("#sign-model").clientWidth)).then(() => "签到成功")
	 */
	waitUntil<T>(selector: string | (() => Promise<T>), timeout?: number): Promise<T>;

	/**
	 * 点击指定选择器的元素, 如果元素不存在, 则等待元素出现后再点击
	 * @param selector 选择器
	 * @param timeout 等待超时时间(毫秒),默认10秒
	 * @returns {Promise<boolean>} 是否点击完成
	 */
	click(selector: string, timeout?: number): Promise<boolean>;

	/**
	 * 选择器的元素, 如果元素不存在, 则等待元素出现后再点击
	 * @param selector 选择器
	 * @param timeout 等待超时时间(毫秒),默认10秒
	 * @returns {Promise<boolean>} 是否点击完成
	 */
	emit(selector: string, event: string, timeout?: number): Promise<boolean>;

	/**
	 * 等待指定选择器的元素出现后, 输入指定的内容
	 * @param selector 选择器
	 * @param value 要输入的内容
	 * @param timeout 等待超时时间(毫秒),默认10秒
	 * @returns {Promise<boolean>} 是否输入完成
	 */
	value(selector: string, value: string, timeout?: number): Promise<boolean>;

	/**
	 * 等待指定选择器的元素出现后, 模拟键盘事件
	 * @param selector 选择器
	 * @param value 要输入的内容, 可以是键盘码, 也可以是键盘事件对象
	 * @param timeout 等待超时时间(毫秒),默认10秒
	 * @returns {Promise<boolean>} 是否输入完成
	 */
	press(
		selector: string,
		value:
			| number
			| {
					ctrlKey?: boolean;
					altKey?: boolean;
					shiftKey?: boolean;
					metaKey?: boolean;
					keyCode?: number;
					charCode?: number;
			  },
		timeout?: number
	): Promise<boolean>;

	/**
	 * 获取全部 iframe
	 */
	iframes(): Promise<Browser[]>;

	/**
	 * 获取指定 iframe
	 * @param url 指定 iframe 的 url
	 * @param {0|1|2|3} [fuzzy] 模糊匹配模式 3:匹配host, 2:匹配path, 1:严格匹配, 0:先完整匹配,再匹配path,最后匹配host
	 * @param {number} [timeout=10e3] 等待超时时间(毫秒),默认10秒
	 * @returns {Promise<Browser>} iframe
	 */
	getFrame(url: string, fuzzy?: 0 | 1 | 2 | 3, timeout?: number): Promise<Browser>;
}

/**
 * 新窗口打开一个URL
 * @param {string} url
 * @param {boolean} dev 调试模式
 * @param {(fb:Browser)=>Promise<any>} fn 回调函数
 * @param {string} [preload] 预加载的JS脚本
 * @example
 */
declare function open(
	url: string,
	dev: boolean,
	fn: (fb: Browser) => Promise<any>,
	preload?: string
): Promise<void>;
