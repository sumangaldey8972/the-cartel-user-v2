import { BACKEND_ENDPOINTS } from "@/config/api-endpoints";
import { backendRequest } from "@/lib/server/backend-request";

type Context = { params: Promise<{ postId: string }> };

async function forward(request: Request, context: Context) {
  const { postId } = await context.params;
  return backendRequest(request, BACKEND_ENDPOINTS.FEED.POST(postId));
}

export const GET = forward;
export const PATCH = forward;
export const DELETE = forward;
