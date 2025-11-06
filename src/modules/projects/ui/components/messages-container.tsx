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
  const lastAssistantMessageRef = useRef<string | null>(null); 
  // ********** Fetch all messages for this project **********
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({ projectId },
    {
        // TODO: TEMPORARY REFRESH INTERVAL FOR TESTING
        refetchInterval: 5000,
    }
  )); 


  
  /**
   * Auto-select the most recent assistant message's fragment
   * 
   * This effect automatically updates the active fragment to display the code/preview
   * from the most recently generated assistant message. This ensures that when new
   * assistant responses are received (containing generated code fragments), the UI
   * automatically switches to show the latest generated content.
   * 
   * The effect:
   * 1. Finds the last message with role "ASSISTANT" from the messages array
   * 2. Checks if this message has an associated fragment (generated code)
   * 3. Compares the fragment ID with the previously tracked assistant message
   * 4. If different, updates the active fragment and tracks the new fragment ID
   * 
   * This prevents unnecessary re-renders when the same fragment is already active
   * and ensures users always see the most recent generated code automatically.
   */
  useEffect(() => {
    // Find the last ASSISTANT message
    const lastAssistantMessage = messages
      .findLast(message => message.role === "ASSISTANT");
      // if the last assistant message is different from the current active fragment, set the active fragment to the last assistant message's fragment
      if(lastAssistantMessage?.fragment && lastAssistantMessage.fragment.id !== lastAssistantMessageRef.current) {
        setActiveFragment(lastAssistantMessage.fragment);
        lastAssistantMessageRef.current = lastAssistantMessage.fragment.id;
      } 
  }, [messages, setActiveFragment])





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
