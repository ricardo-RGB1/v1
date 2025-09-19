import { openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
    // Create a new agent with a system prompt (you can add optional tools, too)
    const summarizer = createAgent({
      name: "summarizer",
      system:
        "You are an expert summarizer.  You summarize the content of the text.",
      model: openai({ model: "gpt-4o" }),
    });

    // Run the agent
    const { output } = await summarizer.run( 
      `Summarize the following text: ${event.data.value}.`
    );

    return { message: output };
  }
);
