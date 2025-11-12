import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "@/components/code-view";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./tree-view";

/**
 * Extracts the file extension from a filename to determine the language for syntax highlighting
 * @param filename - The name of the file including its extension
 * @returns The language code (e.g. "js", "ts", "jsx", "tsx", "css", "html", "json", "md") or "text" if no extension is found
 */
function getLanguageFromExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension || "text";
}

// map the files to the path
type FileCollection = { [path: string]: string }; // { "src/index.ts": "..." }

interface FileBreadcrumbProps {
  filePath: string;
}








/**
 * FileBreadcrumb component renders a breadcrumb navigation for file paths.
 * 
 * This component takes a file path and displays it as a breadcrumb navigation,
 * automatically truncating long paths to keep the UI clean and readable.
 * 
 * @param filePath - The full file path to display (e.g., "src/components/Button.tsx")
 * 
 * Behavior:
 * - For paths with 4 or fewer segments: displays all segments with separators
 * - For paths with more than 4 segments: shows first segment + ellipsis + last segment
 * - The final segment (filename) is highlighted as the current page
 * - Intermediate segments are styled with muted text color
 * 
 * @example
 * Short path: "src/components/Button.tsx" → src / components / Button.tsx
 * Long path: "src/components/ui/forms/inputs/TextInput.tsx" → src / ... / TextInput.tsx
 */
const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
  const pathSegments = filePath.split("/"); // ["src", "components", "Button.tsx"]
  const maxSegments = 4;

  const renderBreadcrumbItems = () => {
    if (pathSegments.length <= maxSegments) {
      // Display all segments when path is short enough
      return pathSegments.map((segment, index) => {
        // Check if this is the final segment in the path
        const isLast = index === pathSegments.length - 1;

        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isLast ? (
                // Final segment is styled as the current page
                <BreadcrumbPage className="font-medium">
                  {segment}
                </BreadcrumbPage>
              ) : (
                // Intermediate segments are styled as muted links
                <span className="text-muted-foreground">{segment}</span>
              )}
            </BreadcrumbItem>
            {/* Add separator after each segment except the last */}
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      // For long paths, show only first and last segments with ellipsis
      const firstSegment = pathSegments[0];
      const lastSegment = pathSegments[pathSegments.length - 1];

      return (
        <>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstSegment}</span>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">
              {lastSegment}
            </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbItem>
        </>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {renderBreadcrumbItems()}
      </BreadcrumbList>
    </Breadcrumb>
  );
};







interface FileExplorerProps {
  files: FileCollection;
}




/**
 * FileExplorer component provides a two-panel interface for browsing and viewing files.
 * 
 * Features:
 * - Left panel: Tree view of files and folders with hierarchical navigation
 * - Right panel: Code viewer with syntax highlighting for the selected file
 * - Breadcrumb navigation showing the current file path
 * - Copy to clipboard functionality for file contents
 * - Resizable panels for customizable layout
 * 
 * @param files - Object mapping file paths to their content (e.g., { "src/index.ts": "console.log('hello')" })
 * 
 * @example
 * ```tsx
 * const files = {
 *   "src/index.ts": "console.log('Hello World');",
 *   "src/components/Button.tsx": "export const Button = () => <button>Click me</button>;"
 * };
 * 
 * <FileExplorer files={files} />
 * ```
 */
export const FileExplorer = ({ files }: FileExplorerProps) => {
  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const treeData = useMemo(() => {
    return convertFilesToTreeItems(files);
  }, [files]);

  const handleFileSelect = useCallback(
    (filepath: string) => {
      if (files[filepath]) {
        setSelectedFile(filepath);
      }
    },
    [files]
  );

  const handleCopy = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [selectedFile, files]);

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
        <TreeView
          data={treeData}
          value={selectedFile}
          onSelect={handleFileSelect}
        />
      </ResizablePanel>
      <ResizableHandle className="hover:bg-primary transition-colors" />
      <ResizablePanel defaultSize={70} minSize={50}>
        {/* Code view for the selected file */}
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
              {/* Breadcrumb navigation for the selected file */}
              <FileBreadcrumb filePath={selectedFile} />
              <Hint text="Copy to clipboard" side="bottom">
                <Button
                  variant="outline"
                  size="icon"
                  className="ml-auto"
                  onClick={handleCopy}
                  disabled={copied} // disable the button if the code has been copied 
                >
                  {copied ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                </Button>
              </Hint>
            </div>
            {/* Code view for the selected file */}
            <div className="flex-1 overflow-auto">
              <CodeView
                code={files[selectedFile]}
                lang={getLanguageFromExtension(selectedFile)}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a file to view it&apos;s contents
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
