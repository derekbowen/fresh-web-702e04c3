import { useMemo, useState } from "react";
import { ToolShell, NumberField, TextField, SelectField, Stat, $, $$, num, poolGallons, type PoolShape, useCopy } from "./shared";
import { Copy, Download, Sparkles, Loader2 } from "lucide-react";
import { runAiTool } from "@/server/host-tools.functions";

// ===========================================================
// CALCULATORS — money & earnings
// ===========================================================

export function PoolRentalEarningsCalculator() {
  const [rate, setRate] = useState(60);
  const [hoursPerBooking, setHoursPerBooking] = useState(3);
  const [bookingsPerWeek, setBookingsPerWeek] = useState(4);
  const [activeWeeks, setActiveWeeks] = useState(20);
  const [amenityBoost, setAmenityBoost] = useState(15);
  const grossPerBooking = rate * hoursPerBooking * (1 + amenityBoost / 100);
  const weekly = grossPerBooking * bookingsPerWeek;
  const seasonal = weekly * activeWeeks;
  const platformFee = seasonal * 0.15;
  const net = seasonal - platformFee;
  return (
    <ToolShell
      title="Pool Rental Earnings Calculator"
      summary="Estimate season-long income with hourly rate, bookings, and amenity boost."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Per booking" value={$(grossPerBooking)} />
          <Stat label="Per week" value={$(weekly)} hint={`${bookingsPerWeek} bookings`} />
          <Stat label="Season gross" value={$(seasonal)} hint={`${activeWeeks} weeks`} />
          <Stat label="Net (after 15% fee)" value={$(net)} />
        </div>
      }
    >
      <NumberField label="Hourly rate" value={rate} onChange={setRate} suffix="$/hr" />
      <NumberField label="Hours per booking" value={hoursPerBooking} onChange={setHoursPerBooking} suffix="hr" />
      <NumberField label="Bookings per week" value={bookingsPerWeek} onChange={setBookingsPerWeek} />
      <NumberField label="Active weeks per year" value={activeWeeks} onChange={setActiveWeeks} />
      <NumberField label="Amenity boost (hot tub, slide, etc.)" value={amenityBoost} onChange={setAmenityBoost} suffix="%" />
    </ToolShell>
  );
}

export function PoolEarnings() {
  const [rate, setRate] = useState(50);
  const [hours, setHours] = useState(40);
  const monthly = rate * hours;
  return (
    <ToolShell
      title="Pool Earnings Calculator"
      summary="Quick monthly income estimate."
      output={
        <div className="space-y-3">
          <Stat label="Monthly" value={$(monthly)} />
          <Stat label="Yearly" value={$(monthly * 12)} />
        </div>
      }
    >
      <NumberField label="Hourly rate" value={rate} onChange={setRate} suffix="$/hr" />
      <NumberField label="Booked hours per month" value={hours} onChange={setHours} suffix="hr" />
    </ToolShell>
  );
}

export function PoolPartyPricing() {
  const [guests, setGuests] = useState(20);
  const [hours, setHours] = useState(4);
  const [base, setBase] = useState(60);
  const [premium, setPremium] = useState(50);
  const guestSurcharge = Math.max(0, guests - 10) * 5;
  const total = base * hours + guestSurcharge + premium;
  return (
    <ToolShell
      title="Pool Party Pricing Calculator"
      summary="Recommended party rate with per-guest surcharge."
      output={
        <div className="space-y-3">
          <Stat label="Total party price" value={$(total)} />
          <Stat label="Guest surcharge" value={$(guestSurcharge)} hint="+$5 per guest over 10" />
          <Stat label="Per-guest cost" value={$$(total / Math.max(1, guests))} />
        </div>
      }
    >
      <NumberField label="Number of guests" value={guests} onChange={setGuests} />
      <NumberField label="Hours" value={hours} onChange={setHours} />
      <NumberField label="Base hourly rate" value={base} onChange={setBase} suffix="$/hr" />
      <NumberField label="Party premium (cleanup, prep)" value={premium} onChange={setPremium} suffix="$" />
    </ToolShell>
  );
}

export function PoolInsurance() {
  const [value, setValue] = useState(50000);
  const [coverage, setCoverage] = useState<"basic" | "standard" | "premium">("standard");
  const rates = { basic: 0.008, standard: 0.014, premium: 0.022 };
  const annual = value * rates[coverage];
  return (
    <ToolShell
      title="Pool Insurance Estimator"
      summary="Annual liability + property cost estimate."
      output={
        <div className="space-y-3">
          <Stat label="Annual premium" value={$(annual)} />
          <Stat label="Monthly" value={$$(annual / 12)} />
        </div>
      }
    >
      <NumberField label="Pool replacement value" value={value} onChange={setValue} suffix="$" />
      <SelectField
        label="Coverage tier"
        value={coverage}
        onChange={setCoverage}
        options={[
          { value: "basic", label: "Basic ($1M liability)" },
          { value: "standard", label: "Standard ($2M liability + property)" },
          { value: "premium", label: "Premium ($5M + commercial use rider)" },
        ]}
      />
    </ToolShell>
  );
}

export function PoolCapacity() {
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(15);
  const sqft = length * width;
  const safe = Math.floor(sqft / 25); // ~25 sqft per person
  const max = Math.floor(sqft / 15);
  return (
    <ToolShell
      title="Pool Capacity Calculator"
      summary="Industry standard 15-25 sqft per swimmer."
      output={
        <div className="space-y-3">
          <Stat label="Comfortable capacity" value={`${safe} guests`} hint="25 sqft / person" />
          <Stat label="Max safe capacity" value={`${max} guests`} hint="15 sqft / person" />
          <Stat label="Surface area" value={`${num(sqft)} sqft`} />
        </div>
      }
    >
      <NumberField label="Length" value={length} onChange={setLength} suffix="ft" />
      <NumberField label="Width" value={width} onChange={setWidth} suffix="ft" />
    </ToolShell>
  );
}

