/* Twilio inbound webhook for SMS welcome replies.
 * Configure your Twilio number's webhook to point to /api/twilio (POST, application/x-www-form-urlencoded).
 */

interface Env {
  TWILIO_WELCOME_MESSAGE?: string;
  TWILIO_VOICE_MESSAGE?: string;
  TWILIO_AUTH_TOKEN?: string; // For signature validation
  ELEVENLABS_STREAM_URL?: string; // Media Stream endpoint for voice agent
  DIGITAL_RECEPTION_WEBHOOK?: string; // Optional downstream hook
}

// Escape basic XML characters for TwiML safety
const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const toBase64 = (bytes: ArrayBuffer) => {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary);
};

// HMAC-SHA1 signature check for Twilio webhooks
async function validateTwilioSignature(
  request: Request,
  params: URLSearchParams,
  authToken?: string
): Promise<boolean> {
  if (!authToken) return true; // Skip if not configured
  const headerSig = request.headers.get("x-twilio-signature");
  if (!headerSig) return false;

  const url = request.url;
  const sortedKeys = Array.from(params.keys()).sort();
  const baseString = sortedKeys.reduce(
    (acc, key) => acc + key + (params.get(key) || ""),
    url
  );

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(baseString));
  const computed = toBase64(signature);

  return computed === headerSig;
}

async function forwardToReception(
  env: Env,
  payload: Record<string, string>,
  waitUntil?: (p: Promise<unknown>) => void
) {
  if (!env.DIGITAL_RECEPTION_WEBHOOK) return;
  const promise = fetch(env.DIGITAL_RECEPTION_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => console.error("digital reception hook failed", err));
  if (waitUntil) waitUntil(promise);
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
  waitUntil?: (p: Promise<unknown>) => void;
}) {
  const { request, env, waitUntil } = context;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/x-www-form-urlencoded")) {
    return new Response("Unsupported content type", { status: 400 });
  }

  // Twilio posts form-encoded bodies; we need the raw text for parsing.
  const cloneForText = request.clone();
  const bodyText = await cloneForText.text();
  const params = new URLSearchParams(bodyText);

  const signatureOk = await validateTwilioSignature(request, params, env.TWILIO_AUTH_TOKEN);
  if (!signatureOk) {
    console.warn("Twilio signature validation failed");
    return new Response("Invalid signature", { status: 403 });
  }

  const from = params.get("From") || "";
  const to = params.get("To") || "";
  const messageBody = params.get("Body") || "";
  const callStatus = params.get("CallStatus") || "";
  const callSid = params.get("CallSid") || "";

  console.log("Twilio inbound", { from, to, messageBody });

  // Voice call handling: connect to ElevenLabs media stream when configured.
  if (callSid || callStatus) {
    const voiceWelcome =
      env.TWILIO_VOICE_MESSAGE ||
      "Thanks for calling. Connecting you to our voice agent now.";

    await forwardToReception(env, { from, to, callSid, callStatus, messageBody }, waitUntil);

    const connectStream = env.ELEVENLABS_STREAM_URL
      ? `<Connect><Stream url="${escapeXml(env.ELEVENLABS_STREAM_URL)}" /></Connect>`
      : "";

    const twimlVoice = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Say>${escapeXml(
      voiceWelcome
    )}</Say>${connectStream ? "\n  " + connectStream : ""}\n</Response>`;

    return new Response(twimlVoice, {
      status: 200,
      headers: { "Content-Type": "application/xml" },
    });
  }

  const welcome =
    env.TWILIO_WELCOME_MESSAGE ||
    "Thanks for reaching out. A digital reception agent will follow up shortly. Please feel free to ask any questions. The Agent will get back to you with your request and follow up details";

  await forwardToReception(env, { from, to, messageBody }, waitUntil);

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n  <Message>${escapeXml(
    welcome
  )}</Message>\n</Response>`;

  return new Response(twiml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

export async function onRequest(context: { request: Request; env: Env }) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}
