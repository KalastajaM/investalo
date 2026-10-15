import { useState } from "react";
import { Link } from "wouter";
import { Plus, Edit, Trash2, FolderOpen, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { UserMenu } from "@/components/UserMenu";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/hooks/use-projects";
import { useProperties } from "@/hooks/use-properties";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Project } from "@shared/schema";

export default function ProjectsPage() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: properties } = useProperties();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const handleAdd = () => {
    setEditingProject(null);
    setFormName("");
    setFormDescription("");
    setIsFormOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || "");
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Project name is required." });
      return;
    }
    try {
      if (editingProject) {
        await updateMutation.mutateAsync({
          id: editingProject.id,
          name: formName.trim(),
          description: formDescription.trim() || null,
        });
        toast({ title: "Project updated", description: "Changes saved successfully." });
      } else {
        await createMutation.mutateAsync({
          name: formName.trim(),
          description: formDescription.trim() || null,
        });
        toast({ title: "Project created", description: "New project added." });
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Project deleted", description: "Properties have been unassigned from this project." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const getProjectPropertyCount = (projectId: number) => {
    return properties?.filter(p => (p.projectIds as number[] || []).includes(projectId)).length || 0;
  };

  const getProjectProperties = (projectId: number) => {
    return properties?.filter(p => (p.projectIds as number[] || []).includes(projectId)) || [];
  };

  if (loadingProjects) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Projects"
        description="Group properties into projects for focused comparison and analysis."
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleAdd} data-testid="button-add-project">
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
            <UserMenu />
          </div>
        }
      />

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const propCount = getProjectPropertyCount(project.id);
            const projectProps = getProjectProperties(project.id);
            return (
              <Card key={project.id} data-testid={`card-project-${project.id}`} className="flex flex-col">
                <Link href={`/projects/${project.id}`} className="flex-1">
                  <CardHeader className="pb-3 hover:bg-muted/40 rounded-t-xl transition-colors cursor-pointer">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 shrink-0 text-primary" />
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="mt-1 line-clamp-2">{project.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary" data-testid={`badge-count-${project.id}`}>
                        {propCount} {propCount === 1 ? "property" : "properties"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {projectProps.length > 0 ? (
                      <div className="space-y-1">
                        {projectProps.slice(0, 4).map(prop => (
                          <div key={prop.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Home className="w-3 h-3 shrink-0" />
                            <span className="truncate">{prop.name}</span>
                            <span className="text-xs">({prop.city})</span>
                          </div>
                        ))}
                        {projectProps.length > 4 && (
                          <p className="text-xs text-muted-foreground">+{projectProps.length - 4} more</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No properties assigned yet</p>
                    )}
                  </CardContent>
                </Link>

                <CardFooter className="pt-2 flex justify-end gap-1 border-t">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(project)} data-testid={`button-edit-project-${project.id}`}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-delete-project-${project.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete <strong>{project.name}</strong>. Properties in this project will be unassigned but not deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No projects yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Create a project to group and compare related properties together.
          </p>
          <Button onClick={handleAdd} size="lg" data-testid="button-add-first-project">
            <Plus className="w-5 h-5 mr-2" /> Create First Project
          </Button>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
            <DialogDescription>
              {editingProject ? "Update the project details." : "Create a new project to group properties."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                data-testid="input-project-name"
                placeholder="e.g. Helsinki Portfolio"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                data-testid="input-project-description"
                placeholder="Brief description of this project..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsFormOpen(false)} data-testid="button-cancel-project">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending} data-testid="button-submit-project">
                {isPending ? "Saving..." : editingProject ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
