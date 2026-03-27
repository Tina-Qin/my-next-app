# Web3 Address Query — Design Spec

## Overview

Replace the existing chat-based UI with a focused web3 address query page. Users enter a blockchain address, AI automatically selects and calls MCP tools to fetch on-chain data, and results are displayed as structured cards with streaming text.

## Architecture

```
[Address Input] → POST /api/chat → streamText(openai + MCP tools)
                                          ↓
                        [Tool call status cards + AI markdown summary]
                                          ↓
                              [Frontend streaming render]
```

### Files Changed

| File | Change |
|---|---|
| `src/app/page.tsx` | Rewrite: chat UI → address query UI |
| `src/app/api/chat/route.ts` | Adjust system prompt for address-focused queries |
| `src/app/globals.css` | Minor tweaks if needed |

No new files created.

## Frontend — `page.tsx`

### Page States

1. **Idle** — centered title, address input, empty results area
2. **Loading** — input disabled, button shows spinner, tool call cards stream in
3. **Result** — tool call status cards + AI markdown summary rendered below input; input stays active for new queries

### Address Input

- Single text input with placeholder `0x...`
- Validation: starts with `0x`, 42 hex characters (Ethereum address format)
- Invalid input shows red error text below the input
- Submit via Enter key or button click

### Result Display

- **Tool call cards**: reuse existing `ToolCallCard` component showing tool name + running/completed state
- **AI summary**: markdown text rendered via existing `formatMarkdown` function
- "Clear" button to reset results and return to idle state

### Interaction

- `useChat` hook with `DefaultChatTransport` (same as current)
- On submit: `sendMessage({ text: "查询地址: <address>" })`
- On new query: clear previous messages before sending
- Streaming status tracked via `status === "streaming"`

### Preserved Elements

- Dark theme with animated background orbs and grid
- Glass-card styling, neon borders, shimmer text effects
- `ToolCallCard` component
- `formatMarkdown` utility

## Backend — `route.ts`

### MCP Connection

No changes. Continues to connect to `https://mcp-skills.prime.antalpha.com/mcp` via `createMCPClient` with HTTP transport.

### System Prompt

Update to address-query focus:

> You are a Web3 address analyst. The user will provide a blockchain address. Use the available MCP tools to query all relevant information about this address (balance, transactions, token holdings, etc.). Present findings in clear markdown with sections. Always respond in the same language the user uses.

### Tool Loop

- `stepCountIs(5)` — max 5 tool call rounds (unchanged)
- AI autonomously selects which MCP tools to call based on the address

### Response

- `toUIMessageStreamResponse()` — streams tool call status and text parts to frontend (unchanged)

## Validation Rules

- Ethereum address: `/^0x[0-9a-fA-F]{40}$/`
- Show inline error for invalid format; do not submit

## Error Handling

- MCP server unavailable: show error message in results area
- AI streaming error: show error state with retry option
- Empty tool results: AI summarizes that no data was found
