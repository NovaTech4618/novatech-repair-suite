export function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  // Handles numbers entered without the leading 0 (e.g. "8012345678"),
  // which otherwise fell through unchanged and produced a broken wa.me
  // link with no country code.
  if (digits.length === 10) return `234${digits}`;
  return digits;
}

export function openWhatsApp(phone: string, message: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return false;
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function customerBalanceMessage(name: string, balance: number) {
  const amount = `₦${Number(balance || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  return `Hello ${name}, this is a friendly reminder from our workshop. Your current outstanding balance is ${amount}. Please let us know when you plan to settle it. Thank you.`;
}

export function customerGeneralMessage(name: string) {
  return `Hello ${name}, this is a message from our workshop. We wanted to get in touch regarding your account/service. Please let us know how we can assist you. Thank you.`;
}
