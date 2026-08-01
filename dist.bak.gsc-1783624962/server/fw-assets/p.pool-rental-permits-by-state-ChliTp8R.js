import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { S as SiteHeader, K as LAST_UPDATED, M as faqs, e as SiteFooter } from "./router-Bw8GQi9C.js";
import { Link } from "@tanstack/react-router";
import "react";
import "@tanstack/react-query";
import "./site-footer-defaults-C7gHxS5b.js";
import "./cities.functions-DKA5O9eJ.js";
import "../server.js";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "@tanstack/react-router/ssr/server";
import "zod";
import "./client.server-D5ro3rAQ.js";
import "@supabase/supabase-js";
import "./auth-middleware-C3cX-s7a.js";
import "./createMiddleware-BvN2ghIY.js";
import "./site-origin-DalDu5p3.js";
import "./city-slug-Bqls2qOy.js";
import "@tanstack/zod-adapter";
import "./client-Dh5RMKgP.js";
import "./transactional-email.server-BoL6nxoQ.js";
import "@react-email/components";
import "./_unsubscribe-footer-DXp0Y_3B.js";
import "lucide-react";
import "./states-UIdvqlKs.js";
import "./courses.server-Bfz1suZ4.js";
import "@lovable.dev/webhooks-js";
import "crypto";
import "./emailit-DRsipvVx.js";
import "@lovable.dev/email-js";
import "./reauthentication-CCohUDQL.js";
import "node:crypto";
import "./sms.server-BJah3xxU.js";
import "./sharetribe-mirror.server-D8Jwl9-L.js";
import "./sharetribe.server-BZ7y3aGI.js";
import "./listing-sync.server-C2GpYdIM.js";
import "./renter-drip.server-CMz_M9Zp.js";
import "node:fs";
import "node:path";
import "./host-drip.server-nBw4NS9X.js";
import "./ig-lead-hunter.server-BzgLZUba.js";
import "./gsc-sync.server-BxVUz4Yz.js";
import "./followup-reminders.server-cq9Qg0-p.js";
import "./blog-autogen.server-CC6RPtlf.js";
import "./auto-outreach.server-DLLupcxB.js";
import "./alias-backfill.server-CG8T_N6R.js";
import "./academy-config-B5vgptOj.js";
const ROWS = [{
  code: "AL",
  name: "Alabama",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "Most counties unregulated; Mobile and Baldwin tax STR through county lodging tax"
}, {
  code: "AK",
  name: "Alaska",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "Anchorage and Juneau collect bed tax on STR; no state pool rental statute"
}, {
  code: "AZ",
  name: "Arizona",
  difficulty: "Moderate",
  permitNeeded: "Often",
  notableCounties: "Scottsdale, Paradise Valley, Sedona, and Phoenix all require STR registration; Maricopa County permits residential pools"
}, {
  code: "AR",
  name: "Arkansas",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "No statewide registry; Little Rock and Fayetteville require business privilege license"
}, {
  code: "CA",
  name: "California",
  difficulty: "Hard",
  permitNeeded: "Often",
  notableCounties: "Los Angeles, San Diego, Orange (Newport Beach, Laguna), Riverside (Palm Springs, La Quinta), and Sonoma counties have aggressive STR and event-rental ordinances; Title 24 pool barrier rules apply statewide"
}, {
  code: "CO",
  name: "Colorado",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Denver, Boulder, and most mountain resort counties (Summit, Eagle, Pitkin) require STR license; Front Range cities increasingly fold pool rentals into STR code"
}, {
  code: "CT",
  name: "Connecticut",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "No statewide STR registry; some shoreline towns (Westport, Greenwich) restrict commercial backyard use through zoning"
}, {
  code: "DE",
  name: "Delaware",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "Sussex County (beach towns) applies lodging tax to STR; no pool-specific rule"
}, {
  code: "FL",
  name: "Florida",
  difficulty: "Hard",
  permitNeeded: "Often",
  notableCounties: "Miami-Dade, Broward, Orange (Orlando), Osceola, Pinellas, and Collier all enforce STR registration with inspections; HOA pre-emption under FL 720 limits but does not eliminate HOA pushback"
}, {
  code: "GA",
  name: "Georgia",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Atlanta (Fulton, DeKalb), Savannah (Chatham), and Tybee Island require STR permits; rural counties unregulated"
}, {
  code: "HI",
  name: "Hawaii",
  difficulty: "Hard",
  permitNeeded: "Yes",
  notableCounties: "Honolulu (Oahu) caps STR by zone with Bill 41; Maui and Kauai counties enforce strict TVR rules; pool rentals fall under same code"
}, {
  code: "ID",
  name: "Idaho",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Boise and McCall require STR registration; Idaho state law (HB 216) preempts outright bans"
}, {
  code: "IL",
  name: "Illinois",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Chicago requires STR license through BACP; Cook County collects hotel accommodations tax; downstate largely unregulated"
}, {
  code: "IN",
  name: "Indiana",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Indianapolis (Marion) and Bloomington (Monroe) require STR registration; state law (HEA 1035) limits municipal bans"
}, {
  code: "IA",
  name: "Iowa",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "No state STR registry; Des Moines and Iowa City require local rental permits"
}, {
  code: "KS",
  name: "Kansas",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "No state pool-rental statute; Wichita and Overland Park apply general business license"
}, {
  code: "KY",
  name: "Kentucky",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Louisville (Jefferson) and Lexington (Fayette) require STR registration; rural and bourbon-trail counties largely open"
}, {
  code: "LA",
  name: "Louisiana",
  difficulty: "Moderate",
  permitNeeded: "Often",
  notableCounties: "Orleans Parish (New Orleans) enforces strict STR permitting with primary-residence rule; East Baton Rouge and Lafayette require STR license"
}, {
  code: "ME",
  name: "Maine",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Portland (Cumberland) and Bar Harbor (Hancock) require STR registration; most rural counties unregulated"
}, {
  code: "MD",
  name: "Maryland",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Montgomery and Baltimore counties enforce STR licensing; Ocean City (Worcester) charges short-term lodging tax"
}, {
  code: "MA",
  name: "Massachusetts",
  difficulty: "Hard",
  permitNeeded: "Yes",
  notableCounties: "State STR registration required statewide since 2019; Boston (Suffolk), Cape Cod (Barnstable), Nantucket, and Martha's Vineyard add local layers"
}, {
  code: "MI",
  name: "Michigan",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "No state STR statute; Traverse City (Grand Traverse), Saugatuck (Allegan), and Ann Arbor (Washtenaw) regulate locally"
}, {
  code: "MN",
  name: "Minnesota",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Minneapolis (Hennepin) and St. Paul (Ramsey) require STR license; lake counties (Cass, Crow Wing) increasingly add fees"
}, {
  code: "MS",
  name: "Mississippi",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "Gulf Coast counties (Harrison, Hancock) collect tourism tax; no state pool rule"
}, {
  code: "MO",
  name: "Missouri",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "St. Louis and Kansas City both require STR license; Branson (Taney) and Lake of the Ozarks counties enforce resort-area rules"
}, {
  code: "MT",
  name: "Montana",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Bozeman (Gallatin), Missoula, and Whitefish (Flathead) require STR registration; rural counties largely open"
}, {
  code: "NE",
  name: "Nebraska",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "Omaha and Lincoln apply general occupation tax; no STR-specific rule"
}, {
  code: "NV",
  name: "Nevada",
  difficulty: "Hard",
  permitNeeded: "Yes",
  notableCounties: "Clark County (Las Vegas, Henderson, Paradise) caps STR with new licensing regime under AB 363; Washoe (Reno) enforces local STR permitting"
}, {
  code: "NH",
  name: "New Hampshire",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Portsmouth, Conway, and lake-region towns require STR license; rural counties unregulated"
}, {
  code: "NJ",
  name: "New Jersey",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Jersey Shore towns (Cape May, Ocean, Monmouth) enforce STR registration; state imposes occupancy tax on short-term lodging"
}, {
  code: "NM",
  name: "New Mexico",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Santa Fe and Taos require STR permits; Albuquerque (Bernalillo) registers STR with the city"
}, {
  code: "NY",
  name: "New York",
  difficulty: "Hard",
  permitNeeded: "Yes",
  notableCounties: "NYC (Local Law 18) effectively bans most unhosted STR; Hudson Valley (Ulster, Dutchess) and Hamptons (Suffolk) enforce strict local rules; upstate counties more permissive"
}, {
  code: "NC",
  name: "North Carolina",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Asheville (Buncombe), Wilmington (New Hanover), and Outer Banks (Dare, Currituck) require STR registration; mountain and coastal counties most active"
}, {
  code: "ND",
  name: "North Dakota",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "No statewide registry; Fargo and Bismarck apply general business license"
}, {
  code: "OH",
  name: "Ohio",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Columbus (Franklin), Cleveland (Cuyahoga), and Cincinnati (Hamilton) require STR registration; rural counties unregulated"
}, {
  code: "OK",
  name: "Oklahoma",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "Oklahoma City and Tulsa apply general business license; no STR-specific rule"
}, {
  code: "OR",
  name: "Oregon",
  difficulty: "Moderate",
  permitNeeded: "Often",
  notableCounties: "Portland (Multnomah), Bend (Deschutes), and coastal counties (Lincoln, Clatsop) enforce STR permits; Ashland and Hood River have strict caps"
}, {
  code: "PA",
  name: "Pennsylvania",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Philadelphia and Pittsburgh require STR registration; Poconos (Monroe, Pike) tightening rules; rural counties open"
}, {
  code: "RI",
  name: "Rhode Island",
  difficulty: "Moderate",
  permitNeeded: "Yes",
  notableCounties: "State requires STR registration through DBR; Newport and Providence add local layers"
}, {
  code: "SC",
  name: "South Carolina",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Charleston (Charleston County), Myrtle Beach (Horry), and Hilton Head (Beaufort) enforce STR permitting; HOAs in master-planned communities common obstacle"
}, {
  code: "SD",
  name: "South Dakota",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "No state STR statute; Sioux Falls and Rapid City (Pennington) apply general business license"
}, {
  code: "TN",
  name: "Tennessee",
  difficulty: "Moderate",
  permitNeeded: "Often",
  notableCounties: "Nashville (Davidson) caps non-owner-occupied STR; Memphis (Shelby) requires permit; Gatlinburg and Pigeon Forge (Sevier) enforce resort-area STR code"
}, {
  code: "TX",
  name: "Texas",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Austin (Travis), Dallas, and San Antonio (Bexar) require STR registration; Houston (Harris) more permissive; HOA pre-emption under Texas Property Code limits outright bans"
}, {
  code: "UT",
  name: "Utah",
  difficulty: "Moderate",
  permitNeeded: "Often",
  notableCounties: "Park City (Summit), Moab (Grand), and St. George (Washington) enforce STR permits; Salt Lake County varies by city"
}, {
  code: "VT",
  name: "Vermont",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Burlington (Chittenden) and most ski-region towns (Windham, Windsor) require STR registration"
}, {
  code: "VA",
  name: "Virginia",
  difficulty: "Moderate",
  permitNeeded: "Sometimes",
  notableCounties: "Virginia Beach, Norfolk, Richmond, and Arlington enforce STR permitting; Loudoun and Fairfax counties tighten HOA-heavy suburbs"
}, {
  code: "WA",
  name: "Washington",
  difficulty: "Moderate",
  permitNeeded: "Often",
  notableCounties: "Seattle (King), Spokane, and Tacoma (Pierce) require STR license; Chelan County (Lake Chelan, Leavenworth) enforces strict resort-area rules"
}, {
  code: "WV",
  name: "West Virginia",
  difficulty: "Easy",
  permitNeeded: "No",
  notableCounties: "No state STR registry; Charleston and Morgantown apply general business license"
}, {
  code: "WI",
  name: "Wisconsin",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Milwaukee and Madison (Dane) require STR permits; Door County (lakefront) enforces local rules; rural counties open"
}, {
  code: "WY",
  name: "Wyoming",
  difficulty: "Easy",
  permitNeeded: "Sometimes",
  notableCounties: "Jackson (Teton) tightly regulates STR with overlay zones; Cheyenne and Casper unregulated"
}];
const DIFFICULTY_STYLE = {
  Easy: "bg-green-50 text-green-800",
  Moderate: "bg-amber-50 text-amber-800",
  Hard: "bg-red-50 text-red-800"
};
function PermitsByStatePage() {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-5xl px-4 py-10 text-slate-900", children: [
      /* @__PURE__ */ jsxs("nav", { className: "mb-4 text-xs text-slate-500", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:underline", children: "Home" }),
        /* @__PURE__ */ jsx("span", { className: "mx-2", children: "/" }),
        /* @__PURE__ */ jsx("span", { children: "Pool rental permits by state" })
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold leading-tight md:text-4xl", children: "Pool rental permits by state: what you legally need before you list" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 text-sm text-slate-500", children: [
        "Last updated ",
        LAST_UPDATED,
        " · Reviewed by Derek Bowen, CEO, PRNM Corp"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-6 text-lg leading-relaxed", children: "There is no federal pool rental permit. Compliance lives at the state, county, city, and HOA level, in that order. The table below grades every US state by how hard it currently is to legally host an hourly pool rental, calls out the specific counties that drive the rule, and links to a state-specific guide for each one." }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "50-state permit difficulty" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 overflow-x-auto rounded-lg border border-slate-200", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-xs uppercase tracking-wide text-slate-600", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "State" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Difficulty" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Permit needed" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Notable counties" }),
            /* @__PURE__ */ jsx("th", { className: "px-3 py-2", children: "Guide" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: ROWS.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-slate-200 align-top", children: [
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3 font-semibold whitespace-nowrap", children: r.name }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3", children: /* @__PURE__ */ jsx("span", { className: `inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${DIFFICULTY_STYLE[r.difficulty]}`, children: r.difficulty }) }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3 whitespace-nowrap", children: r.permitNeeded }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3 text-slate-700", children: r.notableCounties }),
            /* @__PURE__ */ jsx("td", { className: "px-3 py-3 whitespace-nowrap", children: /* @__PURE__ */ jsxs(Link, { to: "/p/$slug", params: {
              slug: `host-advocacy-${r.name.toLowerCase().replace(/\s+/g, "-")}`
            }, className: "text-blue-700 hover:underline", children: [
              r.name,
              " guide →"
            ] }) })
          ] }, r.code)) })
        ] }) }),
        /* @__PURE__ */ jsxs("p", { className: "mt-2 text-xs text-slate-500", children: [
          "Sources: each state's short-term rental statute, the relevant county and city code, and reporting from local government for the named jurisdictions. Last reviewed ",
          LAST_UPDATED,
          ". Always confirm current requirements with your city or county clerk before listing."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-blue-900", children: "How to read this table" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-blue-950", children: [
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Easy" }),
            ": no state STR registry, minimal municipal layer outside the largest city. A general business license is usually the entire footprint."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Moderate" }),
            ": state defers to municipalities, but several large counties enforce STR registration with inspections."
          ] }),
          /* @__PURE__ */ jsxs("li", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Hard" }),
            ": statewide registry or aggressive county-level rules in the population centers. Plan on real paperwork."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Frequently asked questions" }),
        /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-6", children: faqs.map((f) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: f.q }),
          /* @__PURE__ */ jsx("p", { className: "faq-answer mt-1 text-sm leading-relaxed text-slate-700", children: f.a })
        ] }, f.q)) })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mt-10 rounded-lg bg-slate-50 p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold", children: "Related reading" }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-3 list-inside list-disc space-y-1 text-sm text-blue-700", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/host-advocacy", className: "hover:underline", children: "Host advocacy hub (all 50 state guides)" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/pool-rental-insurance-explained", className: "hover:underline", children: "Pool rental insurance, explained" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/pool-rental-host-fees-compared", className: "hover:underline", children: "Pool rental host fees compared" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/hoa-pool-rental-defense-kit", className: "hover:underline", children: "HOA defense kit" }) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/p/earnings-calculator", className: "hover:underline", children: "Pool rental earnings calculator" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(SiteFooter, {})
  ] });
}
export {
  PermitsByStatePage as component
};