export function PoolBreakEven() {
  const [investment, setInvestment] = useState(60000);
  const [monthlyRev, setMonthlyRev] = useState(2500);
  const [monthlyCost, setMonthlyCost] = useState(400);
  const monthlyProfit = monthlyRev - monthlyCost;
  const months = monthlyProfit > 0 ? investment / monthlyProfit : Infinity;
  return (
    <ToolShell
      title="Pool Break-Even Calculator"
      summary="When does your pool pay for itself?"
      output={
        <div className="space-y-3">
          <Stat label="Months to break-even" value={Number.isFinite(months) ? num(months, 1) : "—"} />
          <Stat label="Years to break-even" value={Number.isFinite(months) ? num(months / 12, 1) : "—"} />
          <Stat label="Monthly profit" value={$(monthlyProfit)} />
        </div>
      }
    >
      <NumberField label="Total pool investment" value={investment} onChange={setInvestment} suffix="$" />
      <NumberField label="Monthly rental revenue" value={monthlyRev} onChange={setMonthlyRev} suffix="$" />
      <NumberField label="Monthly operating cost" value={monthlyCost} onChange={setMonthlyCost} suffix="$" />
    </ToolShell>
  );
}

export function PoolROI() {
  const [investment, setInvestment] = useState(60000);
  const [annualNet, setAnnualNet] = useState(18000);
  const [years, setYears] = useState(5);
  const totalReturn = annualNet * years;
  const roi = ((totalReturn - investment) / investment) * 100;
  return (
    <ToolShell
      title="Pool ROI Calculator"
      summary="Return on pool investment over your holding period."
      output={
        <div className="space-y-3">
          <Stat label="ROI" value={`${num(roi, 1)}%`} hint={`Over ${years} years`} />
          <Stat label="Total return" value={$(totalReturn)} />
          <Stat label="Net gain" value={$(totalReturn - investment)} />
        </div>
      }
    >
      <NumberField label="Initial investment" value={investment} onChange={setInvestment} suffix="$" />
      <NumberField label="Annual net income" value={annualNet} onChange={setAnnualNet} suffix="$" />
      <NumberField label="Years" value={years} onChange={setYears} />
    </ToolShell>
  );
}

export function PoolCost() {
  const [type, setType] = useState<"vinyl" | "fiberglass" | "concrete">("fiberglass");
  const [size, setSize] = useState(400);
  const base = { vinyl: 65, fiberglass: 85, concrete: 130 }[type];
  const install = base * size;
  const annual = install * 0.05;
  return (
    <ToolShell
      title="How Much Does a Pool Cost?"
      summary="Total install + maintenance estimate by pool type."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Installation" value={$(install)} />
          <Stat label="Annual upkeep" value={$(annual)} />
          <Stat label="10-year total" value={$(install + annual * 10)} />
          <Stat label="Cost per sqft" value={$(base)} />
        </div>
      }
    >
      <SelectField
        label="Pool type"
        value={type}
        onChange={setType}
        options={[
          { value: "vinyl", label: "Vinyl liner" },
          { value: "fiberglass", label: "Fiberglass" },
          { value: "concrete", label: "Concrete / Gunite" },
        ]}
      />
      <NumberField label="Surface area" value={size} onChange={setSize} suffix="sqft" />
    </ToolShell>
  );
}

export function PrivatePoolPricing() {
  const [base, setBase] = useState(60);
  const [hours, setHours] = useState(3);
  const premium = 1.4; // 40% private/adult-only premium
  const total = base * hours * premium;
  return (
    <ToolShell
      title="Private Pool Pricing"
      summary="Premium pricing for private & adult-only bookings (+40%)."
      output={
        <div className="space-y-3">
          <Stat label="Recommended price" value={$(total)} />
          <Stat label="Per-hour premium rate" value={$$(base * premium)} />
        </div>
      }
    >
      <NumberField label="Standard hourly rate" value={base} onChange={setBase} suffix="$/hr" />
      <NumberField label="Booking hours" value={hours} onChange={setHours} />
    </ToolShell>
  );
}

// ===========================================================
// HEATING / ENERGY / WATER
// ===========================================================

export function PoolHeatingCost() {
  const [gallons, setGallons] = useState(20000);
  const [type, setType] = useState<"gas" | "heat-pump" | "solar" | "electric">("gas");
  const [months, setMonths] = useState(6);
  // BTUs per gallon per °F = 8.33; raise 15°F average
  const rates = { gas: 0.025, "heat-pump": 0.012, solar: 0.002, electric: 0.04 };
  const monthly = gallons * rates[type] * 30;
  const seasonal = monthly * months;
  return (
    <ToolShell
      title="Pool Heating Cost Calculator"
      summary="Monthly & seasonal heating cost by heater type."
      output={
        <div className="space-y-3">
          <Stat label="Per month" value={$(monthly)} />
          <Stat label="Season total" value={$(seasonal)} hint={`${months} months`} />
        </div>
      }
    >
      <NumberField label="Pool volume" value={gallons} onChange={setGallons} suffix="gal" />
      <SelectField
        label="Heater type"
        value={type}
        onChange={setType}
        options={[
          { value: "gas", label: "Natural gas" },
          { value: "heat-pump", label: "Heat pump" },
          { value: "solar", label: "Solar" },
          { value: "electric", label: "Electric resistance" },
        ]}
      />
      <NumberField label="Months heated per year" value={months} onChange={setMonths} />
    </ToolShell>
  );
}

export function PoolMaintenanceCost() {
  const [gallons, setGallons] = useState(20000);
  const [pro, setPro] = useState(true);
  const chemicals = (gallons / 1000) * 4;
  const service = pro ? 160 : 0;
  const monthly = chemicals + service + 25; // 25 = filter/parts amortized
  return (
    <ToolShell
      title="Pool Maintenance Cost Calculator"
      summary="Realistic monthly upkeep budget."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Monthly" value={$(monthly)} />
          <Stat label="Annual" value={$(monthly * 12)} />
          <Stat label="Chemicals" value={$(chemicals)} />
          <Stat label="Service" value={$(service)} />
        </div>
      }
    >
      <NumberField label="Pool volume" value={gallons} onChange={setGallons} suffix="gal" />
      <SelectField
        label="Service type"
        value={pro ? "pro" : "diy"}
        onChange={(v) => setPro(v === "pro")}
        options={[
          { value: "diy", label: "DIY" },
          { value: "pro", label: "Pro service (weekly)" },
        ]}
      />
    </ToolShell>
  );
}

