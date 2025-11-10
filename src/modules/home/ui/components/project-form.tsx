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

export const ProjectForm = () => {
  const clerk = useClerk();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema), // validate the form data
    defaultValues: {
      value: "",
    },
  });

  // ********** Create a new project, invalidate usage status, and redirect to project **********
  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        // invalidate the projects query to get the new project
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        // invalidate the usage status query to get the new usage status
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message); 
        if(error.data?.code === "UNAUTHORIZED") {
          clerk.openSignIn();
        }
        if(error.data?.code === "TOO_MANY_REQUESTS") {
          router.push("/pricing");
        }
      },
    })
  );

  const onSubmit = async (values: FormSchema) => {
    await createProject.mutateAsync({
      value: values.value,
    });
  };

  // Track mutation state and form validation for UI feedback
  const isPending = createProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const [isFocused, setIsFocused] = useState(false);

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
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
            isFocused && "shadow-xs"
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
                  if (e.key === "Enter" && !e.shiftKey) {
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
                Enter
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
