<template>
	<mu-dialog
		v-loading="loading"
		:overlay-close="false"
		title="添加/更新脚本?"
		:width="360"
		:open="Boolean(open)"
		class="pages-preview"
		scrollable
		@update:open="close"
	>
		<ul>
			<li><span class="key">脚本名：</span>{{ task.name }}</li>
			<li><span class="key">作者：</span>{{ task.author }}</li>
			<li>
				<span class="key">域名：</span>
				<div>
					<a
						v-for="(item, i) in task.domains"
						:key="i"
						style="color: red"
						:href="'https://' + item"
						target="_blank"
						><br v-if="i" />{{ item }}</a
					>
				</div>
			</li>
			<li><span class="key">版本：</span>{{ task.version }}</li>
			<li><span class="key">在线检查频率：</span>{{ diff(task.expire || 900e3) }}</li>
			<li>
				<span v-if="task.grants && task.grants.length" class="key">权限：</span>
				<div style="color: red">
					<span v-for="(item, i) in task.grants" :key="i">
						<br v-if="i" />{{ grants[item] || item }}
					</span>
				</div>
			</li>
		</ul>
		<div class="tar">
			<a :href="open" target="_blank">查看代码</a> |
			<a v-if="task.namespace" :href="task.namespace" target="_blank">脚本主页</a>
		</div>
		<mu-button slot="actions" flat @click="close">取消</mu-button>
		<mu-button slot="actions" flat color="primary" @click="$emit('submit', task)">确定</mu-button>
	</mu-dialog>
</template>
<script>
import {compileTask, diff} from "@/backend/utils";
import grants from "../../common/grants";
import axios from "@/common/axios";

export default {
	props: {
		open: {},
	},
	data() {
		return {
			task: {},
			loading: false,
			grants,
		};
	},
	watch: {
		open() {
			this.refresh();
		},
	},
	mounted() {
		if (this.open) this.refresh();
	},
	methods: {
		async refresh() {
			if (!this.open) return;
			this.$with(async () => {
				try {
					let {data} = await axios.get(this.open);
					this.task = compileTask(data);
				} catch (error) {
					this.$toast.error(error + "");
					this.close();
				}
			});
		},
		close() {
			location.href = "#";
			this.$emit("update:open", false);
		},
		diff(v) {
			return diff(v);
		},
	},
};
</script>
<style lang="less">
.pages-preview {
	ul {
		padding: 0;
		margin: 0;
	}
	li {
		list-style: none;
		display: flex;
		> div {
			display: inline-block;
		}
	}
	.key {
		color: #333;
		display: inline-block;
		width: 112px;
		text-align: right;
	}
}
</style>
