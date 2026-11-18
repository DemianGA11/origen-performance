/** Deny-only switch. Never grants access to Production or evaluates credentials.
 * The public marker is derived by next.config at build time, not a user flag.
 */
export function isPreviewEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_ORIGEN_PREVIEW === "1";
}

export function assertNotPreview(): void {
  if (isPreviewEnvironment()) throw new Error("PREVIEW_OPERATION_BLOCKED");
}

/** Preserve legacy export types without initializing an SDK or touching secrets.
 * Defense in depth for browser calls/direct imports; never a functional client.
 */
export function blockedPreviewClient<Client>(): Client {
  return new Proxy({}, { get() { throw new Error("PREVIEW_OPERATION_BLOCKED"); } }) as Client;
}
