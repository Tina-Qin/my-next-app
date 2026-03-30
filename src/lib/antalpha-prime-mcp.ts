/**
 * One-shot Antalpha Prime MCP (HTTP+SSE) client.
 * Matches the protocol used by `src/assets/antalpha-rwa-skill/scripts/rwa_client.py`.
 */

function parseSseJsonRpcResult(text: string): unknown {
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const payload = JSON.parse(line.slice(6)) as {
      error?: unknown;
      result?: unknown;
    };
    if (payload.error != null) {
      throw new Error(
        typeof payload.error === "string"
          ? payload.error
          : JSON.stringify(payload.error),
      );
    }
    return payload.result;
  }
  throw new Error("MCP: no SSE data line in response");
}

async function mcpInitialize(baseUrl: string): Promise<string> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "my-next-app", version: "1.0" },
      },
      id: 1,
    }),
  });
  const sessionId = res.headers.get("mcp-session-id");
  await res.text();
  if (!sessionId) {
    throw new Error("MCP initialize: missing mcp-session-id header");
  }
  return sessionId;
}

async function mcpCallTool(
  baseUrl: string,
  sessionId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "Mcp-Session-Id": sessionId,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name, arguments: args },
      id: Date.now(),
    }),
  });
  const raw = parseSseJsonRpcResult(await res.text());
  if (raw && typeof raw === "object") {
    return raw as Record<string, unknown>;
  }
  return { value: raw };
}

async function withSession<T>(
  baseUrl: string,
  run: (sessionId: string) => Promise<T>,
): Promise<T> {
  const sessionId = await mcpInitialize(baseUrl);
  return run(sessionId);
}

/** Raw MCP tools/call result (often includes structuredContent + content). */
export async function fetchAntalphaProductList(baseUrl: string) {
  return withSession(baseUrl, (sid) =>
    mcpCallTool(baseUrl, sid, "list-products", {}),
  );
}

export async function fetchAntalphaOrdersByAddress(
  baseUrl: string,
  address: string,
) {
  return withSession(baseUrl, (sid) =>
    mcpCallTool(baseUrl, sid, "query-orders-by-address", { address }),
  );
}
