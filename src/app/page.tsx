"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect } from "react";
import { isToolUIPart, getToolName } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border px-4 py-3">
        <h1 className="text-lg font-medium">Web3 Address Explorer</h1>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto p-4">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {!hasResults && !isStreaming && (
            <div>
              <p className="text-sm text-muted-foreground">
                输入区块链地址，AI 自动调用链上工具查询相关信息
              </p>
            </div>
          )}

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1 space-y-1">
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setError("");
                    }}
                    placeholder="0x..."
                    disabled={isStreaming}
                    className="font-mono"
                  />
                  {error ? (
                    <p className="text-xs text-destructive">{error}</p>
                  ) : null}
                </div>
                <Button type="submit" disabled={!address.trim() || isStreaming}>
                  {isStreaming ? "查询中…" : "查询"}
                </Button>
                {hasResults && !isStreaming ? (
                  <Button type="button" variant="outline" onClick={handleClear}>
                    清除
                  </Button>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <div ref={resultRef} className="space-y-4">
            {messages
              .filter((m) => m.role === "assistant")
              .map((message) => (
                <div key={message.id}>
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      return (
                        <Card key={`${message.id}-${i}`}>
                          <CardContent className="pt-6">
                            <div
                              className="text-sm leading-relaxed text-foreground [&_strong]:font-semibold"
                              dangerouslySetInnerHTML={{
                                __html: formatMarkdown(part.text),
                              }}
                            />
                          </CardContent>
                        </Card>
                      );
                    }
                    if (isToolUIPart(part)) {
                      return (
                        <ToolCallRow
                          key={`${message.id}-${i}`}
                          name={getToolName(part)}
                          state={part.state}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              ))}

            {isStreaming && !hasResults ? (
              <p className="text-sm text-muted-foreground">正在查询链上数据…</p>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="border-t border-border px-4 py-2">
        <p className="text-center text-xs text-muted-foreground">
          Powered by AI SDK + MCP
        </p>
      </footer>
    </div>
  );
}

type ToolState =
  | "input-streaming"
  | "input-available"
  | "output-available"
  | "approval-requested"
  | "approval-responded"
  | "output-error"
  | "output-denied";

function ToolCallRow({ name, state }: { name: string; state: ToolState }) {
  const stateLabel =
    state === "output-available"
      ? "completed"
      : state === "input-available"
        ? "running"
        : "loading";

  return (
    <div className="my-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <span>Tool: </span>
      <span className="font-mono text-foreground">{name}</span>
      <span className="ml-2">({stateLabel})</span>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMarkdown(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-muted rounded-md p-3 my-2 overflow-x-auto text-xs"><code>$2</code></pre>',
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted rounded px-1 py-0.5 text-xs">$1</code>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
