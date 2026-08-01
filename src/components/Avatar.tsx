import { colorForKey } from "@/lib/constants";

export default function Avatar({
  name,
  avatarUrl,
  size = 40,
  color,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
  color?: string;
}) {
  color ??= colorForKey(name);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderColor: color }}
        className="rounded-full object-cover border-2 shrink-0"
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: size * 0.42,
      }}
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
    >
      {initial}
    </div>
  );
}
