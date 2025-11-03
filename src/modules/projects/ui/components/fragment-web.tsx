import { useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshCcwIcon,
} from "lucide-react";

import { Fragment } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";

interface Props {
  data: Fragment;
}

// why is this a function and not a component?
// because it is a web component that is used to display the fragment in a web browser (not a react component)
/**
 * FragmentWeb Component
 * 
 * A React component that renders a web fragment in an embedded iframe with controls.
 * This component provides functionality to display, refresh, copy, and open fragments
 * in a sandboxed environment.
 * 
 * @param data - Fragment object containing the sandboxUrl and other fragment data
 * @returns JSX element containing the fragment viewer with control buttons
 * 
 * Features:
 * - Iframe rendering with sandbox restrictions for security
 * - Refresh functionality to reload the fragment
 * - Copy URL to clipboard with visual feedback
 * - Open fragment in new tab
 * - Responsive layout with header controls and full-height iframe
 */
export function FragmentWeb({ data }: Props) {
  // used to force a re-render of the iframe when the fragment changes
  const [fragmentKey, setFragmentKey] = useState(0);
  const [copied, setCopied] = useState(false);

  /**
   * Forces a re-render of the iframe by updating the key prop
   * This is useful when the fragment content needs to be refreshed
   */
  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  /**
   * Copies the fragment's sandbox URL to the clipboard
   * Shows visual feedback for 2 seconds after copying
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); //
  };

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header with control buttons */}
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" side="bottom" align="center">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon className="size-4" />
          </Button>
        </Hint>
        <Hint text="Copy to clipboard" side="bottom" align="center">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={!data.sandboxUrl || copied}
            className="flex-1 justify-start text-start font-normal"
          >
            {copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
            <span className="truncate">{data.sandboxUrl}</span>
          </Button>
        </Hint>
        <Hint text="Open in new tab" side="bottom" align="center">
          <Button
            size="sm"
            disabled={!data.sandboxUrl}
            variant="outline"
            onClick={() => {
              if (!data.sandboxUrl) return;
              window.open(data.sandboxUrl, "_blank");
            }}
          >
            <ExternalLinkIcon />
          </Button>
        </Hint>
      </div>
      {/* Sandboxed iframe for displaying the fragment */}
      <iframe
        key={fragmentKey}
        className="h-full w-full"
        sandbox="allow-forms allow-scripts allow-same-origin"
        loading="lazy"
        src={data.sandboxUrl}
      />
      
    </div>
  );
}
