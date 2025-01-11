import { sortBy } from "lodash";
import { escapeForRegex } from "../crawling/utils";

export interface AllowListItem<T extends string = string> {
	name: T,
	aliases?: string[],
}

export type AllowList<T extends string = string> = AllowListItem<T>[];

/** Priority index works like z-index */
export function keyedListToSortedAllowlist<T extends string = string, I extends { priorityIndex?: number } = {}>(keyedList: { [key: string]: I }) {
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

export type MatchingStyle = 'anywhere' | 'word-constrained' | 'exact'

export function getAllowlistItem<T extends string = string>(allowlist: AllowList<T>, value: string, matchStyle: MatchingStyle = 'anywhere') {
	const flattenAllowList = allowlist.map(i => [
		i.name,
		...(i.aliases ? i.aliases : [])
	])

	for (const index in flattenAllowList) {
		const allowNameAndAliases = flattenAllowList[index];

		if (matchStyle === 'anywhere') {
			if (allowNameAndAliases.find(txt => new RegExp(`${escapeForRegex(txt)}`, 'gmi').test(value))) {
				return allowlist[index];
			}
		}
		else if (matchStyle === 'word-constrained') {
			if (allowNameAndAliases.find(txt => new RegExp(`\\b${escapeForRegex(txt)}\\b`, 'gmi').test(value))) {
				return allowlist[index];
			}
		}
		else if (matchStyle === 'exact') {
			if (allowNameAndAliases.find(txt => new RegExp(`^${escapeForRegex(txt)}$`, 'gmi').test(value))) {
				return allowlist[index];
			}
		}
	}

	return null;
}

export function isInAllowlist<T extends string = string>(allowlist: AllowList<T>, value: string, matchStyle: MatchingStyle = 'anywhere') {
	return Boolean(getAllowlistItem(allowlist, value, matchStyle))
}