export function PoolChemicalCost() {
  const [gallons, setGallons] = useState(20000);
  const monthly = (gallons / 1000) * 4;
  return (
    <ToolShell
      title="Pool Chemical Cost Calculator"
      summary="Chlorine, pH, alkalinity, shock & algaecide budget."
      output={
        <div className="space-y-3">
          <Stat label="Monthly" value={$(monthly)} />
          <Stat label="Annual" value={$(monthly * 12)} />
          <Stat label="Per swim day" value={$$(monthly / 30)} />
        </div>
      }
    >
      <NumberField label="Pool volume" value={gallons} onChange={setGallons} suffix="gal" />
    </ToolShell>
  );
}

export function PoolWaterUsage() {
  const [gallons, setGallons] = useState(20000);
  const [pricePer1000, setPricePer1000] = useState(8);
  const fillCost = (gallons / 1000) * pricePer1000;
  const annualLoss = gallons * 0.25; // 25% to evap/splash
  return (
    <ToolShell
      title="Pool Water Usage Calculator"
      summary="Annual water cost from refill + evaporation."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Initial fill" value={$(fillCost)} />
          <Stat label="Annual top-off" value={$((annualLoss / 1000) * pricePer1000)} />
          <Stat label="Water used / yr" value={`${num(annualLoss)} gal`} />
        </div>
      }
    >
      <NumberField label="Pool volume" value={gallons} onChange={setGallons} suffix="gal" />
      <NumberField label="Water cost per 1,000 gal" value={pricePer1000} onChange={setPricePer1000} suffix="$" />
    </ToolShell>
  );
}

export function PoolPumpCost() {
  const [watts, setWatts] = useState(1500);
  const [hours, setHours] = useState(8);
  const [rate, setRate] = useState(0.16);
  const dailyKwh = (watts / 1000) * hours;
  const monthlyCost = dailyKwh * 30 * rate;
  return (
    <ToolShell
      title="Pool Pump Energy Cost"
      summary="Monthly electricity for your pool pump."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Per day" value={$$(dailyKwh * rate)} />
          <Stat label="Per month" value={$(monthlyCost)} />
          <Stat label="Per year" value={$(monthlyCost * 12)} />
        </div>
      }
    >
      <NumberField label="Pump wattage" value={watts} onChange={setWatts} suffix="W" />
      <NumberField label="Hours run per day" value={hours} onChange={setHours} />
      <NumberField label="Electricity rate" value={rate} onChange={setRate} suffix="$/kWh" step={0.01} />
    </ToolShell>
  );
}

export function PoolFillCost() {
  const [gallons, setGallons] = useState(20000);
  const [pricePer1000, setPricePer1000] = useState(8);
  const [gpm, setGpm] = useState(10);
  const cost = (gallons / 1000) * pricePer1000;
  const hours = gallons / gpm / 60;
  return (
    <ToolShell
      title="Pool Fill Cost Calculator"
      summary="Cost and time to fill from a garden hose."
      output={
        <div className="space-y-3">
          <Stat label="Cost" value={$(cost)} />
          <Stat label="Time to fill" value={`${num(hours, 1)} hours`} />
        </div>
      }
    >
      <NumberField label="Pool volume" value={gallons} onChange={setGallons} suffix="gal" />
      <NumberField label="Water cost per 1,000 gal" value={pricePer1000} onChange={setPricePer1000} suffix="$" />
      <NumberField label="Hose flow rate" value={gpm} onChange={setGpm} suffix="gpm" />
    </ToolShell>
  );
}

export function PoolHeatingTime() {
  const [gallons, setGallons] = useState(20000);
  const [riseF, setRiseF] = useState(15);
  const [btu, setBtu] = useState(250000);
  // hours = (gal × 8.33 × ΔF) / btu/hr
  const hours = (gallons * 8.33 * riseF) / btu;
  return (
    <ToolShell
      title="Pool Heating Time Calculator"
      summary="Estimated hours to heat your pool."
      output={
        <div className="space-y-3">
          <Stat label="Hours to heat" value={num(hours, 1)} />
          <Stat label="Days (24h run)" value={num(hours / 24, 1)} />
        </div>
      }
    >
      <NumberField label="Pool volume" value={gallons} onChange={setGallons} suffix="gal" />
      <NumberField label="Temperature rise" value={riseF} onChange={setRiseF} suffix="°F" />
      <NumberField label="Heater output" value={btu} onChange={setBtu} suffix="BTU/hr" />
    </ToolShell>
  );
}

export function PoolEvaporation() {
  const [sqft, setSqft] = useState(450);
  const [ratePerDay, setRatePerDay] = useState(0.25); // inches/day
  const [pricePer1000, setPricePer1000] = useState(8);
  const dailyGal = sqft * (ratePerDay / 12) * 7.48;
  const monthlyCost = (dailyGal * 30 / 1000) * pricePer1000;
  return (
    <ToolShell
      title="Pool Evaporation Calculator"
      summary="Daily water lost to evaporation + refill cost."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Daily loss" value={`${num(dailyGal)} gal`} />
          <Stat label="Monthly refill cost" value={$(monthlyCost)} />
        </div>
      }
    >
      <NumberField label="Surface area" value={sqft} onChange={setSqft} suffix="sqft" />
      <NumberField label="Evaporation rate" value={ratePerDay} onChange={setRatePerDay} suffix="in/day" step={0.05} />
      <NumberField label="Water cost per 1,000 gal" value={pricePer1000} onChange={setPricePer1000} suffix="$" />
    </ToolShell>
  );
}

