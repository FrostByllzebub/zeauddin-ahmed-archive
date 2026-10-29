import siteHandler from "vinext/server/fetch-handler";
import { handleMemoryRequest, type MemoryEnv } from "./memories";
import { retiredSiteRedirect } from "../lib/site-redirects";
export default {
  async fetch(request: Request, env: MemoryEnv, ctx: ExecutionContext) {
    const redirect = retiredSiteRedirect(request);
    if (redirect) return redirect;
    if (new URL(request.url).pathname.startsWith("/api/memories"))
      return handleMemoryRequest(request, env);
    return siteHandler.fetch(request, env, ctx);
  },
};
