type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  rounded?: "full" | "xl";
};

export function UserAvatar({
  name,
  avatarUrl,
  className = "w-9 h-9",
  rounded = "xl",
}: UserAvatarProps) {
  const roundedClass = rounded === "full" ? "rounded-full" : "rounded-xl";

  if (avatarUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${className} ${roundedClass} object-cover border border-surface-600/50`}
        referrerPolicy="no-referrer"
      />
    );
  }

  const letter = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      className={`${className} ${roundedClass} bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-md`}
    >
      {letter}
    </div>
  );
}