export function PoolVolume() {
  const [shape, setShape] = useState<PoolShape>("rectangle");
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(15);
  const [depth, setDepth] = useState(5);
  const gal = poolGallons({ shape, length, width, depth });
  return (
    <ToolShell
      title="Pool Volume Calculator"
      summary="Calculate exactly how many gallons of water your pool holds."
      output={
        <div className="space-y-3">
          <Stat label="Volume" value={`${num(gal)} gal`} />
          <Stat label="Cubic feet" value={num(gal / 7.48)} />
          <Stat label="Liters" value={num(gal * 3.785)} />
        </div>
      }
    >
      <SelectField
        label="Pool shape"
        value={shape}
        onChange={setShape}
        options={[
          { value: "rectangle", label: "Rectangle" },
          { value: "round", label: "Round" },
          { value: "oval", label: "Oval" },
        ]}
      />
      <NumberField label={shape === "round" ? "Diameter" : "Length"} value={length} onChange={setLength} suffix="ft" />
      {shape !== "round" && <NumberField label="Width" value={width} onChange={setWidth} suffix="ft" />}
      <NumberField label="Average depth" value={depth} onChange={setDepth} suffix="ft" />
    </ToolShell>
  );
}

export function PoolDeckSize() {
  const [length, setLength] = useState(30);
  const [width, setWidth] = useState(15);
  const perimeter = 2 * (length + width);
  const minDeck = perimeter * 4;
  const idealDeck = perimeter * 6;
  return (
    <ToolShell
      title="Pool Deck Size Calculator"
      summary="Recommended deck area for safe walkways and lounging."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Minimum deck" value={`${num(minDeck)} sqft`} hint="4 ft border" />
          <Stat label="Ideal deck" value={`${num(idealDeck)} sqft`} hint="6 ft border + lounge" />
        </div>
      }
    >
      <NumberField label="Pool length" value={length} onChange={setLength} suffix="ft" />
      <NumberField label="Pool width" value={width} onChange={setWidth} suffix="ft" />
    </ToolShell>
  );
}

export function PoolPartyCapacity() {
  const [poolSqft, setPoolSqft] = useState(450);
  const [deckSqft, setDeckSqft] = useState(800);
  const inWater = Math.floor(poolSqft / 25);
  const onDeck = Math.floor(deckSqft / 15);
  return (
    <ToolShell
      title="Pool Party Capacity"
      summary="Safe combined capacity for swimmers + deck guests."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="In water" value={`${inWater}`} />
          <Stat label="On deck" value={`${onDeck}`} />
          <Stat label="Total comfortable" value={`${inWater + onDeck} guests`} />
        </div>
      }
    >
      <NumberField label="Pool surface area" value={poolSqft} onChange={setPoolSqft} suffix="sqft" />
      <NumberField label="Deck area" value={deckSqft} onChange={setDeckSqft} suffix="sqft" />
    </ToolShell>
  );
}

export function PoolShade() {
  const [poolSqft, setPoolSqft] = useState(450);
  const recommended = Math.round(poolSqft * 0.4);
  return (
    <ToolShell
      title="Pool Shade Calculator"
      summary="Aim for 30-50% shade for guest comfort and safety."
      output={
        <div className="space-y-3">
          <Stat label="Recommended shade" value={`${num(recommended)} sqft`} hint="40% of pool/deck area" />
          <Stat label="Minimum (30%)" value={`${num(poolSqft * 0.3)} sqft`} />
          <Stat label="Maximum useful (50%)" value={`${num(poolSqft * 0.5)} sqft`} />
        </div>
      }
    >
      <NumberField label="Pool + deck area" value={poolSqft} onChange={setPoolSqft} suffix="sqft" />
    </ToolShell>
  );
}

export function PoolChemicalDose() {
  const [gallons, setGallons] = useState(20000);
  const [chem, setChem] = useState<"chlorine" | "shock" | "algaecide">("chlorine");
  // very rough common doses
  const doses = {
    chlorine: { amt: (gallons / 10000) * 1.6, unit: "oz of liquid chlorine (12.5%)" },
    shock: { amt: (gallons / 10000) * 1.0, unit: "lb of cal-hypo shock" },
    algaecide: { amt: (gallons / 10000) * 6, unit: "oz of algaecide 60%" },
  };
  const d = doses[chem];
  return (
    <ToolShell
      title="Pool Chemical Dose Calculator"
      summary="Standard maintenance doses by chemical."
      output={
        <div className="space-y-3">
          <Stat label="Recommended dose" value={num(d.amt, 1)} hint={d.unit} />
          <p className="text-xs text-muted-foreground">Always follow product label and re-test 1 hour after dosing.</p>
        </div>
      }
    >
      <NumberField label="Pool volume" value={gallons} onChange={setGallons} suffix="gal" />
      <SelectField
        label="Chemical"
        value={chem}
        onChange={setChem}
        options={[
          { value: "chlorine", label: "Liquid chlorine (daily)" },
          { value: "shock", label: "Shock (weekly)" },
          { value: "algaecide", label: "Algaecide (weekly)" },
        ]}
      />
    </ToolShell>
  );
}

// ===========================================================
// GENERATORS — printable docs
// ===========================================================

function PrintBox({ title, content }: { title: string; content: string }) {
  const { copied, copy } = useCopy();
  const download = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => copy(content)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary">
          <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
        </button>
        <button onClick={download} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary">
          <Download className="h-3 w-3" /> Download
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary">
          Print
        </button>
      </div>
      <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-xs leading-relaxed text-foreground">
        {content}
      </pre>
    </div>
  );
}

export function PoolLiabilityWaiver() {
  const [hostName, setHostName] = useState("");
  const [address, setAddress] = useState("");
  const content = `POOL RENTAL LIABILITY WAIVER & RELEASE

Host: ${hostName || "[HOST NAME]"}
Property: ${address || "[POOL ADDRESS]"}

In consideration of being permitted to use the swimming pool and related facilities, the undersigned ("Guest") agrees as follows:

1. ASSUMPTION OF RISK. Guest acknowledges that swimming and pool use involve inherent risks including drowning, slip-and-fall, diving injuries, and health risks. Guest assumes all such risks.

2. RELEASE. Guest releases ${hostName || "the Host"}, the property owner, and their agents from any and all claims, damages, or causes of action arising from pool use.

3. NO LIFEGUARD. Guest acknowledges NO lifeguard is on duty. Adults must supervise children at all times.

4. RULES. Guest agrees to follow all posted pool rules.

5. INDEMNITY. Guest agrees to indemnify and hold harmless the Host for any claims by Guest or Guest's invitees.

6. SOUND MIND. Guest is of legal age, sound mind, and signs voluntarily.

Guest Name (printed): ____________________________

Signature: ____________________________   Date: __________

Emergency Contact: ____________________________   Phone: ____________`;
  return (
    <ToolShell
      title="Pool Liability Waiver Generator"
      summary="Print-ready waiver. Have every guest sign before swimming."
      output={<PrintBox title="Liability Waiver" content={content} />}
    >
      <TextField label="Host / Business name" value={hostName} onChange={setHostName} />
      <TextField label="Pool address" value={address} onChange={setAddress} />
    </ToolShell>
  );
}

