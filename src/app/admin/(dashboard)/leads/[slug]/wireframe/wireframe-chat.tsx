"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { refineWireframeAction, type RefineWireframeState, type WireframeChatMessage } from "./actions";

const initial: RefineWireframeState = {};

export function WireframeChat({
  previewId,
  leadSlug,
  initialChat,
}: {
  previewId: string;
  leadSlug: string;
  initialChat: WireframeChatMessage[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(refineWireframeAction, initial);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chat = state?.chat ?? initialChat;

  useEffect(() => {
    if (state?.v) {
      router.refresh();
      if (textareaRef.current) textareaRef.current.value = "";
    }
  }, [state?.v, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4">
        {chat.length === 0 && (
          <p className="text-sm text-muted">Type a change request below and Opus will rewrite the wireframe.</p>
        )}
        {chat.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                msg.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-blue/30 px-3 py-2 text-sm text-white"
                  : "max-w-[85%] rounded-2xl rounded-tl-sm bg-white/8 px-3 py-2 text-sm text-white"
              }
            >
              {msg.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-white/8 px-3 py-2 text-sm text-muted animate-pulse">
              Applying change…
            </div>
          </div>
        )}
      </div>

      <form action={formAction} className="border-t border-white/10 p-3 space-y-2">
        <input type="hidden" name="previewId" value={previewId} />
        <input type="hidden" name="leadSlug" value={leadSlug} />
        <Textarea
          ref={textareaRef}
          name="instruction"
          placeholder="Describe the change you want…"
          rows={3}
          required
          disabled={pending}
          className="resize-none"
        />
        {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
        <Button type="submit" size="sm" className="w-full" disabled={pending}>
          {pending ? "Applying…" : "Send"}
        </Button>
      </form>
    </div>
  );
}
