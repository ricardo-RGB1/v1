import { TreeItem } from "@/types";
import { ChevronRightIcon, FileIcon, FolderIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TreeViewProps {
  data: TreeItem[];
  value?: string | null;
  onSelect?: (value: string) => void;
}

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    selectedValue={value}
                    onSelect={onSelect}
                    parentPath=""
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail /> 
      </Sidebar>
    </SidebarProvider>
  );
};

interface TreeProps {
  item: TreeItem;
  selectedValue?: string | null;
  onSelect?: (value: string) => void;
  parentPath: string;
}

/**
 * Tree component that renders a single tree item (file or directory) recursively.
 * Handles both files and directories with collapsible functionality for directories.
 *
 * @param item - The tree item to render, can be a string (file) or array (directory with children)
 * @param selectedValue - The currently selected file path
 * @param onSelect - Callback function called when a file is selected
 * @param parentPath - The parent directory path used to construct the full file path
 */
const Tree = ({ item, selectedValue, onSelect, parentPath }: TreeProps) => {
  // Destructure the item: first element is the name, rest are children (if directory)
  const [name, ...items] = Array.isArray(item) ? item : [item]; // [directoryName, ...children]

  // Construct the full path by combining parent path with current name
  const currentPath = parentPath ? `${parentPath}/${name}` : name; // directoryName/.../filename

  // Render as a file if there are no child items
  if (!items.length) {
    const isSelected = selectedValue === currentPath; // check if the current file is selected
    return (
      <SidebarMenuButton
        isActive={isSelected}
        onClick={() => onSelect?.(currentPath)}
        className="data-[active=true]:bg-transparent"
      >
        <FileIcon />
        <span className="truncate">{name}</span>
      </SidebarMenuButton>
    );
  }

  // Render as a collapsible directory if there are child items
  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRightIcon className="transition-transform duration-200" />
            <FolderIcon />
            <span className="truncate">{name}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {/* Recursively render each child item */}
            {items.map((subItem, index) => (
              <Tree
                key={index}
                item={subItem}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
