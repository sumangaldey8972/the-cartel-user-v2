import "server-only";
import type { BackendEndpoint } from "@/config/api-endpoints";

const LOCAL_BACKEND_URL = "http://localhost:4000";
const UPSTREAM_TIMEOUT_MS = 20_000;
const HOP_BY_HOP_HEADERS = ["connection", "content-length", "host", "keep-alive", "transfer-encoding", "upgrade"];

function getBackendUrl(endpoint: BackendEndpoint) {
  const baseUrl = process.env.BACKEND_API_URL;
  if (!baseUrl && process.env.NODE_ENV === "production") {
    throw new Error("BACKEND_API_URL is required in production");
  }
  return new URL(endpoint, baseUrl ?? LOCAL_BACKEND_URL);
}

export async function backendRequest(request: Request, endpoint: BackendEndpoint) {
  try {
    const upstreamRequest = new Request(getBackendUrl(endpoint), request);
    for (const header of HOP_BY_HOP_HEADERS) upstreamRequest.headers.delete(header);

    const upstreamResponse = await fetch(upstreamRequest, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: upstreamResponse.headers,
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return Response.json(
      {
        success: false,
        error: {
          code: timedOut ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
          message: timedOut ? "The API took too long to respond" : "The API is temporarily unavailable",
        },
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}