export function PoolRules() {
  const [poolName, setPoolName] = useState("");
  const content = `POOL RULES${poolName ? `\n${poolName}\n` : ""}

✦ NO LIFEGUARD ON DUTY — Swim at your own risk
✦ Children under 14 must be accompanied by an adult
✦ NO running, pushing, or rough play on the deck
✦ NO diving in the shallow end
✦ NO glass containers in the pool area
✦ NO pets in or near the pool
✦ Shower before entering the pool
✦ NO swimming during thunderstorms
✦ Maximum capacity: posted at gate
✦ Alcohol use: at your own risk — designated driver required
✦ Clean up after yourself before leaving

In case of emergency, call 911.`;
  return (
    <ToolShell
      title="Pool Rules Generator"
      summary="Printable pool rules sign — laminate and post by the gate."
      output={<PrintBox title="Pool Rules" content={content} />}
    >
      <TextField label="Pool name (optional)" value={poolName} onChange={setPoolName} />
    </ToolShell>
  );
}

export function PoolGuestAgreement() {
  const [hostName, setHostName] = useState("");
  const [rate, setRate] = useState(75);
  const [maxGuests, setMaxGuests] = useState(15);
  const content = `POOL RENTAL GUEST AGREEMENT

This agreement is between ${hostName || "[HOST]"} ("Host") and the Renter named below.

1. RENTAL TERMS
   Rate: $${rate}/hour
   Maximum guests: ${maxGuests}
   Booking date & time: __________________

2. ARRIVAL & DEPARTURE
   Renter agrees to arrive no earlier and depart no later than the booked window.

3. AMENITIES
   Restroom access: ☐ Yes ☐ No
   Music allowed: ☐ Yes ☐ Until 9pm
   Pets: ☐ No ☐ Approved in advance

4. GUEST CONDUCT
   Renter is responsible for the conduct of all guests, including damage and noise complaints.

5. DAMAGE & CLEAN-UP
   Renter agrees to leave the pool area in the condition it was found. Damage will be billed at cost.

6. CANCELLATION
   ☐ 24 hours: full refund   ☐ <24 hours: 50% refund   ☐ No-show: no refund

7. WAIVER
   Renter and all guests must sign the attached liability waiver before pool use.

Renter Name: ____________________________

Signature: ____________________________   Date: __________`;
  return (
    <ToolShell
      title="Pool Guest Agreement Builder"
      summary="Comprehensive rental agreement covering rates, conduct, damage, and cancellation."
      output={<PrintBox title="Guest Agreement" content={content} />}
    >
      <TextField label="Host name" value={hostName} onChange={setHostName} />
      <NumberField label="Hourly rate" value={rate} onChange={setRate} suffix="$/hr" />
      <NumberField label="Max guests" value={maxGuests} onChange={setMaxGuests} />
    </ToolShell>
  );
}

export function PoolWifiQR() {
  const [ssid, setSsid] = useState("Pool-Guest");
  const [pw, setPw] = useState("");
  const wifiStr = `WIFI:T:WPA;S:${ssid};P:${pw};;`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wifiStr)}`;
  return (
    <ToolShell
      title="Pool WiFi QR Generator"
      summary="Print this QR code so guests join your WiFi without typing the password."
      output={
        <div className="flex flex-col items-center gap-3">
          {pw && ssid ? <img src={qr} alt="WiFi QR" className="rounded-xl bg-white p-3" /> : <p className="text-sm text-muted-foreground">Enter SSID and password to generate.</p>}
          <p className="text-xs text-muted-foreground">{ssid}</p>
        </div>
      }
    >
      <TextField label="WiFi network name (SSID)" value={ssid} onChange={setSsid} />
      <TextField label="Password" value={pw} onChange={setPw} />
    </ToolShell>
  );
}

export function PoolWelcomeSign() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("Have an amazing time. Towels in the cabana, drinks in the cooler.");
  const content = `WELCOME${name ? ` TO ${name.toUpperCase()}` : ""}!

${msg}

⚐ WiFi: see QR code at gate
⚐ Restroom: through the side door
⚐ Towels: in the cabana
⚐ Trash: blue bin by the gate
⚐ Emergency: 911 — address posted on fridge

