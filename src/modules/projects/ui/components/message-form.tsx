import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Usage } from "./usage";
import { useRouter } from "next/navigation";

interface Props {
  projectId: string;
}

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message is required" })
    .max(10000, { message: "Prompt is too long" }),
});

type FormSchema = z.infer<typeof formSchema>;










/**
 * MessageForm Component
 * 
 * A form component for creating new messages in a project. Handles user input validation,
 * credit consumption tracking, and message submission with real-time feedback.
 * 
 * Features:
 * - Auto-resizing textarea for message input
 * - Form validation with Zod schema (1-10000 characters)
 * - Usage/credit tracking display
 * - Real-time submission state feedback
 * - Automatic redirect to pricing on credit exhaustion
 * - Query invalidation for real-time UI updates
 * 
 * Props:
 * - projectId: string - The ID of the project to create messages for
 * 
 * Dependencies:
 * - Uses tRPC for API calls (messages.create, usage.status)
 * - Integrates with react-hook-form for form management
 * - Uses TanStack Query for data fetching and caching
 * - Displays Usage component when user has consumed credits
 */

export const MessageForm = ({ projectId }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema), // validate the form data
    defaultValues: {
      value: "",
    },
  });

  // ********** Get usage status **********
  const { data: usage } = useQuery(trpc.usage.status.queryOptions());



  // ********** Create a new message **********
  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        // invalidate the messages query to get the new message
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
      },
      
      onError: (error) => {
        toast.error(error.message);

        if (error.data?.code === "TOO_MANY_REQUESTS") {
          router.push("/pricing"); 
        }
      },
    })
  );

  const onSubmit = async (values: FormSchema) => {
    await createMessage.mutateAsync({
      value: values.value,
      projectId,
    });
  };

  // Track mutation state and form validation for UI feedback
  const isPending = createMessage.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const [isFocused, setIsFocused] = useState(false);
  const showUsage = !!usage && usage.consumedPoints > 0;

  return (
    <Form {...form}>
      {/* Show usage if there are remaining credits */}
      {showUsage && (
        <Usage
          credits={usage.remainingPoints}
          msBeforeNext={usage.msBeforeNext}
        />
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs",
          showUsage && "rounded-t-none"
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <TextareaAutosize
              {...field}
              disabled={isPending}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              minRows={2}
              maxRows={8}
              className="pt-4 resize-none border-none w-full outline-none bg-transparent"
              placeholder="What would you like to build?"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }
              }}
            />
          )}
        />
        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp;to submit
          </div>
          <Button
            className={cn(
              "size-8 rounded-full",
              isButtonDisabled && "bg-muted-foreground border"
            )}
            disabled={isButtonDisabled}
          >
            {isPending ? (
              <Loader2Icon className="animate-spin size-4" />
            ) : (
              <ArrowUpIcon />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
