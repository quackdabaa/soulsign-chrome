<template>
	<div class="root">
		<div class="tar">
			<a @click="reload">重启</a>
			<a @click="tab = 0">设置</a>
			<a @click="tab = 1">辅助</a>
			<a target="_blank" href="/options.html">任务管理</a>
		</div>
		<div v-if="tab == 0">
			<label>
				<span>开启浏览器通知,不会影响推送URL通知</span>
				<input v-model="config.local_notify" type="checkbox" />
			</label>
			<label>
				<span>掉线通知频率(秒),默认1小时</span>
				<input v-model="config.notify_freq" type="number" />
			</label>
			<label>
				<span>失败重试频率(秒),默认10分钟</span>
				<input v-model="config.retry_freq" type="number" />
			</label>
			<label>
				<span>任务循环频率(秒)</span>
				<input v-model="config.loop_freq" type="number" />
			</label>
			<label>
				<span>签到开始时间(秒),默认8点整</span>
				<input v-model="config.begin_at" type="number" />
			</label>
			<label>
				<span>自动更新脚本</span>
				<input v-model="config.upgrade" type="checkbox" />
			</label>
			<label>
				<span>自动更新频率(秒),默认1天</span>
				<input v-model="config.upgrade_freq" type="number" />
			</label>
			<label>
				<span>任务超时限制(秒),默认60秒</span>
				<input v-model="config.timeout" type="number" />
			</label>
			<label>
				<span>通知推送URL,如:掉线时会通过这个URL推送通知,请使用$MSG占位符</span>
				<input
					v-model="config.notify_url"
					class="full"
					placeholder="如: https://xxx.com/text=$MSG&url=$URL"
				/>
			</label>
			<div class="tar footer">
				<button @click="save">保存</button>
			</div>
		</div>
		<div v-else>
			<label>
				<span>cookie</span>
				<textarea v-model="cookie" cols="30" rows="10"></textarea></label
			><br />
			<div class="tar footer">
				<button @click="saveCookie((cookie = ''))">清空</button>
				<button @click="copyCookie">复制</button>
				<button @click="saveCookie">保存</button>
			</div>
		</div>
	</div>
</template>
<script>
import {sendMessage} from "@/common/chrome";
import {copy} from "@/common/utils";

export default {
	data: function () {
		return {
			config: {},
			tab: 0,
			cookie: "",
		};
	},
	async mounted() {
		this.config = await sendMessage("config/get");
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			if (!tabs.length) return;
			let url = tabs[0].url;
			chrome.cookies.getAll(
				{url},
				(cookies) => (this.cookie = cookies.map((x) => `${x.name}=${x.value}`).join(";\n"))
			);
		});
	},
	methods: {
		save() {
			sendMessage("config/set", this.config);
		},
		copyCookie() {
			copy(this.cookie);
		},
		saveCookie() {
			chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
				if (!tabs.length) return;
				let url = tabs[0].url;
				console.log(url);
				chrome.cookies.getAll({url}, (cookies) => {
					Promise.all(
						cookies.map(
							(x) =>
								new Promise((resolve, reject) => {
									chrome.cookies.remove({url, name: x.name}, resolve);
								})
						)
					).then(() => {
						this.cookie
							.split(/;\s*/)
							.filter((x) => x.trim())
							.map((x) => x.split("="))
							.map((x) => ({name: x[0].trim(), value: x[1].trim(), url}))
							.map((x) => chrome.cookies.set(x));
					});
				});
			});
		},
		reload() {
			chrome.runtime.reload();
		},
	},
};
</script>
<style lang="less">
.root {
	min-width: 240px;
	.tar {
		margin-bottom: 10px;
		button,
		a {
			margin-left: 10px;
		}
	}
	label {
		display: flex;
		align-items: center;
		margin-bottom: 3px;
		flex-wrap: wrap;
		span {
			margin-right: 10px;
		}
	}
	.full {
		width: 100%;
	}
	input[type="number"] {
		width: 56px;
	}
	.footer {
		margin-top: 10px;
	}
}
</style>
