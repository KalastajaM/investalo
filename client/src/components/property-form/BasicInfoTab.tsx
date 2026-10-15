import type { Control, UseFormSetValue } from "react-hook-form";
import type { InsertProperty } from "@shared/schema";
import type { Project } from "@shared/schema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

interface BasicInfoTabProps {
  control: Control<InsertProperty>;
  setValue: UseFormSetValue<InsertProperty>;
  citysuggestion: string | null;
  areaSuggestion: string | null;
  projects: Project[] | undefined;
}

export function BasicInfoTab({ control, setValue, citysuggestion, areaSuggestion, projects }: BasicInfoTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Name</FormLabel>
              <FormControl><Input data-testid="input-name" placeholder="e.g. Kallio Studio" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl><Input data-testid="input-city" placeholder="e.g. Helsinki" {...field} /></FormControl>
              {citysuggestion && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>Did you mean </span>
                  <button
                    type="button"
                    className="underline font-medium"
                    onClick={() => setValue("city", citysuggestion)}
                    data-testid="button-suggest-city"
                  >
                    {citysuggestion}
                  </button>
                  <span>?</span>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area / District</FormLabel>
              <FormControl><Input data-testid="input-area" placeholder="e.g. Kallio" {...field} /></FormControl>
              {areaSuggestion && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>Did you mean </span>
                  <button
                    type="button"
                    className="underline font-medium"
                    onClick={() => setValue("area", areaSuggestion)}
                    data-testid="button-suggest-area"
                  >
                    {areaSuggestion}
                  </button>
                  <span>?</span>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="sizeM2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size (m²)</FormLabel>
              <FormControl><Input data-testid="input-size" type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="rooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rooms</FormLabel>
              <FormControl><Input data-testid="input-rooms" placeholder="e.g. 2h+k+s or 2BR+LR+K" {...field} value={field.value || ""} /></FormControl>
              <FormDescription>Room layout (e.g. 2h+k = 2 rooms + kitchen)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="buildYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year of Construction</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-build-year"
                  type="number"
                  placeholder="e.g. 1985"
                  min={1800}
                  max={2100}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                />
              </FormControl>
              <FormDescription>Used to estimate maintenance costs (older = higher)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="projectIds"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Projects</FormLabel>
            <FormDescription>Assign this property to one or more projects</FormDescription>
            {projects && projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {projects.map((p) => {
                  const isChecked = (field.value as number[] || []).includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center space-x-2 rounded-md border px-3 py-2 hover:bg-muted/50"
                      data-testid={`project-checkbox-${p.id}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = (field.value as number[] || []);
                          field.onChange(
                            checked
                              ? [...current, p.id]
                              : current.filter((id) => id !== p.id)
                          );
                        }}
                        id={`project-${p.id}`}
                      />
                      <label htmlFor={`project-${p.id}`} className="text-sm font-medium cursor-pointer flex-1">
                        {p.name}
                      </label>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No projects yet. Create projects on the Projects page.</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
