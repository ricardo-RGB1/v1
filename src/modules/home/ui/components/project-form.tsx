"use client";

import { useClerk } from "@clerk/nextjs";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PROJECT_TEMPLATES } from "@/modules/home/constants";

import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "Message is required" })
    .max(10000, { message: "Prompt is too long" }),
});

type FormSchema = z.infer<typeof formSchema>;




/**
 * ProjectForm Component
 * 
 * A comprehensive form component for creating new projects from the home page.
 * Handles user input validation, project creation, and provides template suggestions
 * for common project types.
 * 
 * Features:
 * - Auto-resizing textarea for project description input
 * - Form validation with Zod schema (1-10000 characters)
 * - Template buttons for quick project initialization
 * - Real-time submission state feedback with loading indicators
 * - Automatic navigation to created project
 * - Error handling with appropriate user feedback and redirects
 * - Authentication integration with Clerk
 * - Query invalidation for real-time UI updates
 * 
 * User Flow:
 * 1. User enters project description or selects from templates
 * 2. Form validates input and enables/disables submit button
 * 3. On submission, creates project via tRPC mutation
 * 4. On success, invalidates relevant queries and redirects to new project
 * 5. On error, shows appropriate feedback (auth prompt, pricing redirect, etc.)
 * 
 * Template Integration:
 * - Displays predefined project templates from PROJECT_TEMPLATES constant
 * - Templates include emoji, title, and pre-written prompts
 * - Clicking template auto-fills the textarea with the template's prompt
 * - Templates are hidden on mobile devices for better UX
 * 
 * Error Handling:
 * - UNAUTHORIZED: Opens Clerk sign-in modal
 * - TOO_MANY_REQUESTS: Redirects to pricing page for upgrade
 * - General errors: Shows toast notification with error message
 * 
 * Dependencies:
 * - Uses tRPC for API calls (projects.create)
 * - Integrates with react-hook-form for form management
 * - Uses TanStack Query for data fetching and caching
 * - Clerk for authentication state management
 * - Next.js router for navigation
 */
export const ProjectForm = () => {
  const clerk = useClerk();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  // Form setup with Zod validation schema
  // Validates message length between 1-10000 characters
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema), // validate the form data
    defaultValues: {
      value: "",
    },
  });

  // ********** Create a new project, invalidate usage status, and redirect to project **********
  // Mutation for creating new projects with comprehensive error handling
  // and automatic query invalidation for real-time UI updates
  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        // invalidate the projects query to get the new project
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        // invalidate the usage status query to get the new usage status
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
        // Navigate to the newly created project
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message); 
        // Handle authentication errors by opening sign-in modal
        if(error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
        // Handle rate limiting by redirecting to pricing page
        if(error.data?.code === "TOO_MANY_REQUESTS") {
          router.push("/pricing");
        }
      },
    })
  );

  /**
   * Form submission handler
   * Triggers the project creation mutation with form values
   * 
   * @param values - Validated form data containing the project description
   */
  const onSubmit = async (values: FormSchema) => {
    await createProject.mutateAsync({
      value: values.value,
    });
  };

  // Track mutation state and form validation for UI feedback
  const isPending = createProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const [isFocused, setIsFocused] = useState(false);

  /**
   * Template selection handler
   * Auto-fills the form textarea with the selected template's prompt
   * Triggers form validation and marks field as dirty/touched
   * 
   * @param value - The template prompt text to populate in the form
   */
  const onSelect = (value: string) => {
    form.setValue("value", value, {
      shouldDirty: true,
      shouldValidate: true,
      shouldTouch: true,
    });
  };

  return (
    <Form {...form}>
      <section className="space-y-6">
        {/* Main form container with dynamic styling based on focus state */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
            isFocused && "shadow-xs"
          )}
        >
          {/* Auto-resizing textarea field for project description input */}
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
                  // Submit form on Enter key (without Shift modifier)
                  // Shift+Enter allows for new lines in the textarea
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
              />
            )}
          />
          
          {/* Form footer with keyboard shortcut hint and submit button */}
          <div className="flex gap-x-2 items-end justify-between pt-2">
            {/* Keyboard shortcut indicator */}
            <div className="text-[10px] text-muted-foreground font-mono">
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Enter
              </kbd>
              &nbsp;to submit
            </div>
            
            {/* Submit button with loading state and dynamic styling */}
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
        
        {/* Template selection buttons - hidden on mobile for better UX */}
        <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl">
          {PROJECT_TEMPLATES.map((template) => (
            <Button
              key={template.title}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-sidebar cursor-pointer hover:border-orange-400 hover:shadow-[0_0_10px_rgba(251,146,60,0.5)] transition-all duration-300"
              onClick={() => onSelect(template.prompt)}
            >
              {template.emoji} {template.title}
            </Button>
          ))}
        </div>
      </section>
    </Form>
  );
};
