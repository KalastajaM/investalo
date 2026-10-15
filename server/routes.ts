
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertPropertySchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./auth";
import { scrapePropertyUrl } from "./scraper";
import { analyzePropertyInvestment } from "./analyzer";
import { analyzePropertyMarket } from "./market-analyzer";
import { authHandler } from "./middleware";
import { checkRateLimit } from "./rate-limiter";
import { assertFetchableUrl } from "./safe-fetch";

/** Property fields accepted from an export file; anything else (ids, analyses) is ignored. */
const IMPORTABLE_PROPERTY_FIELDS = [
  "name", "city", "area", "sizeM2", "buildYear", "purchasePrice", "debtFreePrice", "renovationCost",
  "rentPerMonth", "maintenanceFeePerMonth", "financeFeePerMonth", "waterFeePerMonth", "otherCostsPerMonth",
  "downPayment", "yearlyExtraMaintenance", "isFinanceFeeDeductible", "address", "rooms",
  "latitude", "longitude", "notes", "customLink",
] as const;

/** NOT NULL columns without a default; a record missing any of these cannot be imported. */
const REQUIRED_IMPORT_FIELDS = ["name", "city", "area", "sizeM2", "purchasePrice", "maintenanceFeePerMonth"] as const;

/** Validate a user-supplied URL before fetching it (see safe-fetch.ts for the connect-time checks). */
function validateFetchUrl(url: unknown): { hostname: string; href: string } | { error: string } {
  if (!url || typeof url !== "string") return { error: "url is required" };
  try {
    const parsed = assertFetchableUrl(url);
    return { hostname: parsed.hostname, href: parsed.href };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAuth(app);
  registerAuthRoutes(app);

  // All :id route params are integer primary keys; reject anything else before it reaches the DB.
  app.param("id", (req, res, next, id) => {
    if (!/^\d+$/.test(String(id))) return res.status(404).json({ message: "Not found" });
    next();
  });

  // Public config endpoint — exposes deployment feature flags to the client.
  const claudeFeatures = process.env.CLAUDE_FEATURES !== "false";
  app.get("/api/config", (_req, res) => {
    res.json({ claudeFeatures });
  });

  // === Properties ===

  app.get(api.properties.list.path, isAuthenticated, authHandler(async (userId, _req, res) => {
    const props = await storage.getProperties(userId);
    res.json(props);
  }));

  app.get(api.properties.get.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const property = await storage.getProperty(Number(req.params.id), userId);
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
  }));

  app.post(api.properties.create.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const input = api.properties.create.input.parse(req.body);
    const property = await storage.createProperty({ ...input, userId });
    res.status(201).json(property);
  }));

  app.put(api.properties.update.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const existing = await storage.getProperty(Number(req.params.id), userId);
    if (!existing) return res.status(404).json({ message: "Property not found" });
    const input = api.properties.update.input.parse(req.body);
    const property = await storage.updateProperty(Number(req.params.id), userId, input);
    res.json(property);
  }));

  app.delete(api.properties.delete.path, isAuthenticated, authHandler(async (userId, req, res) => {
    await storage.deleteProperty(Number(req.params.id), userId);
    res.status(204).send();
  }));

  app.post(api.properties.duplicate.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const duplicate = await storage.duplicateProperty(Number(req.params.id), userId);
    res.status(201).json(duplicate);
  }));

  // === Projects ===

  app.get(api.projects.list.path, isAuthenticated, authHandler(async (userId, _req, res) => {
    const projs = await storage.getProjects(userId);
    res.json(projs);
  }));

  app.get(api.projects.get.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const project = await storage.getProject(Number(req.params.id), userId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  }));

  app.post(api.projects.create.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const input = api.projects.create.input.parse(req.body);
    const project = await storage.createProject({ ...input, userId });
    res.status(201).json(project);
  }));

  app.put(api.projects.update.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const existing = await storage.getProject(Number(req.params.id), userId);
    if (!existing) return res.status(404).json({ message: "Project not found" });
    const input = api.projects.update.input.parse(req.body);
    const project = await storage.updateProject(Number(req.params.id), userId, input);
    res.json(project);
  }));

  app.delete(api.projects.delete.path, isAuthenticated, authHandler(async (userId, req, res) => {
    await storage.deleteProject(Number(req.params.id), userId);
    res.status(204).send();
  }));

  // === Settings ===

  app.get(api.settings.get.path, isAuthenticated, authHandler(async (userId, _req, res) => {
    const userSettings = await storage.getSettings(userId);
    res.json(userSettings);
  }));

  app.post(api.settings.update.path, isAuthenticated, authHandler(async (userId, req, res) => {
    const input = api.settings.update.input.parse(req.body);
    const userSettings = await storage.updateSettings(userId, input);
    res.json(userSettings);
  }));

  // === Import ===
  // Creates projects then properties from an Investalo export file.

  app.post("/api/import", isAuthenticated, authHandler(async (userId, req, res) => {
    const data = req.body;

    if (!data || data.version !== 1 || !Array.isArray(data.projects) || !Array.isArray(data.properties)) {
      return res.status(400).json({ message: "Invalid export file format or version" });
    }
    if (data.projects.length > 500 || data.properties.length > 500) {
      return res.status(400).json({ message: "Import file too large (max 500 projects and 500 properties)" });
    }

    // 1. Create projects; build exportId → new DB id map
    const projectIdMap = new Map<number, number>();
    let projectsCreated = 0;
    for (const proj of data.projects) {
      if (!proj.name) continue;
      const created = await storage.createProject({
        userId,
        name: String(proj.name),
        description: proj.description != null ? String(proj.description) : null,
      });
      if (typeof proj._exportId === "number") {
        projectIdMap.set(proj._exportId, created.id);
      }
      projectsCreated++;
    }

    // 2. Create properties; remap projectExportIds → new project ids.
    // Records that fail validation are skipped and counted rather than aborting the import.
    let propertiesCreated = 0;
    let propertiesSkipped = 0;
    for (const prop of data.properties) {
      if (!prop || typeof prop !== "object") { propertiesSkipped++; continue; }
      const projectExportIds: number[] = Array.isArray(prop.projectExportIds) ? prop.projectExportIds : [];
      const newProjectIds = projectExportIds
        .map((id: number) => projectIdMap.get(id))
        .filter((id): id is number => id !== undefined);
      // Drop null/empty values so schema defaults apply (z.coerce.string() would turn null into "null")
      const fields = Object.fromEntries(
        IMPORTABLE_PROPERTY_FIELDS
          .filter((k) => prop[k] != null && prop[k] !== "")
          .map((k) => [k, prop[k]]),
      );
      const missingRequired = REQUIRED_IMPORT_FIELDS.some((k) => !(k in fields));
      const parsed = missingRequired
        ? null
        : insertPropertySchema.safeParse({ rentPerMonth: "0", downPayment: "0", ...fields, projectIds: newProjectIds });
      if (!parsed?.success) { propertiesSkipped++; continue; }
      await storage.createProperty({ ...parsed.data, userId });
      propertiesCreated++;
    }

    res.json({ projectsCreated, propertiesCreated, propertiesSkipped });
  }));

  // === Claude Features ===
  // Property URL scraper — fetch and parse listing data from oikotie.fi, etuovi.com, etc.

  app.post("/api/scrape-property", isAuthenticated, authHandler(async (userId, req, res) => {
    if (!claudeFeatures) {
      return res.status(503).json({ message: "Claude features are disabled on this deployment." });
    }
    if (!checkRateLimit(`claude:${userId}`, 10, 60 * 60 * 1000)) {
      return res.status(429).json({ message: "Too many requests. Please wait before trying again." });
    }
    const validation = validateFetchUrl(req.body.url);
    if ("error" in validation) return res.status(400).json({ message: validation.error });

    try {
      const data = await scrapePropertyUrl(validation.href);
      res.json(data);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e.name === "TimeoutError" || e.message?.includes("timeout")) {
        return res.status(504).json({ message: "Request timed out fetching the URL" });
      }
      throw err;
    }
  }));

  // Investment analysis — fetch listing URL and evaluate against guardrails using Claude.

  app.post("/api/analyze-property", isAuthenticated, authHandler(async (userId, req, res) => {
    if (!claudeFeatures) {
      return res.status(503).json({ message: "Claude features are disabled on this deployment." });
    }
    if (!checkRateLimit(`claude:${userId}`, 10, 60 * 60 * 1000)) {
      return res.status(429).json({ message: "Too many requests. Please wait before trying again." });
    }
    const validation = validateFetchUrl(req.body.url);
    if ("error" in validation) return res.status(400).json({ message: validation.error });

    try {
      const analysis = await analyzePropertyInvestment(validation.href);
      res.json(analysis);
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e.name === "TimeoutError" || e.message?.includes("timeout")) {
        return res.status(504).json({ message: "Request timed out fetching the URL" });
      }
      throw err;
    }
  }));

  // Market analysis — assess price/rent/maintenance against local market using Claude.

  app.post("/api/properties/:id/market-analyze", isAuthenticated, authHandler(async (userId, req, res) => {
    if (!claudeFeatures) {
      return res.status(503).json({ message: "Claude features are disabled on this deployment." });
    }
    if (!checkRateLimit(`claude:${userId}`, 10, 60 * 60 * 1000)) {
      return res.status(429).json({ message: "Too many requests. Please wait before trying again." });
    }

    const propertyId = Number(req.params.id);
    const property = await storage.getProperty(propertyId, userId);
    if (!property) return res.status(404).json({ message: "Property not found" });

    // Re-validate the stored customLink before passing it to the market analyzer
    // to prevent SSRF if a private/internal URL was stored during property creation.
    const linkToAnalyze = property.customLink
      ? (() => {
          const v = validateFetchUrl(property.customLink);
          return "error" in v ? undefined : v.href;
        })()
      : undefined;

    const analysis = await analyzePropertyMarket({ ...property, customLink: linkToAnalyze ?? null });
    await storage.updateProperty(propertyId, userId, { marketAnalysis: analysis });
    res.json(analysis);
  }));

  return httpServer;
}
