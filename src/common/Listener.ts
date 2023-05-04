type ExtractOn<S> = S extends object
	? {
			[K in keyof S as ExtractOn<K>]: S[K];
	  }
	: S extends `on${infer U}`
	? U
	: never;

type FirstParam<T> = T extends (...args: any[]) => any ? Parameters<T>[0] : any;
type EventType<T> = {
	[K in keyof T as Exclude<ExtractOn<K>, "" | "ce">]-?: FirstParam<T[K]>;
};

export default class Listener<T, D = EventType<T>> {
	map: Map<string | number | symbol, ((data: any) => void)[]>;

	constructor() {
		this.map = new Map();
	}

	on(event: keyof D, callback: (data: D[keyof D]) => void) {
		let list = this.map.get(event);
		if (!list) {
			list = [];
			this.map.set(event, list);
		}
		list.push(callback);
	}

	once(event: keyof D, callback: (data: D[keyof D]) => void) {
		this.on(event, callback);
		this.on(event, () => this.off(event, callback));
	}

	off(event: keyof D, callback: (data: D[keyof D]) => void) {
		let list = this.map.get(event);
		if (list) {
			let idx = list.indexOf(callback);
			if (idx >= 0) {
				list.splice(idx, 1);
			}
		}
	}

	offAll() {
		this.map.clear();
	}

	emit(event: keyof D, data: D[keyof D]) {
		let list = this.map.get(event);
		if (list) {
			list.forEach((callback) => {
				try {
					callback(data);
				} catch (error) {
					console.error(error);
				}
			});
		}
		const key = "on" + (event as string);
		if (key in this) {
			(this as any)[key](data);
		}
	}

	clear() {
		this.map.clear();
	}

	addEventListener(event: keyof D, callback: (data: D[keyof D]) => void) {
		this.on(event, callback);
	}

	removeEventListener(event: keyof D, callback: (data: D[keyof D]) => void) {
		this.off(event, callback);
	}

	dispatchEvent(event: CustomEvent) {
		this.emit(event.type as keyof D, event.detail);
	}
}
