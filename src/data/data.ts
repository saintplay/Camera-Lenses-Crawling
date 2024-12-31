import { sortBy } from "lodash";

export interface AllowListItem<T extends string = string> {
	name: T,
	aliases?: string[],
}

export type AllowList<T extends string = string> = AllowListItem<T>[];

/** Priority index works like z-index */
export function keyedListToSortedAllowlist<T extends string = string, I extends { priorityIndex?: number } = {}> (keyedList: { [key: string]: I}) {
	const sortedEntries = sortBy(
		Object.entries(keyedList),
		[
			([_, meta]) => typeof meta.priorityIndex === 'undefined',
			([, meta]) => meta.priorityIndex,
		]
	) as [T, I][];

	return sortedEntries.map(([key, data]): AllowListItem<T> => ({
		name: key,
		...data,
	}))
}

