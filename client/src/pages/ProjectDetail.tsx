import { useState, useMemo } from "react";
import { Link, useParams, useLocation } from "wouter";
import {
  ArrowLeft, Plus, Edit, Trash2, FolderOpen, TrendingUp, Copy,
  ChevronDown, ChevronRight, Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { UserMenu } from "@/components/UserMenu";
import { PropertyForm } from "@/components/PropertyForm";
import { useProjects, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { useProperties, useDeleteProperty, useDuplicateProperty } from "@/hooks/use-properties";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { runSimulation } from "@/lib/simulation";
import { getMarketConfig } from "@/lib/market-configs";
import { getCurrencySymbol } from "@/lib/formatting";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id);
  const [, navigate] = useLocation();

  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: properties, isLoading: loadingProperties } = useProperties();
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const deletePropertyMutation = useDeleteProperty();
  const duplicatePropertyMutation = useDuplicateProperty();
  const { toast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [isPropertyFormOpen, setIsPropertyFormOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(null);
  const [collapsedCards, setCollapsedCards] = useState<Set<number>>(new Set());

  const project = projects?.find(p => p.id === projectId);
  const projectProperties = useMemo(() =>
    properties?.filter(p => (p.projectIds as number[] || []).includes(projectId)) ?? [],
    [properties, projectId]
  );

  const marketConfig = getMarketConfig(settings?.market);
  const currencySymbol = getCurrencySymbol(settings?.currency ?? marketConfig.currency);
  const fmt = (v: number) => `${Math.round(v).toLocaleString(marketConfig.locale)} ${currencySymbol}`;

  const simulations = useMemo(() => {
    if (!projectProperties.length || !settings) return [];
    return projectProperties.map(p => ({ ...p, ...runSimulation(p, settings) }));
  }, [projectProperties, settings]);

  if (loadingProjects || loadingProperties || loadingSettings) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Link href="/projects">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setFormName(project.name);
    setFormDescription(project.description || "");
    setIsEditOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!formName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Project name is required." });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: projectId,
        name: formName.trim(),
        description: formDescription.trim() || null,
      });
      toast({ title: "Project updated" });
      setIsEditOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteMutation.mutateAsync(projectId);
      toast({ title: "Project deleted" });
      navigate("/projects");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleDeleteProperty = (id: number) => {
    deletePropertyMutation.mutate(id);
  };

  const handleDuplicateProperty = (id: number) => {
    duplicatePropertyMutation.mutate(id);
  };

  const handleEditProperty = (id: number) => {
    setEditingPropertyId(id);
    setIsPropertyFormOpen(true);
  };

  const handleAddProperty = () => {
    setEditingPropertyId(null);
    setIsPropertyFormOpen(true);
  };

  const toggleCard = (id: number) => {
    setCollapsedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="pl-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Button>
        </Link>
      </div>

      <PageHeader
        title={project.name}
        description={project.description || "No description"}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={handleOpenEdit} data-testid="button-edit-project">
              <Edit className="w-4 h-4 mr-2" /> Edit Project
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" data-testid="button-delete-project">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete <strong>{project.name}</strong>. Properties will be unassigned but not deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleAddProperty} data-testid="button-add-property">
              <Plus className="w-4 h-4 mr-2" /> Add Property
            </Button>
            <UserMenu />
          </div>
        }
      />

      {simulations.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No properties in this project</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Add a property to start comparing performance within this project.
          </p>
          <Button onClick={handleAddProperty} size="lg" data-testid="button-add-first-property">
            <Plus className="w-5 h-5 mr-2" /> Add First Property
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              {simulations.length} {simulations.length === 1 ? "property" : "properties"}
            </p>
          </div>

          {simulations.map(sim => {
            const isExpanded = !collapsedCards.has(sim.id);
            return (
              <Card key={sim.id} className="group/card" data-testid={`card-property-${sim.id}`}>
                <div className="flex items-center gap-2 px-4 pt-3 pb-1 group/header">
                  <button
                    onClick={() => toggleCard(sim.id)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`button-toggle-card-${sim.id}`}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0 flex items-center gap-3">
                    <span className="font-semibold truncate">{sim.name}</span>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {sim.city}, {sim.area} · {sim.sizeM2}m²{sim.rooms ? ` · ${sim.rooms}` : ""}
                    </span>
                  </div>
                  <Badge variant={sim.roiPercent >= 0 ? "default" : "destructive"} className="shrink-0">
                    {sim.roiPercent.toFixed(1)}% ROI
                  </Badge>
                </div>

                {isExpanded && (
                  <>
                    <CardContent className="space-y-4 pt-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Purchase</p>
                          <p className="font-medium">{fmt(parseInt(sim.purchasePrice))}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Rent</p>
                          <p className="font-medium">
                            {Math.round(parseFloat(sim.rentPerMonth)).toLocaleString(marketConfig.locale)} {currencySymbol}/mo
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Monthly CF (Yr 1)</p>
                          <p className={`font-medium ${sim.years[0].cashFlow / 12 >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {Math.round(sim.years[0].cashFlow / 12).toLocaleString(marketConfig.locale)} {currencySymbol}/mo
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Profit if Sold</p>
                          <p className="font-medium text-primary">
                            {fmt(sim.years[sim.years.length - 1].totalProfitIfSold)}
                          </p>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-2 flex justify-between border-t">
                      <Link href={`/property/${sim.id}`} className="flex-1">
                        <Button variant="ghost" className="w-full justify-start pl-0" data-testid={`button-view-${sim.id}`}>
                          View Analysis <TrendingUp className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateProperty(sim.id)}
                          title="Duplicate"
                          data-testid={`button-duplicate-${sim.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditProperty(sim.id)}
                          data-testid={`button-edit-${sim.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-delete-${sim.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove <strong>{sim.name}</strong>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProperty(sim.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardFooter>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit project dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                data-testid="input-project-name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                data-testid="input-project-description"
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateProject} disabled={updateMutation.isPending} data-testid="button-submit-project">
                {updateMutation.isPending ? "Saving..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property form */}
      <PropertyForm
        open={isPropertyFormOpen}
        onOpenChange={setIsPropertyFormOpen}
        property={properties?.find(p => p.id === editingPropertyId)}
        defaultProjectId={editingPropertyId ? undefined : projectId}
      />
    </div>
  );
}
