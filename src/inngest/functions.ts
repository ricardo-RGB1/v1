import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" }, // <-- Configuration: id is a unique identifier for the function in the Inngest dashboard
  { event: "test/hello.world" }, // <-- Trigger: the event that will trigger the function
  async ({ event, step }) => {
    // <-- Handler: the function that will be executed when the event is triggered
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);
