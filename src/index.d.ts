import type { Entries } from 'type-fest'

declare global {
	interface ObjectConstructor {
		entries<T extends object>(o: T): Entries<T>;
		fromEntries<T extends readonly (readonly [string, unknown])[]>(o: T): {[K in T[number][0]]: Extract<T[number], [K, unknown]>[1]};
	}
}
