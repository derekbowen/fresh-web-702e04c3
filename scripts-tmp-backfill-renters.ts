import { backfillAllSharetribeRenters } from "@/server/renter-drip.server";
const r = await backfillAllSharetribeRenters();
console.log(JSON.stringify(r, null, 2));
