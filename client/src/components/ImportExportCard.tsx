import { useRef, useState, useEffect } from "react";
import { Download, Upload, FileJson, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  buildExportData,
  buildFilename,
  downloadJson,
  readJsonFile,
  validateExportData,
  type ExportData,
} from "@/lib/importExport";
import type { Property, Project } from "@shared/schema";

interface ImportExportCardProps {
  properties: Property[];
  projects: Project[];
  isLoading?: boolean;
}

type ImportStatus = "idle" | "loading" | "preview" | "importing" | "done" | "error";

export function ImportExportCard({ properties, projects, isLoading }: ImportExportCardProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export — default to all selected; resync when properties list changes
  const [selectedExportIds, setSelectedExportIds] = useState<Set<number>>(new Set);
  useEffect(() => {
    setSelectedExportIds(prev => {
      if (prev.size === 0) return new Set(properties.map(p => p.id));
      // keep existing selection valid, add any newly created properties
      const next = new Set(Array.from(prev).filter(id => properties.some(p => p.id === id)));
      properties.forEach(p => { if (!prev.has(p.id)) next.add(p.id); });
      return next;
    });
  }, [properties]);

  const toggleExport = (id: number) =>
    setSelectedExportIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedProps = properties.filter(p => selectedExportIds.has(p.id));
  const includedProjectIds = new Set(selectedProps.flatMap(p => (p.projectIds as number[]) ?? []));
  const includedProjects = projects.filter(p => includedProjectIds.has(p.id));

  function handleExport() {
    const data = buildExportData(selectedProps, projects);
    const label =
      selectedProps.length === properties.length ? "backup" :
      selectedProps.length === 1 ? selectedProps[0].name : "selection";
    downloadJson(data, buildFilename(label));
  }

  // Import
  const [importStatus, setImportStatus] = useState<ImportStatus>("idle");
  const [importData, setImportData] = useState<ExportData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ projectsCreated: number; propertiesCreated: number; propertiesSkipped?: number } | null>(null);
  const [selectedImportIdx, setSelectedImportIdx] = useState<Set<number>>(new Set());

  const toggleImport = (i: number) =>
    setSelectedImportIdx(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("loading");
    setImportError(null);
    setImportData(null);
    try {
      const parsed = await readJsonFile(file);
      if (!validateExportData(parsed)) throw new Error("Not a valid Investalo export file (wrong format or version)");
      setImportData(parsed);
      setSelectedImportIdx(new Set(parsed.properties.map((_, i) => i)));
      setImportStatus("preview");
    } catch (err: any) {
      setImportError(err.message ?? "Unknown error reading file");
      setImportStatus("error");
    }
    e.target.value = "";
  }

  async function handleImport() {
    if (!importData) return;
    setImportStatus("importing");
    setImportError(null);
    const selectedProperties = importData.properties.filter((_, i) => selectedImportIdx.has(i));
    const neededExportIds = new Set(selectedProperties.flatMap(p => p.projectExportIds ?? []));
    const payload: ExportData = {
      ...importData,
      properties: selectedProperties,
      projects: importData.projects.filter(p => neededExportIds.has(p._exportId)),
    };
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Import failed (${res.status})`);
      }
      const result = await res.json();
      setImportResult(result);
      setImportStatus("done");
      queryClient.invalidateQueries({ queryKey: [api.properties.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.projects.list.path] });
    } catch (err: any) {
      setImportError(err.message ?? "Import failed");
      setImportStatus("error");
    }
  }

  function resetImport() {
    setImportStatus("idle");
    setImportData(null);
    setImportError(null);
    setImportResult(null);
    setSelectedImportIdx(new Set());
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / Export</CardTitle>
        <CardDescription>
          Back up your portfolio or seed a dev environment with test data using JSON files.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="export" className="flex-1">
              <Download className="w-4 h-4 mr-2" /> Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1">
              <Upload className="w-4 h-4 mr-2" /> Import
            </TabsTrigger>
          </TabsList>

          {/* ── EXPORT TAB ── */}
          <TabsContent value="export" className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading properties…</p>
            ) : properties.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No properties to export yet.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Select properties to export</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs h-7"
                      onClick={() => setSelectedExportIds(new Set(properties.map(p => p.id)))}>
                      All
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7"
                      onClick={() => setSelectedExportIds(new Set())}>
                      None
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto rounded-md border p-3">
                  {properties.map(p => (
                    <div key={p.id} className="flex items-center gap-3 py-1.5">
                      <Checkbox
                        id={`exp-${p.id}`}
                        checked={selectedExportIds.has(p.id)}
                        onCheckedChange={() => toggleExport(p.id)}
                      />
                      <Label htmlFor={`exp-${p.id}`} className="flex-1 cursor-pointer leading-tight">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {p.city} · {p.area} · {p.sizeM2} m²
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>

                {includedProjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center text-xs text-muted-foreground">
                    <span>Projects included automatically:</span>
                    {includedProjects.map(p => (
                      <Badge key={p.id} variant="secondary" className="text-xs">{p.name}</Badge>
                    ))}
                  </div>
                )}

                <Button className="w-full" onClick={handleExport} disabled={selectedExportIds.size === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  {selectedExportIds.size === properties.length
                    ? "Download Full Backup"
                    : `Download ${selectedExportIds.size} Propert${selectedExportIds.size === 1 ? "y" : "ies"}`}
                </Button>
              </>
            )}
          </TabsContent>

          {/* ── IMPORT TAB ── */}
          <TabsContent value="import" className="space-y-4">
            {importStatus === "idle" || importStatus === "loading" ? (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {importStatus === "loading"
                    ? <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    : <FileJson className="w-8 h-8" />}
                  <span className="text-sm font-medium">
                    {importStatus === "loading" ? "Reading file…" : "Click to select an Investalo .json export"}
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept=".json,application/json"
                  className="hidden" onChange={handleFileSelect} />
                <p className="text-xs text-muted-foreground text-center">
                  Records are always added as new entries — existing data is not overwritten.
                </p>
              </>
            ) : importStatus === "preview" && importData ? (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Exported {new Date(importData.exportedAt).toLocaleDateString()}</span>
                  <span>{importData.projects.length} project{importData.projects.length !== 1 ? "s" : ""} referenced</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Select properties to import</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-xs h-7"
                      onClick={() => setSelectedImportIdx(new Set(importData.properties.map((_, i) => i)))}>
                      All
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs h-7"
                      onClick={() => setSelectedImportIdx(new Set())}>
                      None
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto rounded-md border p-3">
                  {importData.properties.map((prop, i) => (
                    <div key={i} className="flex items-center gap-3 py-1.5">
                      <Checkbox
                        id={`imp-${i}`}
                        checked={selectedImportIdx.has(i)}
                        onCheckedChange={() => toggleImport(i)}
                      />
                      <Label htmlFor={`imp-${i}`} className="flex-1 cursor-pointer leading-tight">
                        <span className="font-medium">{prop.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {prop.city} · {prop.area} · {prop.sizeM2} m²
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={resetImport}>Cancel</Button>
                  <Button className="flex-1" onClick={handleImport} disabled={selectedImportIdx.size === 0}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {selectedImportIdx.size} Propert{selectedImportIdx.size === 1 ? "y" : "ies"}
                  </Button>
                </div>
              </>
            ) : importStatus === "importing" ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Importing…</span>
              </div>
            ) : importStatus === "done" && importResult ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <p className="font-medium">Import complete!</p>
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1 text-sm w-full">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Properties created</span>
                    <span className="font-medium">{importResult.propertiesCreated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projects created</span>
                    <span className="font-medium">{importResult.projectsCreated}</span>
                  </div>
                  {!!importResult.propertiesSkipped && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Properties skipped (invalid)</span>
                      <span className="font-medium">{importResult.propertiesSkipped}</span>
                    </div>
                  )}
                </div>
                <Button variant="outline" onClick={resetImport}>Import Another File</Button>
              </div>
            ) : importStatus === "error" ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <AlertCircle className="w-10 h-10 text-destructive" />
                <p className="font-medium">Import failed</p>
                <p className="text-sm text-muted-foreground text-center">{importError}</p>
                <Button variant="outline" onClick={resetImport}>Try Again</Button>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
