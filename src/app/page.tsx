"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { isToolUIPart, getToolName } from "ai";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const transport = new DefaultChatTransport({ api: "/api/chat" });

const ASSISTANT_NAME = "Nina";
const ASSISTANT_AVATAR = "/nina-avatar.png";

const SUGGESTIONS = [
  "介绍一下在售产品信息，我想了解如何买入或认购",
  "这些产品的收益、费用、赎回规则和风险有哪些？请面向交易决策说明。",
  "我想用钱包地址查一下我的订单与持仓",
];

const HERO_TAGS: { label: string; sub: string; mono?: boolean; delay: string }[] = [
  { label: "RWA", sub: "真实资产代币化", delay: "0s" },
  { label: "MCP", sub: "链上工具实时调用", delay: "0.4s" },
  { label: "0x", sub: "钱包即身份", mono: true, delay: "0.8s" },
  { label: "AI Agent", sub: "多步推理编排", delay: "1.2s" },
];

const PARTICLE_STYLE: { top: string; left: string; delay: string }[] = [
  { top: "18%", left: "12%", delay: "0s" },
  { top: "42%", left: "86%", delay: "0.8s" },
  { top: "72%", left: "20%", delay: "0.4s" },
  { top: "28%", left: "48%", delay: "1.2s" },
];

function NinaMidBand() {
  return (
    <div className="px-4 py-7">
      <div className="nina-mid-hairline" aria-hidden />
      <p className="mt-3 text-center text-xs text-zinc-600">MCP 链上数据 · 先问清，再决策</p>
    </div>
  );
}

function NinaTradeBrief({ scrollToChat }: { scrollToChat: () => void }) {
  return (
    <section className="border-b border-zinc-800/50 px-4 pb-9 pt-0">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm leading-relaxed text-zinc-500">
          下单前理清{" "}
          <span className="text-zinc-300">产品</span>
          <span className="text-zinc-700"> · </span>
          <span className="text-zinc-300">风险</span>
          <span className="text-zinc-700"> · </span>
          <span className="text-zinc-300">流程</span>
          即可。
        </p>
        <button
          type="button"
          onClick={scrollToChat}
          className="mt-4 text-xs font-medium text-zinc-400 underline decoration-zinc-700 underline-offset-[6px] transition-colors hover:text-violet-300 hover:decoration-violet-500/40"
        >
          跳到对话
        </button>
        <p className="mt-5 text-[10px] leading-relaxed text-zinc-600">
          投资有风险。本助手非投资建议。
        </p>
      </div>
    </section>
  );
}

