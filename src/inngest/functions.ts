import { Sandbox } from "@e2b/code-interpreter";

import {
  openai,
  createAgent,
  createTool,
  createNetwork,
  type Tool,
  type Message,
  createState,
} from "@inngest/agent-kit";
import { inngest } from "./client";
import { getSandbox, lastAgentResponse, extractTextContent } from "./utils";
import { z } from "zod";
import { PROMPT, RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT } from "@/prompt";
import { prisma } from "@/lib/prisma";
import { SANDBOX_TIMEOUT } from "./types";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" }, // TRIGGER event name

  async ({ event, step }) => {
    // this is the main function that will be called when the event is received
    // create a new sandbox and return the id
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("v1-nextjs-test-3");
      await sandbox.setTimeout(SANDBOX_TIMEOUT); // 30 minutes
      return sandbox.sandboxId;
    });

    /**
     * Retrieve and format previous messages from the project's conversation history
     *
     * This step fetches all messages associated with the current project from the database
     * and transforms them into the format expected by the agent's message system.
     *
     * Process:
     * 1. Query the database for all messages in this project, ordered chronologically
     * 2. Transform each database message into the agent's Message format
     * 3. Map database roles ("ASSISTANT"/"USER") to agent roles ("assistant"/"user")
     * 4. Return the formatted message array for agent context
     *
     * This ensures the agent has full conversation context when processing new requests,
     * allowing it to understand previous interactions and maintain continuity.
     */
    const previousMessages = await step.run(
      "get-previous-messages",
      async () => {
        // Initialize an empty array to store the formatted messages
        const formattedMessages: Message[] = [];

        // Retrieve all messages for this project from the database, ordered by creation time
        const messages = await prisma.message.findMany({
          where: {
            projectId: event.data.projectId,
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 5, 
        });

        // Transform each database message into the agent's expected Message format
        for (const message of messages) {
          // Convert database message to agent message format with role mapping
          formattedMessages.push({
            type: "text",
            role: message.role === "ASSISTANT" ? "assistant" : "user",
            content: message.content,
          });
        }

        return formattedMessages;
      }
    );

    /**
     * Initialize the agent state with empty summary and files, plus conversation history
     *
     * The state object maintains:
     * - summary: A string that will be populated with task completion summaries
     * - files: An object mapping file paths to their content for tracking code changes
     * - messages: The conversation history from previous interactions in this project
     */
    const state = createState<AgentState>(
      {
        summary: "",
        files: {},
      },
      {
        messages: previousMessages,
      }
    );

    /**
     * Create the main code generation agent
     *
     * This agent is responsible for interpreting user prompts and generating complete Next.js applications.
     * It operates within a sandboxed environment and has access to terminal commands, file operations,
     * and the ability to read existing code to maintain context across iterations.
     *
     * Agent Configuration:
     * - name: Unique identifier for this agent instance
     * - description: Brief explanation of the agent's role and capabilities
     * - system: The comprehensive prompt that defines the agent's behavior and constraints
     * - model: OpenAI GPT-4.1 with low temperature for deterministic, consistent output
     *
     * Available Tools:
     * 1. terminal: Execute shell commands in the sandbox environment
     * 2. createOrUpdateFiles: Write or modify files in the project structure
     * 3. readFiles: Read existing files to understand current codebase state
     *
     * Lifecycle Hooks:
     * - onResponse: Captures task completion summaries from agent responses
     *   When the agent includes a <task_summary> tag, it indicates the task is complete
     */
    const codeAgent = createAgent<AgentState>({
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
        /**
         * Terminal Tool
         *
         * Allows the agent to execute shell commands within the sandbox environment.
         * Commonly used for installing npm packages, running build commands, or other
         * development tasks that require command-line access.
         *
         * Parameters:
         * - command: The shell command to execute
         *
         * Returns: The stdout output of the command, or error details if the command fails
         */
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
        /**
         * Create or Update Files Tool
         *
         * Enables the agent to create new files or modify existing ones in the sandbox.
         * This is the primary mechanism for generating and updating the codebase.
         * The tool also maintains a state record of all files for tracking changes.
         *
         * Parameters:
         * - files: Array of file objects, each containing a path and content
         *
         * Side Effects:
         * - Writes files to the sandbox filesystem
         * - Updates the network state to track file changes
         */
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
          handler: async (
            { files },
            { step, network }: Tool.Options<AgentState>
          ) => {
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
        /**
         * Read Files Tool
         *
         * Allows the agent to read existing files from the sandbox filesystem.
         * This is essential for understanding the current codebase structure,
         * reading configuration files, or examining existing components before
         * making modifications.
         *
         * Parameters:
         * - files: Array of file paths to read
         *
         * Returns: JSON string containing an array of objects with path and content
         */
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

      /**
       * Lifecycle Hooks
       *
       * The onResponse hook monitors agent responses to detect task completion.
       * When the agent includes a <task_summary> tag in its response, this indicates
       * that the current task has been completed successfully. The summary is then
       * stored in the network state to signal completion to the router.
       */
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
    }); // end of codeAgent

    /**
     * Create the agent network that orchestrates the code generation process
     *
     * The network manages the execution flow of AI agents and maintains shared state
     * throughout the code generation lifecycle. It coordinates between different agents
     * and ensures proper task completion within iteration limits.
     *
     * Configuration:
     * - name: Unique identifier for this network instance
     * - agents: Array of available agents (currently just the codeAgent)
     * - maxIter: Maximum number of iterations before terminating (prevents infinite loops)
     * - defaultState: Initial state containing sandbox ID and empty data structures
     * - router: Logic to determine which agent should handle the next iteration
     *
     * Router Logic:
     * - If a task summary exists in the network state, the task is considered complete
     * - Otherwise, routes to the codeAgent to continue processing
     * - This ensures the network stops when the agent provides a completion summary
     */
    const network = createNetwork<AgentState>({
      name: "code-agent-network",
      agents: [codeAgent],
      maxIter: 10,
      defaultState: state,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    /**
     * Execute the agent network with the user's input
     *
     * This runs the code generation network with the user's prompt as input.
     * The network will iterate through agents until a task summary is generated
     * or the maximum iteration limit is reached.
     *
     * Parameters:
     * - event.data.value: The user's input prompt/request
     * - state: The initialized agent state containing conversation history
     *
     * Returns: Network execution result containing final state and agent responses
     */
    const result = await network.run(event.data.value, { state: state });

    /**
     * Fragment title generator agent
     *
     * Generates concise, descriptive titles (max 3 words) for code fragments
     * based on task summaries. Used to create user-friendly labels for the UI.
     */
    const fragmentTitleGenerator = createAgent({
      name: "fragment-title-generator",
      description:
        "An assistant that generates a short, descriptive title for a code fragment based on its <task_summary>.",
      system: FRAGMENT_TITLE_PROMPT,
      model: openai({
        model: "gpt-4.1",
      }),
    });

    /**
     * Response generator agent
     *
     * Generates a short, user-friendly message explaining what was just built,
     * based on the <task_summary> provided by the other agents.
     */
    const responseGenerator = createAgent({
      name: "response-generator",
      description:
        "An assistant that generates a short, user-friendly message explaining what was just built, based on the <task_summary> provided by the other agents.",
      system: RESPONSE_PROMPT,
      model: openai({
        model: "gpt-4.1",
      }),
    });

    /**
     * Generate fragment title and user response from task summary
     */
    const { output: fragmentTitleOutput } = await fragmentTitleGenerator.run(
      result.state.data.summary
    );
    const { output: responseOutput } = await responseGenerator.run(
      result.state.data.summary
    );

    // Handle cases where the agent didn't complete successfully
    const isError =
      !result.state.data.summary ||
      !result.state.data.files ||
      Object.keys(result.state.data.files).length === 0;

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    /**
     * Save the AI agent's result to the database
     *
     * This step persists the agent's work by creating database records:
     *
     * Error Case:
     * - Creates a Message with role "ASSISTANT" and type "ERROR"
     * - Contains error message indicating task completion failure
     *
     * Success Case:
     * - Creates a Message with role "ASSISTANT" and type "RESULT"
     * - Message content contains the agent's task summary
     * - Creates an associated Fragment record containing:
     *   - sandboxUrl: Live URL where the generated app is accessible
     *   - title: Display name for the generated fragment
     *   - files: JSON object with all generated/modified files
     *
     * This preserves the complete state of the agent's work for retrieval
     * and display in the frontend interface.
     */
    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content:
              "The agent was unable to complete the task within the maximum iterations.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }
      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          content: extractTextContent(
            responseOutput,
            "The agent was unable to generate a response. Please try again."
          ),
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxUrl,
              title: extractTextContent(fragmentTitleOutput, "Fragment"),
              files: result.state.data.files,
            },
          },
        },
      });
    });

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

/**
 * Return the complete result object containing all generated artifacts
 *
 * @returns Object with:
 *   - url: The live sandbox URL where the generated app is running
 *   - title: Display name for the generated fragment/app
 *   - files: Array of file objects created/modified by the agent
 *   - summary: Task completion summary generated by the agent
 */
