import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { useEffect, useRef } from "react";
import { Fragment } from "@/generated/prisma";
import { MessageLoading } from "./message-loading";

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void; // set the active fragment to the fragment passed in
}

export const MessagesContainer = ({
  projectId,
  activeFragment,
  setActiveFragment,
}: Props) => {
  const trpc = useTRPC();
  const bottomRef = useRef<HTMLDivElement>(null);
  // ********** Fetch all messages for this project **********
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({ projectId },
    {
        // TODO: TEMPORARY REFRESH INTERVAL FOR TESTING
        refetchInterval: 5000,
    }
  )); 

  // THIS IS CAUSING ISSUES WHEN SCROLLING DOWN AND UP 
//   useEffect(() => {
//     const lastAssistantMessage = messages.findLast(
//       (message) => message.role === "ASSISTANT" && !!message.fragment
//     );

//     if (lastAssistantMessage) {
//       setActiveFragment(lastAssistantMessage.fragment);
//     }
//   }, [messages, setActiveFragment]);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages.length]);


const lastMessage = messages[messages.length - 1]; // get the last message  
const isLastMessageUser = lastMessage?.role === "USER"; 

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-2 pr-1">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragment}
              createdAt={message.createdAt}
              isActiveFragment={activeFragment?.id === message.fragment?.id} // check if the active fragment is the same as the message's fragment
              onFragmentClick={() => setActiveFragment(message.fragment)}
              type={message.type}
            />
          ))}
          {isLastMessageUser && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};
