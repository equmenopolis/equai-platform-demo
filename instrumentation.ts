export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { registerWebhook } = await import("./app/api/_lib/register-webhook");
  await registerWebhook();
}
