"use client";

import { useRef, useTransition } from "react";
import { updateAvatar } from "@/app/actions";
import Avatar from "@/components/Avatar";

export default function AvatarUpload({
  playerId,
  name,
  avatarUrl,
}: {
  playerId: string;
  name: string;
  avatarUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("playerId", playerId);
    formData.set("photo", file);
    startTransition(() => {
      updateAvatar(formData);
    });
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={isPending}
      title="Change photo"
      className="relative shrink-0 rounded-full group"
    >
      <Avatar name={name} avatarUrl={avatarUrl} size={44} />
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 text-transparent group-hover:text-white text-xs transition-colors">
        {isPending ? "…" : "✎"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </button>
  );
}
