import utils from "../common/utils";

const filter = {
	fromNow: utils.fromNow,
	diff: utils.diff,
	format: utils.format,
	date(value) {
		return utils.format(value, "YYYY-MM-DD");
	},
	time(value) {
		return utils.format(value, "HH:mm:ss");
	},
};

export default filter;
