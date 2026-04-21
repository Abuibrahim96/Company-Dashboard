"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Hi — I'm the Elite Truck Lines recruitment assistant. Ask me anything about driving with us — pay, lanes, freight types, how to get started — and I'll do my best to answer. If I don't know something, I'll point you to our team.",
};

export default function RecruitmentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      // Focus the input when the panel opens so users can just start typing.
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updated = [...messages, userMessage];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // slice(1) drops the hardcoded welcome — Claude didn't say it,
        // so it shouldn't appear in the conversation history we send.
        body: JSON.stringify({ messages: updated.slice(1) }),
      });
      const data = await res.json();
      const reply =
        (typeof data.response === "string" && data.response) ||
        (typeof data.error === "string" && data.error) ||
        "Sorry, something went wrong. Please call us at (503) 309-5090.";
      setMessages([...updated, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...updated,
        {
          role: "assistant",
          content:
            "Network error — please check your connection or call us at (503) 309-5090.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Floating toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-accent-500 hover:bg-accent-600 px-5 py-3 text-white shadow-lg shadow-accent-500/25 transition-all hover:shadow-xl"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Chat with us</span>
          </>
        )}
      </button>

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-navy-950 border-l border-navy-200 dark:border-navy-800 z-40 flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-200 dark:border-navy-800">
          <div>
            <p className="text-navy-950 dark:text-white font-semibold text-sm">
              Elite Truck Lines
            </p>
            <p className="text-navy-500 dark:text-navy-400 text-xs">
              Recruitment assistant
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-navy-500 hover:text-navy-950 dark:hover:text-white hover:bg-navy-100 dark:hover:bg-navy-800 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-accent-500 text-white"
                    : "bg-navy-100 dark:bg-navy-800 text-navy-950 dark:text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-navy-100 dark:bg-navy-800 text-sm text-navy-500 dark:text-navy-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-navy-200 dark:border-navy-800 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about pay, lanes, how to apply..."
            disabled={loading}
            maxLength={2000}
            className="flex-1 bg-navy-50 dark:bg-navy-900 border border-navy-200 dark:border-navy-700 rounded-full px-4 py-2 text-sm text-navy-950 dark:text-white placeholder-navy-400 focus:outline-none focus:border-accent-500 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-full bg-accent-500 hover:bg-accent-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
