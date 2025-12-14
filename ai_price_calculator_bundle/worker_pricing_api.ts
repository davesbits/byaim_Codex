import { calculateAnnualCost } from "./calculate";

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export default {
  async fetch(req: Request, env: Env) {
    if (new URL(req.url).pathname !== "/api/pricing/calculate") {
      return new Response("Not found", { status: 404 });
    }

    const body = await req.json();

    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/current_prices?is_active=eq.true`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    const prices = await res.json();
    const price = prices.find(
      (p: any) => p.provider === body.provider && p.model === body.model
    );

    if (!price) return new Response("Model not found", { status: 404 });

    return Response.json(
      calculateAnnualCost({
        inputTokensPerMonth: body.inputTokensPerMonth,
        outputTokensPerMonth: body.outputTokensPerMonth,
        price,
      })
    );
  },
};