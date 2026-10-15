import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { ArrowLeft } from "lucide-react";
import { releases } from "@/data/releases";

export default function ReleaseNotes() {
  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="mb-6">
        <Link href="/settings">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Settings
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Release Notes"
        description="A complete changelog of all changes and improvements."
      />

      <div className="space-y-6 max-w-3xl">
        {releases.map((release) => (
          <Card key={release.version}>
            <CardHeader>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-sm font-mono">
                  v{release.version}
                </Badge>
                <CardTitle className="text-lg">{release.title}</CardTitle>
                <span className="text-sm text-muted-foreground ml-auto">{release.date}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {release.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {section.heading}
                  </h3>
                  <ul className="space-y-1.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-muted-foreground mt-0.5 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
