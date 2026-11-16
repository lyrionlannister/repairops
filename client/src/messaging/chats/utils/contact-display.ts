export const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `+${digits.slice(0, -10)} (${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
  }
  return `+${digits}`;
};

export const getInitials = (name: string): string =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const AVATAR_COLORS = [
  "bg-[#e17055] text-white",
  "bg-[#00b894] text-white",
  "bg-[#0984e3] text-white",
  "bg-[#6c5ce7] text-white",
  "bg-[#fdcb6e] text-gray-800",
  "bg-[#e84393] text-white",
  "bg-[#00cec9] text-white",
];

export const getAvatarColor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};