Please leave the area as you found it.
Thank you & enjoy your swim!`;
  return (
    <ToolShell
      title="Pool Welcome Sign Generator"
      summary="Print, frame, and place at the gate so guests feel right at home."
      output={<PrintBox title="Welcome Sign" content={content} />}
    >
      <TextField label="Property name (optional)" value={name} onChange={setName} />
      <TextField label="Welcome message" value={msg} onChange={setMsg} multiline />
    </ToolShell>
  );
}

// ===========================================================
// CHECKLISTS
// ===========================================================

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-3 rounded-lg bg-background/60 p-3">
          <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border accent-primary" />
          <span className="text-sm text-foreground">{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function PoolSafetyChecklist() {
  const items = [
    "Self-latching gate with working lock (4ft+ height)",
    "Posted pool rules sign visible from entry",
    "U.S. Coast Guard-approved life ring within 25 ft of pool",
    "Reaching pole (10ft+) accessible at poolside",
    "First-aid kit fully stocked and visible",
    "Emergency phone or charged phone within reach",
    "Posted emergency address & 911 instructions",
    "Anti-entrapment drain covers installed (VGB compliant)",
    "Pool depth markers visible at every change",
    "Non-slip surface in walkways and steps",
    "Working pool lights for evening bookings",
    "All chemicals stored in locked cabinet, away from sun",
    "CPR-certified host or signage with CPR steps posted",
    "Liability waiver signed by every adult guest",
  ];
  return (
    <ToolShell
      title="Pool Safety Checklist"
      summary="Pre-booking safety audit. Complete every booking."
      output={<Checklist items={items} />}
    >
      <p className="text-sm text-muted-foreground">Review each item before guest arrival. Save or print this checklist for your records.</p>
    </ToolShell>
  );
}

export function PoolHostChecklist() {
  const items = [
    "Skim leaves and surface debris",
    "Brush walls and tile",
    "Vacuum or run robotic cleaner",
    "Empty skimmer and pump baskets",
    "Test water (FC, pH, alkalinity, CYA)",
    "Adjust chemicals as needed",
    "Run pump for at least 1 hour pre-arrival",
    "Set heater to target temp if applicable",
    "Wipe down deck furniture",
    "Restock towels (2 per guest minimum)",
    "Refill drinking water cooler",
    "Empty trash bins",
    "Clean restroom & restock supplies",
    "Test pool lights and sound system",
    "Confirm WiFi is on and post QR sign",
    "Send guest 'arriving soon' message with gate code",
  ];
  return (
    <ToolShell
      title="Pool Host Checklist"
      summary="Run through this list before every booking arrival."
      output={<Checklist items={items} />}
    >
      <p className="text-sm text-muted-foreground">Tip: complete the bottom 6 items 30 min before guest arrival.</p>
    </ToolShell>
  );
}

export function HOARiskChecker() {
  const items = [
    "Check current HOA bylaws for short-term rental clauses",
    "Verify if 'pool rental' is treated separately from short-term lodging",
    "Confirm guest count limits in CC&Rs",
    "Note quiet hours and noise enforcement rules",
    "Identify parking restrictions for guests",
    "Document any prior HOA complaints in the area",
    "Get neighbor sign-off in writing if possible",
    "Consider adding daytime-only restrictions on your listing",
    "Confirm insurance covers commercial use of pool",
    "Plan for limited bookings during HOA meetings or events",
  ];
  return (
    <ToolShell
      title="HOA Risk Checker"
      summary="Self-audit your HOA risk before publishing your listing."
      output={<Checklist items={items} />}
    >
      <p className="text-sm text-muted-foreground">Need legal templates? Check the <a href="https://www.poolrentalnearme.com/p/hoa-pool-rental-defense-kit" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">HOA Defense Kit</a>.</p>
    </ToolShell>
  );
}

// ===========================================================
// PLANNERS
// ===========================================================

export function PoolCleaningSchedule() {
  const daily = ["Skim surface", "Empty skimmer baskets", "Test FC and pH"];
  const weekly = ["Brush walls and tile", "Vacuum pool", "Shock if needed", "Test full chemistry panel"];
  const monthly = ["Clean filter", "Inspect equipment", "Check water level", "Lube o-rings"];
  return (
    <ToolShell
      title="Pool Cleaning Schedule"
      summary="A repeatable schedule to keep your pool guest-ready."
      output={
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Daily</h4>
            <Checklist items={daily} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Weekly</h4>
            <Checklist items={weekly} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Monthly</h4>
            <Checklist items={monthly} />
          </div>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">Print this schedule and stick it in your equipment shed.</p>
    </ToolShell>
  );
}

export function SocialMediaCalendar() {
  const days = Array.from({ length: 30 }, (_, i) => {
    const themes = ["Behind-the-scenes pool prep", "Guest review highlight", "Amenity spotlight", "Local event tie-in", "Time-lapse cleaning", "Pool party recap", "Owner Q&A"];
    return { day: i + 1, theme: themes[i % themes.length] };
  });
  return (
    <ToolShell
      title="Social Media Content Calendar"
      summary="30-day rotating posting schedule across themes that convert."
      output={
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {days.map((d) => (
            <div key={d.day} className="rounded-lg bg-background/60 p-3">
              <div className="text-xs font-bold text-primary">Day {d.day}</div>
              <div className="text-xs text-foreground">{d.theme}</div>
            </div>
          ))}
        </div>
      }
    >
      <p className="text-sm text-muted-foreground">Use the AI generators on this site to write captions for each theme.</p>
    </ToolShell>
  );
}

export function BirthdayPartyPlanner() {
  const [guests, setGuests] = useState(15);
  const [hours, setHours] = useState(3);
  const food = guests * 12;
  const decor = 60;
  const supplies = guests * 4;
  const cake = 45;
  const venue = hours * 80;
  const total = food + decor + supplies + cake + venue;
  return (
    <ToolShell
      title="Birthday Party Planner"
      summary="Budget breakdown for a backyard pool birthday party."
      output={
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total budget" value={$(total)} />
          <Stat label="Per guest" value={$$(total / guests)} />
          <Stat label="Food" value={$(food)} />
          <Stat label="Pool venue" value={$(venue)} />
          <Stat label="Cake" value={$(cake)} />
          <Stat label="Decor & supplies" value={$(decor + supplies)} />
        </div>
      }
    >
      <NumberField label="Number of guests" value={guests} onChange={setGuests} />
      <NumberField label="Party hours" value={hours} onChange={setHours} />
    </ToolShell>
  );
}

// ===========================================================
// REVENUE EXPANSION
// ===========================================================

export function BackyardIncome() {
  const [pool, setPool] = useState(2200);
  const [events, setEvents] = useState(900);
  const [parking, setParking] = useState(150);
  const [storage, setStorage] = useState(0);
  const monthly = pool + events + parking + storage;
  return (
    <ToolShell
      title="Backyard Income Calculator"
      summary="Total monthly earning potential from all backyard streams."
      output={
        <div className="space-y-3">
          <Stat label="Monthly" value={$(monthly)} />
          <Stat label="Yearly" value={$(monthly * 12)} />
        </div>
      }
    >
      <NumberField label="Pool rental income" value={pool} onChange={setPool} suffix="$/mo" />
      <NumberField label="Event hosting" value={events} onChange={setEvents} suffix="$/mo" />
      <NumberField label="Parking / storage rental" value={parking} onChange={setParking} suffix="$/mo" />
      <NumberField label="Other (filming, photoshoots)" value={storage} onChange={setStorage} suffix="$/mo" />
    </ToolShell>
  );
}

export function BackyardMonetization() {
  return BackyardIncome();
}

export function EventProfit() {
  const [revenue, setRevenue] = useState(800);
  const [costs, setCosts] = useState(180);
  const profit = revenue - costs;
  const margin = (profit / revenue) * 100;
  return (
    <ToolShell
      title="Event Profit Calculator"
      summary="Net profit and margin per event."
      output={
        <div className="space-y-3">
          <Stat label="Profit" value={$(profit)} />
          <Stat label="Margin" value={`${num(margin, 1)}%`} />
        </div>
      }
    >
      <NumberField label="Event revenue" value={revenue} onChange={setRevenue} suffix="$" />
      <NumberField label="Event costs (cleanup, supplies)" value={costs} onChange={setCosts} suffix="$" />
    </ToolShell>
  );
}

export function SwimLessonPricing() {
  const [exp, setExp] = useState<"new" | "certified" | "expert">("certified");
  const base = { new: 35, certified: 60, expert: 90 }[exp];
  return (
    <ToolShell
      title="Swim Lesson Pricing Tool"
      summary="Recommended hourly rate for private swim lessons."
      output={
        <div className="space-y-3">
          <Stat label="Recommended rate" value={$$(base) + "/hr"} />
          <Stat label="Group of 3 rate" value={$$(base * 1.8) + "/hr"} />
          <Stat label="Package of 8 lessons" value={$(base * 8 * 0.9)} hint="10% discount" />
        </div>
      }
    >
      <SelectField
        label="Instructor experience"
        value={exp}
        onChange={setExp}
        options={[
          { value: "new", label: "New (no certification)" },
          { value: "certified", label: "WSI / Red Cross certified" },
          { value: "expert", label: "Coach or 5+ years experience" },
        ]}
      />
    </ToolShell>
  );
}

export function BackyardEventPricing() {
  const [hours, setHours] = useState(4);
  const [guests, setGuests] = useState(30);
  const baseRate = 80;
  const perGuest = 6;
  const total = hours * baseRate + guests * perGuest;
  return (
    <ToolShell
      title="Backyard Event Pricing"
      summary="Pricing for backyard events (parties, photoshoots, gatherings)."
      output={
        <div className="space-y-3">
          <Stat label="Recommended price" value={$(total)} />
          <Stat label="Per guest" value={$$(total / guests)} />
        </div>
      }
    >
      <NumberField label="Event hours" value={hours} onChange={setHours} />
      <NumberField label="Guests" value={guests} onChange={setGuests} />
    </ToolShell>
  );
}

export function PoolRentalProfit() {
  const [revenue, setRevenue] = useState(3000);
  const [maint, setMaint] = useState(400);
  const [util, setUtil] = useState(180);
  const [insurance, setInsurance] = useState(120);
  const [platform, setPlatform] = useState(15);
  const platformFee = revenue * (platform / 100);
  const net = revenue - maint - util - insurance - platformFee;
  return (
    <ToolShell
      title="Pool Rental Profit Calculator"
      summary="Monthly net profit after all operating costs."
      output={
        <div className="space-y-3">
          <Stat label="Net profit" value={$(net)} />
          <Stat label="Margin" value={`${num((net / revenue) * 100, 1)}%`} />
          <Stat label="Yearly net" value={$(net * 12)} />
        </div>
      }
    >
      <NumberField label="Monthly revenue" value={revenue} onChange={setRevenue} suffix="$" />
      <NumberField label="Maintenance" value={maint} onChange={setMaint} suffix="$" />
      <NumberField label="Utilities (water, gas, electric)" value={util} onChange={setUtil} suffix="$" />
      <NumberField label="Insurance" value={insurance} onChange={setInsurance} suffix="$" />
      <NumberField label="Platform fee" value={platform} onChange={setPlatform} suffix="%" />
    </ToolShell>
  );
}

export function NoiseDistance() {
  const [decibels, setDecibels] = useState(75);
  const [distance, setDistance] = useState(50);
  // 6dB drop per doubling of distance
  const atDistance = decibels - 20 * Math.log10(distance / 1);
  const safe = atDistance < 55;
  return (
    <ToolShell
      title="Noise Distance Calculator"
      summary="Predicted noise level at your property line."
      output={
        <div className="space-y-3">
          <Stat label="Sound at property line" value={`${num(atDistance, 0)} dB`} />
          <div className={`rounded-lg p-3 text-sm ${safe ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-destructive/10 text-destructive"}`}>
            {safe ? "✓ Likely under typical residential limits (55 dB)" : "⚠ Over typical residential limits — adjust or set quiet hours"}
          </div>
        </div>
      }
    >
      <NumberField label="Source noise level" value={decibels} onChange={setDecibels} suffix="dB" />
      <NumberField label="Distance to property line" value={distance} onChange={setDistance} suffix="ft" />
    </ToolShell>
  );
}

