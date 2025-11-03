

/**
 * A tree item is a string or an array of strings.
 * If it is a string, it is a file path.
 * If it is an array, the first element is the directory path and the rest are the file paths in the directory.
 */
export type TreeItem = string | [string, ...TreeItem[]];