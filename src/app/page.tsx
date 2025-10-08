"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const [value, setValue] = useState("");
  const trpc = useTRPC();
  const {data: messages} = useQuery(trpc.messages.getMany.queryOptions()); 
  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        toast.success("Message created");
      },
    })
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        disabled={createMessage.isPending}
        onClick={() => createMessage.mutate({ value: value })}
      >
        Invoke background jobs
      </Button>
      {JSON.stringify(messages, null, 2)}
    </div>
  );
};

export default Page;



// tRPC NOTES:
// 1. useMutation - hook for server mutations (e.g., createMessage procedure)
// 2. prefetchQuery - server components fetch data early to populate TanStack Query cache
// 3. Server components load faster than client components
// 4. Pattern: Server component prefetches → Client component uses cached data
