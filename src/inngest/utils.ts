import { Sandbox } from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";
/**
 * Connects to an existing E2B sandbox instance
 *
 * This utility function establishes a connection to a previously created
 * E2B code interpreter sandbox using its unique identifier. The sandbox
 * provides a secure and isolated cloud environment for:
 * - Running code execution
 * - File system operations
 * - Command execution
 * - Internet access
 *
 * @param sandboxId - The unique identifier of the sandbox to connect to
 * @returns Promise<Sandbox> - Connected sandbox instance ready for use
 *
 * @example
 * ```ts
 * const sandbox = await getSandbox("existing-sandbox-id");
 * await sandbox.files.write("/tmp/test.txt", "Hello World");
 * ```
 */
export async function getSandbox(sandboxId: string) {
  const sandbox = await Sandbox.connect(sandboxId);
  return sandbox;
}



/**
 * Extracts the last assistant response from an agent result
 *
 * This utility function searches through the agent's conversation output
 * to find the most recent message from the assistant and returns its content.
 * The function handles both string content and array-based content structures
 * that may contain multiple text segments.
 *
 * @param result - The AgentResult containing the conversation output
 * @returns The content of the last assistant message, or undefined if no assistant message is found
 *
 * @example
 * ```ts
 * const agentResult = await agent.run("Summarize this text");
 * const lastResponse = lastAgentResponse(agentResult);
 * console.log(lastResponse); // "Here is the summary..."
 * ```
 */
export function lastAgentResponse(result: AgentResult) {
  const lastAgentResponseIndex = result.output.findLastIndex(
    (message) => message.role === "assistant"
  );

  const message = result.output[lastAgentResponseIndex] as
    | TextMessage
    | undefined;

  // If no message found, return undefined
  if (!message?.content) {
    return undefined;
  }

  // Handle string content directly
  if (typeof message.content === "string") {
    return message.content;
  }

  // Handle array content by extracting and joining text segments
  return message.content.map((c) => c.text).join("");
}
