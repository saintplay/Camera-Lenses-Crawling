export const escapeForRegex = (text: string) => {
	return text.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}