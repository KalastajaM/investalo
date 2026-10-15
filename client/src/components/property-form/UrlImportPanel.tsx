import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, Loader2 } from "lucide-react";

interface UrlImportPanelProps {
  importUrl: string;
  onImportUrlChange: (url: string) => void;
  onImport: () => void;
  isImporting: boolean;
}

export function UrlImportPanel({ importUrl, onImportUrlChange, onImport, isImporting }: UrlImportPanelProps) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <Link className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-sm font-medium">Import from listing URL</span>
        <span className="text-xs text-muted-foreground">(oikotie.fi, etuovi.com, or other)</span>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="https://www.oikotie.fi/myytavat-asunnot/..."
          value={importUrl}
          onChange={(e) => onImportUrlChange(e.target.value)}
          className="flex-1 text-sm"
        />
        <Button type="button" variant="outline" onClick={onImport} disabled={isImporting}>
          {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste an advertisement link to auto-fill property details. You can review and edit values before saving.
      </p>
    </div>
  );
}
