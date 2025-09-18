import { Suspense } from "react";
import { getQueryClient, trpc } from "@/trpc/server"; 
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";


const Page = () => {
  const queryClient = getQueryClient(); 
  void queryClient.prefetchQuery(trpc.hello.queryOptions({ text: "Ricardo" })); 
  const dehydratedState = dehydrate(queryClient);


  return (
  <HydrationBoundary state={dehydratedState}>
    <Suspense fallback={<div >Loading...</div>}>
      {/* <ClientComponent /> */}
    </Suspense>
  </HydrationBoundary>
  )
};

export default Page;


// Using prefetch query to fetch data from the server and then hydrate the client with the data is a good way to improve the performance of the client, because the client will have the data before the component is rendered, so the component will be rendered faster. This is especially useful for server components that are rendered on the server and then hydrated on the client. Best use of both worlds: Example: Server component fetches data from the server and then hydrates the client with the data, so the client will have the data before the component is rendered, so the component will be rendered faster. 

// A server component loads sooner than a client component.

// prefetchQuery, all it does is initiate a call on the server component but only for the sole purpose of populating tanstack query, which can be accessed by the client component.  

// Basically, i am leveraging a server component (this file) to start fetching data immediately and passing it down to the client component, which uses a familiar api to fetch data from the server.  