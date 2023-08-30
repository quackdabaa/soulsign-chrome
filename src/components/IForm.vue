<template>
	<mu-dialog
		:overlay-close="false"
		class="i-form"
		:title="title"
		:width="width"
		:open="Boolean(open)"
		:fullscreen="fullscreen"
		scrollable
		@update:open="close"
	>
		<mu-form ref="form" :model="body" label-position="top">
			<mu-form-item
				v-for="param in items"
				:key="param.name"
				:prop="param.name"
				:label="param.label || param.title"
				:rules="param.rules"
			>
				<!-- 下拉选择框 -->
				<mu-select
					v-if="param.type == 'select'"
					v-model="body[param.name]"
					:disabled="param.disabled"
				>
					<mu-option
						v-for="opt in param.options"
						:key="opt.value"
						:label="opt.label"
						:value="opt.value"
					></mu-option>
				</mu-select>
				<!-- 多选框 -->
				<mu-checkbox
					v-else-if="param.type == 'checkbox'"
					:input-value="Boolean(body[param.name])"
					:type="param.type"
					:disabled="param.disabled"
					@change="(v) => $set(body, param.name, v)"
				></mu-checkbox>
				<!-- 日期选择 -->
				<mu-date-input
					v-else-if="['date', 'time', 'year', 'month', 'dateTime'].indexOf(param.type) >= 0"
					v-model="body[param.name]"
					:disabled="param.disabled"
				></mu-date-input>
				<!-- 输入框 -->
				<mu-text-field
					v-else-if="['img', 'qr'].indexOf(param.type) >= 0"
					v-model="body[param.name]"
					:placeholder="param.placeholder || '粘贴图片/图片链接'"
					:disabled="param.disabled"
					@paste="paste(param, $event)"
				>
					<mu-menu slot="append" open-on-hover>
						<mu-button flat @click="upload(param)">上传图片</mu-button>
						<mu-paper slot="content" :z-index="1">
							<img width="240" :src="body[param.name]" alt="" />
						</mu-paper>
					</mu-menu>
				</mu-text-field>
				<mu-text-field
					v-else
					v-model="body[param.name]"
					:type="param.type"
					:min="param.min"
					:max="param.max"
					:max-length="param.maxlength"
					:disabled="param.disabled"
					:placeholder="param.placeholder"
					full-width
					multi-line
					:rows="Math.min((body[param.name] || '').split('\n').length, 10)"
				>
					<mu-button
						v-if="param.append"
						slot="append"
						flat
						@click="param.append.click(body, param)"
						>{{ param.append.text }}</mu-button
					>
				</mu-text-field>
			</mu-form-item>
		</mu-form>
		<mu-button slot="actions" flat @click="close">取消</mu-button>
		<mu-button slot="actions" flat color="primary" :disabled="disabled" @click="onSubmit"
			>确定</mu-button
		>
		<mu-button
			style="position: absolute; top: 16px; right: 16px"
			color="blue"
			icon
			@click="fullscreen = !fullscreen"
		>
			<mu-icon :value="fullscreen ? 'fullscreen_exit' : 'fullscreen'"></mu-icon>
		</mu-button>
	</mu-dialog>
</template>
<script>
import {clearKeys, pick} from "@/common/utils";

export default {
	props: {
		params: {type: Array, required: true},
		open: {required: true},
		submit: {type: Function, required: true},
		title: {type: String},
		width: {default: 360},
	},
	data() {
		return {
			disabled: false,
			body: {},
			fullscreen: false,
		};
	},
	computed: {
		items() {
			return this.params.filter((x) => x.type);
		},
	},
	watch: {
		open() {
			if (this.open) this.body = Object.assign({}, this.open);
		},
	},
	methods: {
		close() {
			this.$emit("update:open", false);
		},
		async onSubmit() {
			let ok = await this.$refs.form.validate();
			if (!ok) return;
			let form = clearKeys({...this.body}, this.open);
			if (!Object.keys(form).length) return this.$toast.message("什么也没有做 -.-");
			let data;
			if (this.open.id) {
				form.id = this.open.id;
			}
			await this.submit(form);
			this.close();
		},
		async toURL(file, param) {
			let form = new FormData();
			form.append("f", file);
			if (param.type == "qr") {
				form.append("qr", 3);
			}
			let {url, data} = await this.$post("file/image", form);
			this.$set(this.body, param.name, url);
			if (data && param.qrname) {
				this.body[param.qrname] = data;
			}
			return url;
		},
		upload(param) {
			pick().then((file) => this.toURL(file, param));
		},
		paste(param, e) {
			if (e.clipboardData.items) {
				var items = e.clipboardData.items;
				for (var i = 0; i < items.length; ++i) {
					var item = items[i];
					if (item.kind == "file") {
						var file = item.getAsFile();
						if (file) {
							if (item.type.indexOf("image/") >= 0) {
								this.toURL(file, param);
							}
							e.preventDefault();
							return;
						}
					}
				}
			}
		},
	},
};
</script>
<style lang="less">
.i-form {
	> .mu-dialog {
		position: relative;
		display: flex;
		flex-direction: column;
		&.mu-dialog-fullscreen {
			position: absolute;
		}
		> .mu-dialog-body {
			max-height: unset !important;
			flex: 1;
		}
	}
}
</style>
