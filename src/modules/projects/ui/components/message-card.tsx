import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { MessageRole, MessageType, Fragment } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ChevronRightIcon, Code2Icon } from "lucide-react";

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

interface UserMessageProps {
  content: string;
}

/**
 * UserMessage component displays a user's message in a chat interface.
 *
 * Renders the user's message content in a card positioned on the right side
 * of the chat container with appropriate styling and responsive layout.
 *
 * @param content - The text content of the user's message
 * @returns JSX element containing the styled user message card
 */
const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-10">
      <Card className="rounded-lg bg-[#3d3530] p-3 shadow-none border-none max-w-[80%] break-words">
        {content}
      </Card>
    </div>
  );
};

interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}

/**
 * FragmentCard component displays a clickable card for code fragments.
 *
 * Renders a button-style card that shows fragment information and allows users
 * to click to view the associated code preview. The card's appearance changes
 * based on whether it's currently the active fragment being displayed.
 *
 * @param fragment - The fragment object containing title and other metadata
 * @param isActiveFragment - Boolean indicating if this fragment is currently active/selected
 * @param onFragmentClick - Callback function triggered when the fragment card is clicked
 * @returns JSX element containing the interactive fragment card
 */
const FragmentCard = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: FragmentCardProps) => {
  return (
    <button
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary"
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2Icon className="size-4 mt-0.5" />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium line-clamp-1">
          {fragment.title}
        </span>
        <span className="text-sm">Preview</span>
      </div>
      <div className="flex items-center justify-center mt-0.5">
        <ChevronRightIcon className="size-4" />
      </div>
    </button>
  );
};

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

/**
 * AssistantMessage component displays messages from the AI assistant.
 *
 * Renders assistant messages with a distinctive layout including the Joy logo,
 * timestamp, message content, and optionally a fragment card for code previews.
 * The component handles different message types including error states with
 * appropriate styling.
 *
 * @param content - The text content of the assistant's message
 * @param fragment - Optional fragment object containing generated code
 * @param createdAt - Timestamp when the message was created
 * @param isActiveFragment - Boolean indicating if the fragment is currently active
 * @param onFragmentClick - Callback function for fragment card interactions
 * @param type - Message type (RESULT, ERROR, etc.) affecting styling and behavior
 * @returns JSX element containing the complete assistant message layout
 */
const AssistantMessage = ({
  content,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: AssistantMessageProps) => {
  return (
    <div
      className={cn(
        "flex flex-col group px-2 pb-4",
        type === "ERROR" && "text-red-700 dark:text-red-500"
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image
          src="/logo.svg"
          alt="joy"
          width={17}
          height={17}
          className="shrink-0"
        />
        <span className="text-sm font-medium">Joy</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>
      <div className="pl-8.5 flex flex-col gap-y-4">
        <span>{content}</span>
        {fragment && type === "RESULT" && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  );
};

/**
 * MessageCard component renders different types of chat messages.
 *
 * This is the main component that determines whether to render a user message
 * or an assistant message based on the message role. It serves as a router
 * component that delegates to the appropriate specialized message component.
 *
 * @param content - The text content of the message
 * @param role - The role of the message sender (USER or ASSISTANT)
 * @param fragment - Optional fragment object for code previews
 * @param createdAt - Timestamp when the message was created
 * @param isActiveFragment - Boolean indicating if the fragment is currently active
 * @param onFragmentClick - Callback function for fragment interactions
 * @param type - Message type affecting styling and behavior
 * @returns JSX element containing the appropriate message component
 */
export const MessageCard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: MessageCardProps) => {
  if (role === "ASSISTANT") {
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        createdAt={createdAt}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        type={type}
      />
    );
  }
  return <UserMessage content={content} />;
};
