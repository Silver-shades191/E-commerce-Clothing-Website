// Only allow same-site relative redirects after login (blocks open-redirect attacks).
export function safeCallback(input: unknown, fallback = "/account") {
  if (typeof input !== "string") return fallback;
  if (!input.startsWith("/") || input.startsWith("//") || input.includes("\\")) return fallback;
  return input;
}
