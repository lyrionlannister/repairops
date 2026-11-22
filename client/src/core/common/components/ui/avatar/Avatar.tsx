import type { AvatarProps } from "@common/props/avatar-props";

import {
  sizeClasses,
  statusSizeClasses,
  statusColorClasses,
  initialsTextClasses,
  initialsFrom,
} from "@/core/common/utils/avatar-utils";

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = "",
  alt = "User Avatar",
  size = "medium",
  status = "none",
}) => {
  return (
    <div className={`relative  rounded-full ${sizeClasses[size]}`}>
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover rounded-full" />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full bg-brand-100 font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 ${initialsTextClasses[size]}`}
        >
          {initialsFrom(name)}
        </div>
      )}
      {status !== "none" && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
            statusSizeClasses[size]
          } ${statusColorClasses[status] || ""}`}
        ></span>
      )}
    </div>
  );
};

