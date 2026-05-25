// Next.js boot hook: registers this app's webhook URL with the EQU AI Platform
// at server startup so callbacks can begin arriving immediately.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerWebhook } = await import("./app/api/_lib/register-webhook");
  await registerWebhook();
}