export function Seasonality() {
  const [region, setRegion] = useState<"south" | "west" | "midwest" | "northeast">("south");
  const months: Record<string, string[]> = {
    south: ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    west: ["May", "Jun", "Jul", "Aug", "Sep"],
    midwest: ["Jun", "Jul", "Aug"],
    northeast: ["Jun", "Jul", "Aug", "Sep"],
  };
  const list = months[region];
  return (
    <ToolShell
      title="Seasonality Calculator"
      summary="Best months to rent your pool by climate region."
      output={
        <div className="space-y-3">
          <Stat label="Active season" value={`${list.length} months`} hint={list.join(" · ")} />
          <Stat label="Peak demand" value={list.slice(Math.floor(list.length / 2) - 1, Math.floor(list.length / 2) + 2).join(", ")} />
        </div>
      }
    >
      <SelectField
        label="Region"
        value={region}
        onChange={setRegion}
        options={[
          { value: "south", label: "South (FL, TX, AZ, GA)" },
          { value: "west", label: "West (CA, NV, OR)" },
          { value: "midwest", label: "Midwest" },
          { value: "northeast", label: "Northeast" },
        ]}
      />
    </ToolShell>
  );
}

// ===========================================================
// GUIDE / SCORE TOOLS
// ===========================================================

export function PoolListingScore() {
  const [photos, setPhotos] = useState(true);
  const [description, setDescription] = useState(true);
  const [pricing, setPricing] = useState(true);
  const [amenities, setAmenities] = useState(true);
  const [reviews, setReviews] = useState(false);
  const score = (photos ? 25 : 0) + (description ? 25 : 0) + (pricing ? 15 : 0) + (amenities ? 20 : 0) + (reviews ? 15 : 0);
  return (
    <ToolShell
      title="Pool Listing Score"
      summary="Grade your listing across the 5 conversion factors."
      output={
        <div className="space-y-3">
          <Stat label="Score" value={`${score} / 100`} hint={score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs work"} />
          <p className="text-xs text-muted-foreground">Top fix: {!photos ? "Add 8+ high-quality photos" : !description ? "Write a 200+ word description" : !amenities ? "List all amenities" : !reviews ? "Get your first 3 reviews" : "Optimize pricing"}</p>
        </div>
      }
    >
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={photos} onChange={(e) => setPhotos(e.target.checked)} /> 8+ high-quality photos</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={description} onChange={(e) => setDescription(e.target.checked)} /> 200+ word description</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pricing} onChange={(e) => setPricing(e.target.checked)} /> Competitive local pricing</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={amenities} onChange={(e) => setAmenities(e.target.checked)} /> All amenities listed</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reviews} onChange={(e) => setReviews(e.target.checked)} /> 3+ guest reviews</label>
    </ToolShell>
  );
}

