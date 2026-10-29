import siteHandler from "vinext/server/fetch-handler";
import { handleMemoryRequest, type MemoryEnv } from "./memories";
export default {
  async fetch(request: Request, env: MemoryEnv, ctx: ExecutionContext) {
    if (new URL(request.url).pathname.startsWith("/api/memories"))
      return handleMemoryRequest(request, env);
    return siteHandler.fetch(request, env, ctx);
  },
};
