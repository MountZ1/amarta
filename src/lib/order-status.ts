export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

export function canTransitionStatus(
  current: OrderStatus,
  target: OrderStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

export function getNextAllowedStatuses(current: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[current] || [];
}

export const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-800 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-300",
  },
  processing: {
    label: "Diproses",
    color: "text-blue-800 dark:text-blue-300",
    bg: "bg-blue-100 dark:bg-blue-950/60 border-blue-300",
  },
  shipped: {
    label: "Dikirim",
    color: "text-purple-800 dark:text-purple-300",
    bg: "bg-purple-100 dark:bg-purple-950/60 border-purple-300",
  },
  completed: {
    label: "Selesai",
    color: "text-emerald-800 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300",
  },
  cancelled: {
    label: "Dibatalkan",
    color: "text-rose-800 dark:text-rose-300",
    bg: "bg-rose-100 dark:bg-rose-950/60 border-rose-300",
  },
};
