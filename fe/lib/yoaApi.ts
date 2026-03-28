const DEFAULT_API_BASE_URL = "http://127.0.0.1:8080";

export type TokenTier = "basic" | "pro";

type JsonObject = Record<string, unknown>;

type ValidatedTokenBody = {
  valid: true;
  plan: TokenTier;
  label?: string | null;
  status: string;
  issued_at: string;
  last_used_at?: string | null;
  token_prefix: string;
};

export class YoaApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "YoaApiError";
    this.status = status;
    this.body = body;
  }
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_YOA_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractFirstString(body: unknown, keys: string[]) {
  if (!isJsonObject(body)) {
    return null;
  }

  for (const key of keys) {
    const value = body[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function extractErrorMessage(body: unknown, fallback: string) {
  return (
    extractFirstString(body, ["detail", "message", "error", "reason", "status"]) ?? fallback
  );
}

function extractIssuedToken(body: unknown) {
  return extractFirstString(body, ["token", "access_token", "issued_token", "bearer_token"]);
}

function extractTokenTier(body: unknown): TokenTier | null {
  const plan = extractFirstString(body, ["plan"]);

  if (plan === "basic" || plan === "pro") {
    return plan;
  }

  return null;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  return response.text().catch(() => null);
}

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new YoaApiError(
      extractErrorMessage(body, `Backend request failed (${response.status})`),
      response.status,
      body
    );
  }

  return body;
}

export async function claimBasicToken(inputText: string, label: string) {
  const body = await request("/tokens/claim/basic", {
    method: "POST",
    body: JSON.stringify({
      input_text: inputText,
      label
    })
  });

  return {
    token: extractIssuedToken(body),
    message: extractFirstString(body, ["message", "detail", "status"]),
    body
  };
}

export async function claimProToken(params: {
  authCode?: string | null;
  loyaltyPhrase?: string | null;
  label: string;
}) {
  const payload: JsonObject = {
    label: params.label
  };

  if (params.authCode) {
    payload.auth_code = params.authCode;
  }

  if (params.loyaltyPhrase) {
    payload.loyalty_phrase = params.loyaltyPhrase;
    payload.input_text = params.loyaltyPhrase;
    payload.phrase = params.loyaltyPhrase;
  }

  const body = await request("/tokens/claim/pro", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return {
    token: extractIssuedToken(body),
    message: extractFirstString(body, ["message", "detail", "status"]),
    body
  };
}

export async function assertTokenAccess(token: string) {
  const body = await request("/access", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return {
    message: extractFirstString(body, ["message", "detail", "status"]),
    body
  };
}

export async function validateStoredToken(token: string) {
  const body = (await request("/tokens/validate", {
    method: "POST",
    body: JSON.stringify({ token })
  })) as ValidatedTokenBody;

  return {
    tier: extractTokenTier(body),
    label: extractFirstString(body, ["label"]),
    issuedAt: extractFirstString(body, ["issued_at"]),
    lastUsedAt: extractFirstString(body, ["last_used_at"]),
    tokenPrefix: extractFirstString(body, ["token_prefix"]),
    body
  };
}
