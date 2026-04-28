function hexToBytes(hex: string): ArrayBuffer | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (isNaN(byte)) return null;
    bytes[i / 2] = byte;
  }
  return bytes.buffer;
}

export async function verifyAgentRequest(request: Request): Promise<boolean> {
  const secret = process.env.AI_AGENT_SECRET;
  if (!secret) return false;

  const timestamp = request.headers.get("X-Agent-Timestamp");
  const signature = request.headers.get("X-Agent-Signature");
  if (!timestamp || !signature) return false;

  // Reject requests older than 5 minutes or more than 1 minute in the future
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || ts > now + 60 || now - ts > 300) return false;

  const body = await request.clone().text();
  const url = new URL(request.url);
  const payload = `${timestamp}.${request.method}.${url.pathname}.${body}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBytes = hexToBytes(signature);
  if (!sigBytes) return false;

  return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(payload));
}
