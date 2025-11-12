"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { MessagesContainer } from "../components/messages-container";
import { Fragment } from "@/generated/prisma";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, CodeIcon, CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import { FileExplorer } from "@/components/file-explorer";
import { useAuth } from "@clerk/nextjs";
import { ErrorBoundary } from "react-error-boundary";

interface ProjectViewProps {
  projectId: string;
}






/**
 * Main project view component that displays a project's chat interface and fragment preview/code
 * 
 * Features:
 * - Split-pane layout with resizable panels
 * - Left panel: Project header and messages/chat interface
 * - Right panel: Tabbed interface for fragment preview and code exploration
 * - Fragment selection and display functionality
 * - User controls and upgrade prompts
 * 
 * @param projectId - The unique identifier of the project to display
 */
export const ProjectView = ({ projectId }: ProjectViewProps) => {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" });
  // Active fragment that is currently selected for preview/editing
  // When null, no fragment is selected and panels show empty states
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);

  // Controls which tab is currently active in the right panel
  // "preview" shows the fragment's rendered output in an iframe
  // "code" shows the fragment's file structure and source code
  const [tabState, setTabState] = useState<"preview" | "code">("preview");

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel: Project navigation and chat interface */}
        <ResizablePanel
          defaultSize={30}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          {/* Project header with navigation and theme controls */}
          <ErrorBoundary fallback={<div>Error loading project</div>}>
            <Suspense fallback={<p>Loading project...</p>}>
              <ProjectHeader projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
          
          {/* Messages container with chat interface and fragment selection */}
          <ErrorBoundary fallback={<div>Error loading messages</div>}>
            <Suspense fallback={<p>Loading messages...</p>}>
              <MessagesContainer
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right Panel: Fragment preview and code exploration */}
        <ResizablePanel
          defaultSize={70}
          minSize={50}
          className="flex flex-col min-h-0"
        >
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value) => setTabState(value as "preview" | "code")}
          >
            {/* Tab header with controls and user actions */}
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              {/* Tab switcher between preview and code views */}
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon /> <span>Preview</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon /> <span>Code</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Right-aligned controls: upgrade button and user menu */}
              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button asChild size="sm" variant="tertiary">
                    <Link href="/pricing">
                      <CrownIcon /> <span>Upgrade</span>
                    </Link>
                  </Button>
                )}
                <UserControl /> 
              </div>
            </div>
            
            {/* Preview tab: Shows fragment rendered in sandboxed iframe */}
            <TabsContent value="preview">
              {!!activeFragment && <FragmentWeb data={activeFragment} />} 
            </TabsContent>
            
            {/* Code tab: Shows fragment's file structure and source code */}
            <TabsContent value="code" className="min-h-0">
              {!!activeFragment?.files && (
                <FileExplorer
                  files={activeFragment.files as { [path: string]: string }}
                />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
