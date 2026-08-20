/** Human-readable labels for CreditLedger `reason` values. */
export function creditReasonLabel(reason: string): string {
  switch (reason) {
    case "admin_grant":
      return "Admin credit grant";
    case "admin_adjust":
      return "Admin credit adjustment";
    case "topup":
      return "Credit pack purchase";
    case "spend_image":
      return "AI image generation";
    case "spend_campaign":
      return "Campaign generation";
    case "refund":
      return "Credits refund";
    case "migration":
      return "Balance migration";
    default:
      if (reason.startsWith("spend_")) {
        return reason.replace(/^spend_/, "").replace(/_/g, " ");
      }
      return reason.replace(/_/g, " ");
  }
}

export function formatCreditActivityDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatRefreshDate(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "Refreshes today";
  if (diffDays === 1) return "Refreshes tomorrow";
  return `Refreshes ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}
