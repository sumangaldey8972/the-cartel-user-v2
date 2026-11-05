import { BACKEND_ENDPOINTS } from "@/config/api-endpoints";
import { backendRequest } from "@/lib/server/backend-request";

type Context = { params: Promise<{ commentId: string }> };

async function forward(request: Request, context: Context) {
  const { commentId } = await context.params;
  return backendRequest(request, BACKEND_ENDPOINTS.FEED.COMMENT(commentId));
}

export const PATCH = forward;
export const DELETE = forward;
