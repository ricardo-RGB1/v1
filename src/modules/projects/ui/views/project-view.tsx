"use client";

import { Suspense, useState } from "react";
import { MessagesContainer } from "../components/messages-container";
import { Fragment } from "@/generated/prisma";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ProjectHeader } from "../components/project-header";

interface ProjectViewProps {
  projectId: string;
}

export const ProjectView = ({ projectId }: ProjectViewProps) => {
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={30}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<p>Loading project...</p>}>
            <ProjectHeader projectId={projectId} /> 
          </Suspense>
          <Suspense fallback={<p>Loading messages...</p>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={70}
          minSize={50}
          className="flex flex-col min-h-0"
        >
          {/* TODO: PREVIEW */}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
