import {diff, fromNow} from "@/backend/utils";
import {format} from "@/common/utils";

const filter = {
	fromNow: fromNow,
	diff: diff,
	format: (v) => format("YYYY-MM-DD HH:mm:ss", v),
};

export default filter;
