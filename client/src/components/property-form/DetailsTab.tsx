import type { Control } from "react-hook-form";
import type { InsertProperty } from "@shared/schema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link, Loader2, MapPin } from "lucide-react";

interface DetailsTabProps {
  control: Control<InsertProperty>;
  onGeocode: () => void;
  isGeocoding: boolean;
}

export function DetailsTab({ control, onGeocode, isGeocoding }: DetailsTabProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl><Input data-testid="input-address" placeholder="e.g. Esimerkkikatu 1, Helsinki" {...field} value={field.value || ""} /></FormControl>
              <Button type="button" variant="outline" size="icon" onClick={onGeocode} disabled={isGeocoding} title="Find on map" data-testid="button-geocode">
                {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              </Button>
            </div>
            <FormDescription>Enter address and click the pin icon to find coordinates</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-latitude"
                  type="number"
                  step="any"
                  placeholder="60.1699"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-longitude"
                  type="number"
                  step="any"
                  placeholder="24.9384"
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="customLink"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Custom Link</FormLabel>
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-muted-foreground shrink-0" />
              <FormControl><Input data-testid="input-custom-link" placeholder="https://oikotie.fi/..." {...field} value={field.value || ""} /></FormControl>
            </div>
            <FormDescription>Link to the property listing or other relevant page</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                data-testid="input-notes"
                placeholder="Add any additional notes about this property..."
                rows={4}
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormDescription>Personal notes, observations, or reminders</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
