# Web3 Address Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the chat UI with a focused web3 address query page that takes an address, calls MCP tools via AI, and renders results as structured cards.

**Architecture:** Single-page app with an address input form at top. On submit, sends the address as a chat message to `/api/chat`, which uses `streamText` + MCP tools to query the address. Results stream back as tool status cards + AI markdown summary.

**Tech Stack:** Next.js 16, React 19, AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/mcp`), OpenAI gpt-4o, Tailwind CSS 4

---

## File Structure

| File | Role |
|---|---|
| `src/app/page.tsx` | **Rewrite** — Address query page with input, validation, streaming results |
| `src/app/api/chat/route.ts` | **Modify** — Update system prompt for address-focused queries |

`src/app/globals.css` and `src/app/layout.tsx` remain unchanged.

---

### Task 1: Update Backend System Prompt

**Files:**
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Update the system prompt in route.ts**

Replace the current system prompt with an address-query-focused version. No other changes to this file.

```typescript
// src/app/api/chat/route.ts
import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createMCPClient } from "@ai-sdk/mcp";

export async function POST(req: Request) {
  const { messages } = await req.json();

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
    model: openai("gpt-4o"),
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
```

- [ ] **Step 2: Verify the backend compiles**

Run: `cd /Users/qinxiaoting/Desktop/my-next-app && npx tsc --noEmit --pretty`
Expected: No errors related to `route.ts`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: update system prompt for address-focused queries"
```

---

### Task 2: Rewrite Frontend — Address Query Page

**Files:**
- Rewrite: `src/app/page.tsx`

- [ ] **Step 1: Write the complete new page.tsx**

Replace the entire contents of `src/app/page.tsx` with the address query page. Key behaviors:
- `useChat` with `DefaultChatTransport` for streaming
- `setMessages([])` before each new query to clear previous results
- Address validation: `/^0x[0-9a-fA-F]{40}$/`
- Three states: idle (no results), loading (streaming), result (done)
- Reuse `ToolCallCard` and `formatMarkdown` from existing code

```tsx
// src/app/page.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { isToolUIPart } from "ai";

const transport = new DefaultChatTransport({ api: "/api/chat" });

const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

export default function Home() {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const { messages, setMessages, sendMessage, status } = useChat({ transport });
  const resultRef = useRef<HTMLDivElement>(null);

  const isStreaming = status === "streaming";
  const hasResults = messages.some((m) => m.role === "assistant");

  useEffect(() => {
    if (isStreaming) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = address.trim();
    if (!trimmed) return;
    if (!ADDRESS_REGEX.test(trimmed)) {
      setError("请输入有效的以太坊地址（0x 开头，42 位十六进制字符）");
      return;
    }
    if (isStreaming) return;

    setMessages([]);
    sendMessage({ text: `查询地址: ${trimmed}` });
  };

  const handleClear = () => {
    setMessages([]);
    setAddress("");
    setError("");
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 grid-bg" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-sm font-bold text-black">
            W3
          </div>
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="shimmer-text">Web3 Address Explorer</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          MCP Connected
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Address input section */}
          <div className={`transition-all duration-500 ${hasResults || isStreaming ? "mb-8" : "pt-24 mb-0"}`}>
            {!hasResults && !isStreaming && (
              <div className="text-center mb-8 animate-fadeInUp">
                <h2 className="text-2xl font-bold mb-2">
                  <span className="shimmer-text">Web3 Address Explorer</span>
                </h2>
                <p className="text-white/40 text-sm">
                  输入区块链地址，AI 自动调用链上工具查询相关信息
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="glass-card neon-border rounded-2xl p-4 animate-fadeInUp"
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setError("");
                  }}
                  placeholder="0x..."
                  disabled={isStreaming}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-white/30 outline-none font-mono disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!address.trim() || isStreaming}
                  className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-purple text-sm font-medium text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                >
                  {isStreaming ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      查询中
                    </span>
                  ) : (
                    "查询"
                  )}
                </button>
                {hasResults && !isStreaming && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="shrink-0 px-3 py-2 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
                  >
                    清除
                  </button>
                )}
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-400">{error}</p>
              )}
            </form>
          </div>

          {/* Results section */}
          <div ref={resultRef} className="space-y-4">
            {messages
              .filter((m) => m.role === "assistant")
              .map((message) => (
                <div key={message.id} className="animate-fadeInUp">
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <div
                          key={`${message.id}-${i}`}
                          className="glass-card rounded-2xl px-5 py-4 text-sm leading-relaxed prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: formatMarkdown(part.text),
                          }}
                        />
                      );
                    }
                    if (isToolUIPart(part)) {
                      return (
                        <ToolCallCard
                          key={`${message.id}-${i}`}
                          name={part.toolName}
                          state={part.state}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              ))}

            {isStreaming && !hasResults && (
              <div className="flex justify-center py-8 animate-fadeInUp">
                <div className="glass-card rounded-2xl px-6 py-4 flex items-center gap-3">
                  <span className="w-3 h-3 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                  <span className="text-sm text-white/50">正在查询链上数据...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3">
        <p className="text-center text-[10px] text-white/20">
          Powered by AI SDK + MCP Protocol
        </p>
      </footer>
    </div>
  );
}

function ToolCallCard({ name, state }: { name: string; state: string }) {
  const stateLabel =
    state === "output-available"
      ? "completed"
      : state === "input-available"
        ? "running"
        : "loading";

  return (
    <div className="my-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            stateLabel === "completed"
              ? "bg-accent-green"
              : "bg-accent-cyan animate-pulse"
          }`}
        />
        <span className="text-white/50">Tool:</span>
        <span className="font-mono text-accent-cyan">{name}</span>
        <span className="ml-auto text-white/30">{stateLabel}</span>
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-white/5 rounded-lg p-3 my-2 overflow-x-auto text-xs"><code>$2</code></pre>',
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-white/10 rounded px-1.5 py-0.5 text-accent-cyan text-xs">$1</code>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
```

- [ ] **Step 2: Verify the frontend compiles**

Run: `cd /Users/qinxiaoting/Desktop/my-next-app && npx tsc --noEmit --pretty`
Expected: No type errors

- [ ] **Step 3: Visual smoke test**

Run: `cd /Users/qinxiaoting/Desktop/my-next-app && pnpm dev`

Check in browser at `http://localhost:3000`:
1. Page shows centered title "Web3 Address Explorer" and address input
2. Entering an invalid address (e.g. "hello") and pressing Enter shows red validation error
3. Input field uses monospace font and has `0x...` placeholder
4. "查询" button is disabled when input is empty

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rewrite page as focused web3 address query UI"
```

---

### Task 3: End-to-End Verification

- [ ] **Step 1: Full query test**

With dev server running at `http://localhost:3000`:
1. Enter a valid Ethereum address (e.g. `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`)
2. Click "查询"
3. Verify: button shows spinner + "查询中", input becomes disabled
4. Verify: tool call cards appear showing MCP tool names with running/completed states
5. Verify: AI markdown summary appears below the tool cards
6. Verify: "清除" button appears after results load
7. Click "清除" — verify results disappear and page returns to centered idle state

- [ ] **Step 2: Error case test**

1. Enter `0xinvalid` — verify red error text appears
2. Enter `hello` — verify red error text appears
3. Clear the input — verify error text disappears

- [ ] **Step 3: Typecheck**

Run: `cd /Users/qinxiaoting/Desktop/my-next-app && npx tsc --noEmit --pretty`
Expected: 0 errors
