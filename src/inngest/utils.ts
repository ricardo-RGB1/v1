import { Sandbox } from "@e2b/code-interpreter"; 

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
