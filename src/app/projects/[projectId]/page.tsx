import { ProjectView } from "@/modules/projects/ui/views/project-view";
import { getQueryClient, trpc } from "@/trpc/server"; 
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface PageProps {
  params: Promise<{
    projectId: string;
  }>;
}


// Load messages for an individual project
// since this is a server component, we can leverage prefetching to load the messages for the project 

const Page = async ({ params }: PageProps) => {
  const { projectId } = await params;

  const queryClient = getQueryClient(); 

  // Prefetches all messages for the given project from the server and stores them in the TanStack Query cache so they're immediately available to client components without waiting for a network request.
  void queryClient.prefetchQuery(trpc.messages.getMany.queryOptions({ projectId }));

  void queryClient.prefetchQuery(trpc.projects.getOne.queryOptions({ id: projectId }));


  // dehydrate the query client so we can hydrate it on the client
  const dehydratedState = dehydrate(queryClient); 
  return (
    <HydrationBoundary state={dehydratedState}>
      <ErrorBoundary fallbackRender={() => <div>Error</div>}> 
        {/* Suspense is used to suspend the component until the data is loaded */}
        <Suspense fallback={<div>Loading...</div>}> 
          <ProjectView projectId={projectId} />
        </Suspense>
        </ErrorBoundary>
    </HydrationBoundary>
  );
};


export default Page;