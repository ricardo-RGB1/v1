import { Sandbox } from "@e2b/code-interpreter";

import {
  openai,
  createAgent,
  createTool,
  createNetwork,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox, lastAgentResponse } from "./utils";
import { z } from "zod";
import { PROMPT } from "@/prompt";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },

  async ({ event, step }) => {
    // this is the main function that will be called when the event is received
    // create a new sandbox and return the id
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v1-nextjs-test-3");
      return sandbox.sandboxId;
    });

    /**
     * Code Agent Configuration:
     *
     * Creates an AI agent (an Agent instance) that operates within a sandboxed Next.js environment.
     * The agent is configured with tools for terminal operations, file management,
     * and has a lifecycle hook to capture task summaries from responses.
     */
    const codeAgent = createAgent({
      name: "code-agent",
      description:
        "An expert software engineer working in a sandboxed Next.js environment",
      system: PROMPT,
      model: openai({
        model: "gpt-4.1",
        defaultParameters: {
          temperature: 0.1, // means the model will be more deterministic: lower temperature means more deterministic output, higher temperature means more random output
        },
      }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            // parameters are used to validate the input of the tool
            command: z.string(), // command is the command to run in the sandbox
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" }; // buffers are used to store the output of the command: stdout and stderr mean standard output and standard error respectively
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  // run the command in the sandbox
                  onStdout: (data: string) => {
                    // onStdout is a callback function that is called when the command outputs data to the standard output
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    // callback function called when the command outputs data to the standard error
                    buffers.stderr += data;
                  },
                });
                return result.stdout; // return the standard output of the command
              } catch (error) {
                console.error(
                  `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`
                );
                return `Command failed: ${error} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              })
            ),
          }),
          handler: async ({ files }, { step, network }) => {
            const newFiles = await step?.run(
              "createOrUpdateFiles",
              async () => {
                try {
                  const updatedFiles = network.state.data.files || {}; // get the files from the network state
                  const sandbox = await getSandbox(sandboxId); // get the sandbox
                  for (const file of files) {
                    await sandbox.files.write(file.path, file.content);
                    updatedFiles[file.path] = file.content;
                  }

                  return updatedFiles;
                } catch (error) {
                  return "Error: " + error;
                }
              }
            );
            // if the new files are an object, assign them to the network state
            if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
            }
          },
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (error) {
                return "Error: " + error;
              }
            });
          },
        }),
      ], // end of tools

      // lifecycle hook to capture task summaries from responses
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastResponse = lastAgentResponse(result);

          if (lastResponse && network) {
            if (lastResponse.includes("<task_summary>")) {
              network.state.data.summary = lastResponse; // assign the last response to the network state
            }
          }
          return result;
        },
      },
    });

    /**
     * Network orchestrates agent execution with iterative processing.
     * Continues running the agent until a task summary is generated,
     * indicating task completion. Max 10 iterations for safety.
     */
    const network = createNetwork({
      name: "code-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          // if the summary is found, stop the agent
          return;
        }
        return codeAgent; // run the agent again
      },
    });

    const result = await network.run(event.data.value);

    // Run the agent
    // const { output } = await network.run(
    //   `Summarize the following text: ${event.data.value}.`
    // );

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    /**
     * Return the complete result object containing all generated artifacts
     *
     * @returns Object with:
     *   - url: The live sandbox URL where the generated app is running
     *   - title: Display name for the generated fragment/app
     *   - files: Array of file objects created/modified by the agent
     *   - summary: Task completion summary generated by the agent
     */
    return {
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  }
);

// Flow of  frontend → tRPC → Inngest → AI agent pipeline
// 1. Frontend sends a prompt to the tRPC server
// 2. tRPC server sends the prompt to the Inngest function
// 3. Inngest function runs the AI agent pipeline
// 4. The AI agent pipeline returns the result to the tRPC server (result object)
// 5. tRPC server returns the result to the frontend

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
