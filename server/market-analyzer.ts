import Anthropic from "@anthropic-ai/sdk";
import type { Property } from "@shared/schema";
import type { MarketAnalysis } from "@shared/schema";
import { CLAUDE_MODEL, extractClaudeText, parseClaudeJson } from "./claude-utils";
import { safeFetch } from "./safe-fetch";

const SYSTEM_PROMPT = `You are a real estate market analyst. You will receive detailed property information and, optionally, content scraped from a property listing advertisement. Analyze the property against current market conditions for its specific city and district.

Use price per m² as your primary benchmark. Factor in the property's size, age, condition, rooms, location, and all other provided details.

Respond ONLY with a JSON object — no markdown, no explanation, no code fences.

JSON shape:
{
  "summary": string,
  "askingPriceAnalysis": string,
  "rentAnalysis": string,
  "offerPriceRange": { "low": number, "mid": number, "high": number },
  "marketRentEstimate": { "low": number, "mid": number, "high": number },
  "confidence": "low" | "medium" | "high"
}

Field definitions:
- summary: One paragraph covering the overall market position of this property — key strengths, weaknesses, location factors, and your overall verdict.
- askingPriceAnalysis: One paragraph assessing whether the asking price is fair, overpriced, or a bargain. Reference the typical price/m² range for this specific city and district and explain the reasoning.
- rentAnalysis: One paragraph assessing whether the listed/target monthly rent is achievable and competitive. Reference typical rent per m² for this specific city and district and explain the reasoning.
- offerPriceRange: Recommended total offer prices in the same currency as the listed prices. mid = the offer you would actually recommend making; low = floor (motivated seller / needs work); high = ceiling (strong demand / excellent condition).
- marketRentEstimate: Expected monthly rent in the same currency. mid = realistic market-rate rent; low/high = the plausible range based on condition and demand.
- confidence: "high" if you have solid data for this specific district, "medium" for general city-level knowledge, "low" if location data is limited.

All monetary values must be plain numbers (no currency symbols). Ranges must be positive.`;

async function fetchListingContent(url: string): Promise<string> {
  try {
    const res = await safeFetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RealEstateAnalyzer/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Strip tags and collapse whitespace; keep first ~4000 chars to stay within token budget
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 4000);
    return text;
  } catch {
    return "";
  }
}

export async function analyzePropertyMarket(property: Property): Promise<MarketAnalysis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment variables to use market analysis.",
    );
  }

  // Fetch listing page if a custom link was provided
  const listingContent = property.customLink ? await fetchListingContent(property.customLink) : "";

  const purchasePrice = Number(property.purchasePrice);
  const sizeM2 = Number(property.sizeM2);
  const pricePerM2 = sizeM2 > 0 ? Math.round(purchasePrice / sizeM2) : null;

  const lines: string[] = [
    `City: ${property.city}`,
    `District/Area: ${property.area}`,
    `Size: ${property.sizeM2} m²`,
    `Rooms: ${property.rooms ?? "not specified"}`,
    `Build year: ${property.buildYear ?? "not specified"}`,
    property.address ? `Address: ${property.address}` : null,
    ``,
    `Asking/purchase price: ${property.purchasePrice}`,
    pricePerM2 !== null ? `  → price/m²: ${pricePerM2}` : null,
    property.debtFreePrice && property.debtFreePrice !== property.purchasePrice
      ? `Debt-free price: ${property.debtFreePrice}`
      : null,
    `Monthly rent (listed/target): ${property.rentPerMonth}`,
    `Monthly maintenance fee: ${property.maintenanceFeePerMonth}`,
    Number(property.financeFeePerMonth) > 0
      ? `Monthly finance fee: ${property.financeFeePerMonth}`
      : null,
    Number(property.waterFeePerMonth) > 0
      ? `Monthly water fee: ${property.waterFeePerMonth}`
      : null,
    Number(property.otherCostsPerMonth) > 0
      ? `Other monthly costs: ${property.otherCostsPerMonth}`
      : null,
    `Down payment: ${property.downPayment}`,
    property.notes ? `\nNotes: ${property.notes}` : null,
    property.customLink ? `\nListing URL: ${property.customLink}` : null,
  ].filter((l): l is string => l !== null);

  const userMessage = lines.join("\n") +
    (listingContent
      ? `\n\n--- Listing advertisement content ---\n${listingContent}\n--- End of listing content ---`
      : "");

  const client = new Anthropic();
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096, // covers adaptive thinking as well as the JSON answer
    output_config: { effort: "medium" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = extractClaudeText(response);
  const d = parseClaudeJson(raw);

  const toRange = (v: unknown): { low: number; mid: number; high: number } => {
    if (v && typeof v === "object") {
      const r = v as Record<string, unknown>;
      return {
        low: typeof r.low === "number" ? r.low : 0,
        mid: typeof r.mid === "number" ? r.mid : 0,
        high: typeof r.high === "number" ? r.high : 0,
      };
    }
    return { low: 0, mid: 0, high: 0 };
  };

  const toConfidence = (v: unknown): "low" | "medium" | "high" => {
    if (v === "low" || v === "medium" || v === "high") return v;
    return "medium";
  };

  return {
    summary: typeof d.summary === "string" ? d.summary : "Unable to generate summary.",
    askingPriceAnalysis: typeof d.askingPriceAnalysis === "string" ? d.askingPriceAnalysis : "",
    rentAnalysis: typeof d.rentAnalysis === "string" ? d.rentAnalysis : "",
    offerPriceRange: toRange(d.offerPriceRange),
    marketRentEstimate: toRange(d.marketRentEstimate),
    confidence: toConfidence(d.confidence),
    analyzedAt: new Date().toISOString(),
  };
}
