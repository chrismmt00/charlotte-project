import { handlers } from "@/auth";
import { rateLimit, checkOrigin, errorResponse } from "@/lib/server/http";
async function run(request) {
  try {
    checkOrigin(request);
    if(request.method==="POST")await rateLimit(request,"auth",10,600000);
    return handlers[request.method](request);
  } catch(e) {return errorResponse(e);}
}
export const GET=run,POST=run;
