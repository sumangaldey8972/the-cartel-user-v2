import { BACKEND_ENDPOINTS } from "@/config/api-endpoints";
import { backendRequest } from "@/lib/server/backend-request";

export function POST(request: Request) {
  return backendRequest(request, BACKEND_ENDPOINTS.AUTH.VERIFY_EMAIL);
}
