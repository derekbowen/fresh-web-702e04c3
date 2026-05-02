import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-layout";
import { getTool } from "@/lib/host-tools-registry";
import * as T from "@/components/host-tools/tools";
import { MessageBoard } from "@/components/host-tools/message-board";

const TOOL_COMPONENTS: Record<string, React.ComponentType> = {
  "pool-rental-earnings-calculator": T.PoolRentalEarningsCalculator,
  "pool-earnings": T.PoolEarnings,
  "pool-party-pricing": T.PoolPartyPricing,
  "pool-insurance": T.PoolInsurance,
  "pool-capacity": T.PoolCapacity,
  "pool-break-even": T.PoolBreakEven,
  "pool-roi-calculator": T.PoolROI,
  "pool-cost-calculator": T.PoolCost,
  "private-pool-pricing-calculator": T.PrivatePoolPricing,
  "pool-heating-cost": T.PoolHeatingCost,
  "pool-maintenance-cost": T.PoolMaintenanceCost,
  "pool-chemical-cost": T.PoolChemicalCost,
  "pool-water-usage": T.PoolWaterUsage,
  "pool-pump-cost-calculator": T.PoolPumpCost,
  "pool-fill-cost-calculator": T.PoolFillCost,
  "pool-heating-time-calculator": T.PoolHeatingTime,
  "pool-evaporation-calculator": T.PoolEvaporation,
  "pool-volume-calculator": T.PoolVolume,
  "pool-deck-size-calculator": T.PoolDeckSize,
  "pool-party-capacity": T.PoolPartyCapacity,
  "pool-shade-calculator": T.PoolShade,
  "pool-chemical-dose-calculator": T.PoolChemicalDose,
  "pool-water-chemistry": T.PoolWaterChemistry,
  "pool-liability-waiver": T.PoolLiabilityWaiver,
  "pool-rules": T.PoolRules,
  "pool-guest-agreement": T.PoolGuestAgreement,
  "pool-safety-checklist": T.PoolSafetyChecklist,
  "pool-host-checklist": T.PoolHostChecklist,
  "pool-wifi-qr": T.PoolWifiQR,
  "pool-welcome-sign": T.PoolWelcomeSign,
  "pool-cleaning-schedule": T.PoolCleaningSchedule,
  "message-board": MessageBoard,
  "host-marketing-engine": T.HostMarketingEngine,
  "pool-listing-ai-writer": T.PoolListingAIWriter,
  "social-media-calendar": T.SocialMediaCalendar,
  "review-response-generator": T.ReviewResponseGenerator,
  "email-sms-campaigns": T.EmailSmsCampaigns,
  "pool-listing-score": T.PoolListingScore,
  "pool-host-pricing-ai": T.PoolHostPricingAI,
  "pool-rental-price-index": T.PoolRentalPriceIndex,
  "seasonality": T.Seasonality,
  "backyard-income-calculator": T.BackyardIncome,
  "backyard-monetization": T.BackyardMonetization,
  "event-profit": T.EventProfit,
  "swim-lesson-pricing": T.SwimLessonPricing,
  "birthday-party-planner": T.BirthdayPartyPlanner,
  "backyard-event-pricing": T.BackyardEventPricing,
  "pool-rental-profit": T.PoolRentalProfit,
  "noise-distance": T.NoiseDistance,
  "hoa-risk-checker": T.HOARiskChecker,
};

export const Route = createFileRoute("/host-tools/$slug")({
  loader: ({ params }) => {
    const tool = getTool(params.slug);
    if (!tool) throw notFound();
    return { tool };
  },
  head: ({ loaderData }) => {
    const t = loaderData?.tool;
    if (!t) return {};
    return {
      meta: [
        { title: `${t.title} — Pool Host Tools` },
        { name: "description", content: t.summary },
        { property: "og:title", content: t.title },
        { property: "og:description", content: t.summary },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold">Tool not found</h1>
        <p className="mt-2 text-muted-foreground">That tool doesn't exist or hasn't launched yet.</p>
        <Link to="/host-tools" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to all tools
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error?.message}</p>
        <Link to="/host-tools" className="mt-6 inline-flex items-center gap-2 text-primary hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to all tools
        </Link>
      </main>
      <SiteFooter />
    </div>
  ),
  component: ToolPage,
});

function ToolPage() {
  const { tool } = Route.useLoaderData();
  const Cmp = TOOL_COMPONENTS[tool.slug];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/host-tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> All Pool Host Tools
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{tool.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tool.summary}</p>
          <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">{tool.category}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {Cmp ? (
          <Cmp />
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <h2 className="text-lg font-semibold">Coming soon</h2>
            <p className="mt-1 text-sm text-muted-foreground">This tool is on the roadmap. Check back shortly.</p>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
