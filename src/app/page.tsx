"use client";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";

const Page = () => {
  const trpc = useTRPC();
  // useMutation is a hook that allows you to mutate data on the server - here it is used to invoke the invokeInngest procedure 
  const invokeInngest = useMutation(trpc.invokeInngest.mutationOptions({})); 

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Button
        onClick={() => 
          invokeInngest.mutate({ text: "background job triggered" })
        }
      >
        Invoke background jobs
      </Button>
    </div>
  );
};

export default Page;

// NOTES FOR tRPC:
// Using prefetch query to fetch data from the server and then hydrate the client with the data is a good way to improve the performance of the client, because the client will have the data before the component is rendered, so the component will be rendered faster. This is especially useful for server components that are rendered on the server and then hydrated on the client. Best use of both worlds: Example: Server component fetches data from the server and then hydrates the client with the data, so the client will have the data before the component is rendered, so the component will be rendered faster.

// A server component loads sooner than a client component.

// prefetchQuery, all it does is initiate a call on the server component but only for the sole purpose of populating tanstack query, which can be accessed by the client component.

// Basically, i am leveraging a server component (this file) to start fetching data immediately and passing it down to the client component, which uses a familiar api to fetch data from the server.
