import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";

const provider = createOpenAI({
  baseURL: "https://newapi.elevatesphere.com/v1",
  apiKey: process.env.NEW_API_KEY,
});

export async function POST(req: Request) {
  const { messages: uiMessages } = await req.json();
  const messages = await convertToModelMessages(uiMessages);

  const mcpClient = await createMCPClient({
    name: "web3-address-query",
    transport: {
      type: "http",
      url: "https://mcp-skills.prime.antalpha.com/mcp",
    },
  });

  let mcpTools = {};
  try {
    mcpTools = await mcpClient.tools();
  } catch {
    // MCP server may be unavailable; proceed without tools
  }

  const result = streamText({
    model: provider.chat("claude-opus-4-6"),
    system: `You are a Web3 address analyst. The user will provide a blockchain address.
Use the available MCP tools to query all relevant information about this address — balance, transactions, token holdings, contract info, etc.
Present your findings in clear markdown with sections and formatting.
If a tool call fails or returns no data, say so clearly.
Always respond in the same language the user uses.`,
    messages,
    tools: mcpTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
