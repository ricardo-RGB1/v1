import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TreeItem } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Convert a record of files to a tree structure. 
 * @param files - Record of file paths to content
 * @returns Tree structure for TreeView component  
 * 
 * @example
 * Input: {"src/Button.tsx": "...", "src/Input.tsx": "...", "src/Textarea.tsx": "..."}
 * Output: [["src", "Button.tsx"], ["src", "Input.tsx"], ["src", "Textarea.tsx"]]
 *  */ 
export function convertFilesToTreeItems(files: { [path:string]: string},) : TreeItem[] {
  /**
   * TreeNode represents a node in our intermediate tree structure.
   * - Keys are directory or file names
   * - Values are either:
   *   - Another TreeNode object (for directories)
   *   - null (for files - leaf nodes)
   */
  interface TreeNode {
    [key: string]: TreeNode | null; 
  };

  // Root of our intermediate tree structure
  const tree: TreeNode = {};

  // Sort file paths alphabetically to ensure consistent tree structure
  // This helps with predictable ordering in the final TreeItem array
  const sortedPaths = Object.keys(files).sort(); 

  // PHASE 1: Build intermediate tree structure from file paths
  // We iterate through each file path and create nested TreeNode objects
  for (const filePath of sortedPaths) {
    // Split the file path into individual parts (directories and filename)
    // Example: "src/components/Button.tsx" becomes ["src", "components", "Button.tsx"]
    const parts = filePath.split("/"); 
    
    // Start at the root of our tree
    let current = tree; 

    // Navigate/create the directory structure for this file path
    // Loop through all parts EXCEPT the last one (which is the filename)
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      // If this directory doesn't exist in current level, create it
      if (!current[part]) {
        current[part] = {}; 
      }
      
      // Move deeper into the tree structure
      current = current[part] as TreeNode; 
    }

    // Mark the final part (filename) as a file by setting it to null
    // This distinguishes files from directories in our tree structure
    const fileName = parts[parts.length - 1];   
    current[fileName] = null; 
  }

  /**
   * PHASE 2: Convert our intermediate TreeNode structure to TreeItem format
   * 
   * This recursive function transforms our nested TreeNode objects into the TreeItem format:
   * - Files become simple strings
   * - Directories become arrays where first element is directory name, 
   *   followed by all children (files and subdirectories)
   * 
   * @param node - The TreeNode to convert
   * @param name - Optional name for this node (used when it's a directory)
   * @returns Either a TreeItem array (for directories) or a single TreeItem (for files)
   */
  function convertNode(node: TreeNode, name?: string): TreeItem[] | TreeItem {
    // Get all entries (key-value pairs) from this node
    const entries = Object.entries(node);  

    // Base case: if no entries, this is a file (leaf node)
    // Return the name or empty string
    if (entries.length === 0) {
      return name || "";  
    }

    // This node has children, so it's a directory
    // Initialize array to collect all children (files and subdirectories)
    const children: TreeItem[] = [];

    // Process each child entry
    for (const [key, value] of entries) {
      if (value === null) { 
        // This entry represents a file (value is null)
        // Add the filename directly to children array
        children.push(key); 
      } else {
        // This entry represents a directory (value is another TreeNode)
        // Recursively convert the subdirectory
        const subTree = convertNode(value, key); 
        
        // Handle the recursive result:
        if (Array.isArray(subTree)) {
          // subTree is already an array of children, so create directory structure
          // Format: [directoryName, ...children]
          children.push([key, ...subTree]); 
        } else {
          // subTree is a single item, wrap it in directory structure
          children.push([key, subTree]); 
        }
      }
    }

    // Return all children for this directory level
    return children; 
  }

  // Convert the entire tree starting from root
  const result = convertNode(tree); 
  
  // Ensure we always return an array of TreeItems
  // If result is a single TreeItem, wrap it in an array
  return Array.isArray(result) ? result : [result];  
}; 
/*
  Plain English Documentation for convertFilesToTreeItems:

  - Purpose: 
    The convertFilesToTreeItems function takes a "FileCollection", which is an object mapping file paths (as strings) to file contents (as strings), and transforms it into a nested structure of TreeItems. 
    This structure represents the file hierarchy with nested arrays for directories and string values for files.

  - How it works:
    1. It first builds a "tree" object, a nested structure where keys are directory or file names and values are either:
        - another tree (object) for directories, or
        - null for files.
       It does this by splitting each file path on "/", and building/interleaving the tree as needed until reaching the file name, which gets a value of null.

    2. It defines a recursive helper function "convertNode":
        - If the node has no entries, it is a file (leaf node), so it returns its name.
        - If the node has entries, it is a directory:
            - For each entry (child):
                - If the value is null (i.e., a file), it adds the file directly to the children array.
                - If the value is another tree/object (i.e., a directory), recursively process it and format the data as [directoryName, ...children] (nested arrays).
        - After all children are processed, returns the children for that level (as an array, or a single item wrapped as an array at the root).

    3. It calls convertNode on the root of the tree and ensures that the final result is always an array of TreeItems.

  - Example:
    If given:
    {
      "src/index.ts": "...",
      "src/lib/utils.ts": "...",
      "README.md": "..."
    }
    It would produce:
    [
      ["src", "index.ts", ["lib", "utils.ts"]],
      "README.md"
    ]

  - Output:
    The result returned is always an array suitable for rendering as a tree view of the files and directories.
*/

