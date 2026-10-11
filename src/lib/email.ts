import { Resend } from "resend";

const from = process.env.EMAIL_FROM ?? "Atelier <onboarding@resend.dev>";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string, devLink?: string) {
  if (!resend) {
    // Without a provider configured, print the link so local development still works.
    console.info(`[email:dev] to=${to} subject="${subject}"${devLink ? ` link=${devLink}` : ""}`);
    return;
  }
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}

const wrap = (body: string) => `
  <div style="font-family:Georgia,serif;background:#0f0e0c;color:#f4efe6;padding:40px;max-width:560px;margin:auto">
    <h1 style="font-weight:400;letter-spacing:.08em;color:#c9a96e">ATELIER</h1>
    ${body}
    <p style="font-size:12px;color:#8a8478;margin-top:40px">If you did not request this, you can ignore this email.</p>
  </div>`;

export async function sendVerificationEmail(to: string, token: string) {
  const link = `${appUrl}/verify?token=${token}&email=${encodeURIComponent(to)}`;
  await send(
    to,
    "Verify your email",
    wrap(`<p>Confirm your email to finish creating your account.</p>
      <p><a href="${link}" style="color:#c9a96e">Verify email</a></p>
      <p style="font-size:13px;color:#8a8478">This link expires in 24 hours.</p>`),
    link,
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
  await send(
    to,
    "Reset your password",
    wrap(`<p>We received a request to reset your password.</p>
      <p><a href="${link}" style="color:#c9a96e">Choose a new password</a></p>
      <p style="font-size:13px;color:#8a8478">This link expires in 1 hour.</p>`),
    link,
  );
}

export async function sendOrderConfirmationEmail(
  to: string,
  order: { id: string; totalCents: number; items: { name: string; size: string; color: string; quantity: number }[] },
) {
  const rows = order.items
    .map((i) => `<tr><td style="padding:6px 0">${i.name} · ${i.color} / ${i.size} × ${i.quantity}</td></tr>`)
    .join("");
  await send(
    to,
    `Order ${order.id.slice(0, 8).toUpperCase()} confirmed`,
    wrap(`<p>Thank you. Your order is confirmed.</p><table>${rows}</table>
      <p>Total: <strong>$${(order.totalCents / 100).toFixed(2)}</strong></p>
      <p><a href="${appUrl}/orders" style="color:#c9a96e">View your orders</a></p>`),
  );
}