function NinaWeb3Hero({
  onViewProducts,
  onRiskFocus,
  disabled,
}: {
  onViewProducts: () => void;
  onRiskFocus: () => void;
  disabled: boolean;
}) {
  return (
    <section className="nina-hero-root border-b border-zinc-800/60 px-4 pb-10 pt-8">
      <div className="pointer-events-none absolute inset-0 z-1 overflow-hidden" aria-hidden>
        <div className="nina-mesh-orb nina-mesh-orb--1" />
        <div className="nina-mesh-orb nina-mesh-orb--2" />
        <div className="nina-mesh-orb nina-mesh-orb--3" />
      </div>
      <div className="nina-scanline-overlay z-2" aria-hidden />
      {PARTICLE_STYLE.map((p, i) => (
        <span
          key={`pt-${i}`}
          className="nina-particle z-2"
          style={{ top: p.top, left: p.left, animationDelay: p.delay }}
          aria-hidden
        />
      ))}
      <div className="nina-hero-grid" aria-hidden />
      <div className="nina-hero-blob-a" aria-hidden />
      <div className="nina-hero-blob-b" aria-hidden />
      <div className="nina-hero-blob-c" aria-hidden />

      <svg
        className="pointer-events-none absolute right-0 top-1/2 hidden h-[220px] w-[min(42%,320px)] -translate-y-1/2 opacity-[0.35] md:block"
        viewBox="0 0 320 200"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="nina-hero-line" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#22d3ee" stopOpacity="0.7" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path
          className="nina-hero-svg-line"
          d="M 40 140 L 120 80 L 200 120 L 280 50"
          stroke="url(#nina-hero-line)"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <circle cx="40" cy="140" r="5" fill="#a78bfa" fillOpacity="0.9" />
        <circle cx="120" cy="80" r="4" fill="#22d3ee" fillOpacity="0.85" />
        <circle cx="200" cy="120" r="4" fill="#c4b5fd" fillOpacity="0.8" />
        <circle cx="280" cy="50" r="6" fill="#e879f9" fillOpacity="0.55" />
      </svg>

      <div className="relative z-10 mx-auto max-w-3xl">
        <p
          className="nina-hero-rise mb-3 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500"
          style={{ animationDelay: "0.05s" }}
        >
          Antalpha Prime · MCP · On-chain
        </p>
        <h2
          className="nina-hero-rise nina-hero-title text-center text-2xl font-semibold leading-tight tracking-tight sm:text-3xl"
          style={{ animationDelay: "0.12s" }}
        >
          AI + 链上数据，陪你完成 RWA 交易前每一步
        </h2>
        <p
          className="nina-hero-rise mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-zinc-400 sm:text-[15px]"
          style={{ animationDelay: "0.2s" }}
        >
          先看清单、再算风险、最后走官方渠道下单——Nina 用{" "}
          <span className="text-zinc-300">Antalpha Prime MCP</span> 把产品与订单信息讲透，帮助你做出自己的交易决策。
        </p>

        <div className="nina-hero-rise mt-8 flex flex-wrap justify-center gap-3 sm:gap-4" style={{ animationDelay: "0.28s" }}>
          {HERO_TAGS.map((t) => (
            <div
              key={t.label}
              className="nina-float-tag rounded-2xl border border-zinc-800/90 bg-zinc-950/50 px-4 py-2.5 shadow-sm shadow-violet-950/20 backdrop-blur-sm"
              style={{ animationDelay: t.delay }}
            >
              <p
                className={`text-sm font-semibold text-zinc-100 ${t.mono ? "font-mono tracking-tight" : ""}`}
              >
                {t.label}
              </p>
              <p className="text-[10px] text-zinc-500">{t.sub}</p>
            </div>
          ))}
        </div>

        <div
          className="nina-hero-rise mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
          style={{ animationDelay: "0.36s" }}
        >
          <div className="nina-cta-shell nina-cta-pulse w-full sm:w-auto sm:min-w-[240px]">
            <div className="nina-border-spin" aria-hidden />
            <div className="nina-cta-inner">
              <Button
                type="button"
                disabled={disabled}
                onClick={onViewProducts}
                className="h-11 w-full rounded-[15px] border-0 bg-transparent font-semibold text-zinc-50 hover:bg-zinc-900/70 disabled:opacity-50"
              >
                查看在售产品，准备交易
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={onRiskFocus}
            className="h-11 rounded-xl border-zinc-600 bg-zinc-950/40 text-sm font-medium text-zinc-200 hover:border-violet-500/40 hover:bg-violet-950/25 hover:text-zinc-50 disabled:opacity-50"
          >
            先弄清收益与风险
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, setMessages, sendMessage, status } = useChat({ transport });
  const resultRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLElement>(null);

  const isStreaming = status === "streaming";
  const hasResults = messages.some((m) => m.role === "assistant");

  const scrollToChat = () => {
    chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onHeroViewProducts = () => {
    scrollToChat();
    sendSuggestion("介绍一下在售产品信息，我想了解如何买入或认购");
  };

  const onHeroRisk = () => {
    scrollToChat();
    sendSuggestion("这些产品的收益、费用、赎回规则和风险有哪些？请面向交易决策说明。");
  };

  useEffect(() => {
    if (isStreaming) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const sendSuggestion = (text: string) => {
    if (isStreaming) return;
    sendMessage({ text });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] bg-[linear-gradient(180deg,#0f0f12_0%,#09090b_45%,#09090b_100%)] text-zinc-100">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <NinaWeb3Hero
          disabled={isStreaming}
          onViewProducts={onHeroViewProducts}
          onRiskFocus={onHeroRisk}
        />
        <NinaMidBand />
        <NinaTradeBrief scrollToChat={scrollToChat} />
        <main ref={chatSectionRef} className="scroll-mt-4 px-4 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-5">
          {!hasResults && !isStreaming && (
            <div className="space-y-5">
              <p className="text-[13px] leading-relaxed text-zinc-400">
                <span className="nina-intro-line" style={{ animationDelay: "0ms" }}>
                  用自然语言提问即可。
                </span>
                <span className="nina-intro-line" style={{ animationDelay: "90ms" }}>
                  例如想了解在售产品，
                </span>
                <span className="nina-intro-line" style={{ animationDelay: "180ms" }}>
                  AI 会通过{" "}
                  <span
                    className="nina-intro-accent"
                    style={{ "--nina-shimmer-delay": "0.35s" } as CSSProperties}
                  >
                    Antalpha Prime MCP
                  </span>{" "}
                  拉取实时产品列表，帮你对比条款、费用与赎回规则，为交易决策打底；
                </span>
                <span className="nina-intro-line" style={{ animationDelay: "270ms" }}>
                  也可提供{" "}
                  <span
                    className="nina-intro-accent nina-intro-mono"
                    style={{ "--nina-shimmer-delay": "0.5s" } as CSSProperties}
                  >
                    0x
                  </span>{" "}
                  钱包地址查询订单。
                </span>
              </p>
              <div className="space-y-2.5">
                <p className="text-[11px] font-medium text-zinc-500">交易前，也可以直接问</p>
                <div className="flex flex-col items-start gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={isStreaming}
                      className="rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-left text-xs leading-snug text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800/90 disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => sendSuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={resultRef} className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {message.role === "user"
                  ? message.parts.map((part, i) =>
                      part.type === "text" ? (
                        <div
                          key={`${message.id}-u-${i}`}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100"
                        >
                          {part.text}
                        </div>
                      ) : null,
                    )
                  : null}
                {message.role === "assistant" ? (
                  <div className="flex gap-3">
                    <Image
                      src={ASSISTANT_AVATAR}
                      alt={ASSISTANT_NAME}
                      width={32}
                      height={32}
                      className="mt-0.5 size-8 shrink-0 rounded-full object-cover ring-1 ring-zinc-700/60"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-[10px] font-medium text-zinc-500">{ASSISTANT_NAME}</p>
                      {message.parts.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <div
                              key={`${message.id}-${i}`}
                              className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3.5 py-3.5 shadow-sm shadow-black/20"
                            >
                              <div
                                className="text-[13px] leading-relaxed text-zinc-200 [&_strong]:font-semibold [&_strong]:text-zinc-50"
                                dangerouslySetInnerHTML={{
                                  __html: formatMarkdown(part.text),
                                }}
                              />
                            </div>
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
                  </div>
                ) : null}
              </div>
            ))}

            {isStreaming && !hasResults ? (
              <p className="text-sm text-zinc-500">正在处理（可能正在调用产品接口）…</p>
            ) : null}
          </div>
        </div>
        </main>
      </div>

      <div className="sticky bottom-0 z-20 shrink-0 border-t border-zinc-800/80 bg-[#09090b]/90 px-4 pb-3 pt-3 backdrop-blur-md supports-backdrop-filter:bg-[#09090b]/70">
        <div className="mx-auto mb-3 flex max-w-3xl items-center gap-3">
          <Image
            src={ASSISTANT_AVATAR}
            alt={ASSISTANT_NAME}
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover ring-1 ring-zinc-700/80"
          />
          <div className="min-w-0">
            <p className="text-[17px] font-semibold tracking-tight text-zinc-50">{ASSISTANT_NAME}</p>
            <p className="text-[11px] text-zinc-400">Antalpha RWA 助手</p>
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-zinc-800 bg-[#121214] p-1 pl-3 shadow-inner shadow-black/30">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：我想了解在售 RWA 如何买入与风险"
              disabled={isStreaming}
              className="h-10 flex-1 border-0 bg-transparent px-0 text-sm text-zinc-100 shadow-none placeholder:text-zinc-500 focus-visible:ring-0"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="h-10 shrink-0 rounded-xl bg-zinc-50 px-5 font-semibold text-zinc-950 hover:bg-white"
            >
              {isStreaming ? "回复中…" : "发送"}
            </Button>
          </div>
          {messages.length > 0 && !isStreaming ? (
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className="text-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-200"
            >
              清除对话
            </Button>
          ) : null}
        </form>
      </div>

      <footer className="shrink-0 px-4 pb-3 pt-1">
        <p className="text-center text-[10px] text-zinc-600">
          AI SDK · MCP（mcp.prime.antalpha.com）
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
    <div className="my-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-500">
      <span>Tool: </span>
      <span className="font-mono text-zinc-300">{name}</span>
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
      '<pre class="my-2 overflow-x-auto rounded-xl border border-zinc-800 bg-black/40 p-3 text-xs text-zinc-300"><code>$2</code></pre>',
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded bg-zinc-800/80 px-1 py-0.5 text-xs text-zinc-200">$1</code>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
