import React from "react";

type AvatarSize = "sm" | "md" | "lg";

type AvatarProps = {
  name: string;
  size?: AvatarSize;
  online?: boolean;
  src?: string; // optional image
};

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-lg",
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = "md",
  online = false,
  src,
}) => {
  const initials = getInitials(name);

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`rounded-full object-cover ${sizeClasses[size]}`}
        />
      ) : (
        <div
          className={`rounded-full bg-gray-300 flex items-center justify-center font-semibold text-gray-700 ${sizeClasses[size]}`}
        >
          {initials}
        </div>
      )}

      {/* Online indicator */}
      {online && (
        <span className="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};