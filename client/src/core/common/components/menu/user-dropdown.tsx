import { useEffect, useState } from "react";
import { User as UserIcon, LogOut } from "lucide-react";

import { useMe } from "@identity/auth/hooks/use-me";
import { useLogout } from "@common/hooks/use-logout";
import { Avatar } from "../ui/avatar/Avatar";
import { Dropdown } from "../ui/dropdown/dropdown";
import { DropdownItem } from "../ui/dropdown/dropdown-item";

export const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { me, fetchMe } = useMe();
  const handleLogout = useLogout();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const fullName = me ? `${me.firstName} ${me.lastName}` : "";

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3">
          <Avatar name={fullName} size="small" />
        </span>

        {fullName && (
          <span className="block mr-1 font-medium text-theme-sm">{fullName}</span>
        )}
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {me && (
          <div className="border-b border-gray-100 px-3 pb-3 dark:border-gray-800">
            <p className="font-medium text-gray-700 text-theme-sm dark:text-gray-300">{fullName}</p>
            <p className="text-xs text-gray-400">{me.email}</p>
          </div>
        )}

        <DropdownItem
          tag="a"
          to="/app/profile"
          onItemClick={closeDropdown}
          baseClassName="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <UserIcon className="size-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          Mi Perfil
        </DropdownItem>

        <button
          className="flex items-center gap-3 px-3 py-2 mt-1 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          onClick={handleLogout}
        >
          <LogOut className="size-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          Cerrar Sesión
        </button>
      </Dropdown>
    </div>
  );
};