export function PoolRentalPriceIndex() {
  const [city, setCity] = useState("Los Angeles");
  // simple mock index; in real world you'd query data
  const map: Record<string, { low: number; avg: number; high: number }> = {
    "Los Angeles": { low: 50, avg: 75, high: 125 },
    Phoenix: { low: 40, avg: 60, high: 95 },
    Miami: { low: 60, avg: 90, high: 150 },
    Houston: { low: 35, avg: 55, high: 90 },
    "San Diego": { low: 55, avg: 80, high: 130 },
  };
  const data = map[city] || { low: 40, avg: 65, high: 100 };
  return (
    <ToolShell
      title="Pool Rental Price Index"
      summary="Median hourly rates by city."
      output={
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Low" value={$$(data.low) + "/hr"} />
          <Stat label="Average" value={$$(data.avg) + "/hr"} />
          <Stat label="High" value={$$(data.high) + "/hr"} />
        </div>
      }
    >
      <SelectField
        label="City"
        value={city}
        onChange={setCity}
        options={[
          { value: "Los Angeles", label: "Los Angeles, CA" },
          { value: "Phoenix", label: "Phoenix, AZ" },
          { value: "Miami", label: "Miami, FL" },
          { value: "Houston", label: "Houston, TX" },
          { value: "San Diego", label: "San Diego, CA" },
        ]}
      />
    </ToolShell>
  );
}

// ===========================================================
// AI TOOLS — wired to Lovable AI Gateway
// ===========================================================

function AiPanel({
  toolSlug,
  placeholder,
  cta = "Generate",
}: {
  toolSlug: "host-marketing-engine" | "pool-listing-ai-writer" | "review-response-generator" | "email-sms-campaigns" | "pool-host-pricing-ai" | "pool-water-chemistry";
  placeholder: string;
  cta?: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy, copied } = useCopy();

  const onSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult("");
    try {
      const res = await runAiTool({ data: { tool: toolSlug, prompt } });
      setResult(res.content || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <button
        onClick={onSubmit}
        disabled={loading || !prompt.trim()}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? "Generating..." : cta}
      </button>
      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {result && (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary-glow/5 p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">AI Output</h3>
            <button onClick={() => copy(result)} className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs hover:bg-secondary">
              <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{result}</pre>
        </div>
      )}
    </div>
  );
}

export function HostMarketingEngine() {
  return (
    <ToolShell
      title="Host Marketing Engine"
      summary="Generate flyers, social posts, DM scripts, and full marketing campaigns instantly with AI."
    >
      <AiPanel
        toolSlug="host-marketing-engine"
        placeholder="Describe your pool: 'Heated saltwater pool in Scottsdale AZ, 30x15 with hot tub, capacity 15. Target market: families and birthday parties.'"
        cta="Generate marketing kit"
      />
    </ToolShell>
  );
}

export function PoolListingAIWriter() {
  return (
    <ToolShell
      title="Pool Listing AI Writer"
      summary="Generate optimized titles, a 200-word description, and 8 photo tips."
    >
      <AiPanel
        toolSlug="pool-listing-ai-writer"
        placeholder="Tell me about your pool: location, size, depth, amenities (heater, hot tub, slide), and ideal guest type."
        cta="Write my listing"
      />
    </ToolShell>
  );
}

export function ReviewResponseGenerator() {
  return (
    <ToolShell
      title="Review Response Generator"
      summary="Paste a guest review — get a professional, brand-safe reply."
    >
      <AiPanel
        toolSlug="review-response-generator"
        placeholder="Paste the guest review here..."
        cta="Write reply"
      />
    </ToolShell>
  );
}

export function EmailSmsCampaigns() {
  return (
    <ToolShell
      title="Email & SMS Campaign Builder"
      summary="Generate drip sequences for repeat guests, seasonal promos, and referrals."
    >
      <AiPanel
        toolSlug="email-sms-campaigns"
        placeholder="Describe the campaign: e.g. '5-message email + 3 SMS for repeat guests, summer-end promo with 20% off booking.'"
        cta="Build campaign"
      />
    </ToolShell>
  );
}

export function PoolHostPricingAI() {
  return (
    <ToolShell
      title="Pool Host Pricing AI"
      summary="AI-driven pricing recommendation tailored to your pool & market."
    >
      <AiPanel
        toolSlug="pool-host-pricing-ai"
        placeholder="Pool details: location, size, amenities, current bookings/month, competitor pricing in your area."
        cta="Recommend pricing"
      />
    </ToolShell>
  );
}

export function PoolWaterChemistry() {
  return (
    <ToolShell
      title="Pool Water Chemistry Advisor"
      summary="Enter your test readings — get exact chemical doses and step-by-step instructions."
    >
      <AiPanel
        toolSlug="pool-water-chemistry"
        placeholder="Pool size: 20,000 gal. FC: 0.5 ppm. pH: 7.8. TA: 60. CYA: 20. Temp: 80°F."
        cta="Advise"
      />
    </ToolShell>
  );
}
