import { Sandbox } from "@e2b/code-interpreter"; 

import { openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox } from "./utils";






export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },  
  async ({ event, step  }) => {

    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v1-nextjs-test-3");
      return sandbox.sandboxId; 
    }); 

    const codeAgent = createAgent({ 
      name: "summarizer",
      system:
        "You are an expert summarizer. You summarize the content of the text.",
      model: openai({ model: "gpt-4o" }),
    });

    // Run the agent
    const { output } = await codeAgent.run( 
      `Summarize the following text: ${event.data.value}.`
    );


    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId); 
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    })


    return { output, sandboxUrl };
  }
);
 


/** EXAMPLE DOCUMENTATION FOR AN INNGEST FUNCTION
 * Hello World Function
 * 
 * Purpose: Demonstrates basic Inngest function setup with AI agent integration
 * 
 * This function creates a text summarization service that:
 * - Listens for "test/hello.world" events
 * - Uses OpenAI's GPT-4o model via the agent-kit to create a summarizer agent
 * - Takes input text from the event data and generates a concise summary
 * - Returns the summarized content as output
 * 
 * Event Structure Expected:
 * {
 *   data: {
 *     value: string // The text content to be summarized
 *   }
 * }
 * 
 * @param event - The incoming event containing text to summarize
 * @returns Promise<{message: string}> - The summarized text output
 */