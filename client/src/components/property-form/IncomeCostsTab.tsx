import type { Control } from "react-hook-form";
import type { InsertProperty } from "@shared/schema";
import type { MarketConfig } from "@/lib/market-configs";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator } from "lucide-react";

interface IncomeCostsTabProps {
  control: Control<InsertProperty>;
  currencySymbol: string;
  marketConfig: MarketConfig;
  onEstimateRent: () => void;
}

export function IncomeCostsTab({ control, currencySymbol, marketConfig, onEstimateRent }: IncomeCostsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="rentPerMonth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monthly Rent ({currencySymbol})</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl><Input data-testid="input-rent" type="number" {...field} /></FormControl>
              <Button type="button" variant="outline" size="icon" onClick={onEstimateRent} title="Estimate Rent" data-testid="button-estimate-rent">
                <Calculator className="w-4 h-4" />
              </Button>
            </div>
            {marketConfig.id === "fi" && <FormDescription>Vuokra</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="maintenanceFeePerMonth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Fee ({currencySymbol}/mo)</FormLabel>
            <FormControl><Input data-testid="input-maintenance" type="number" {...field} /></FormControl>
            {marketConfig.id === "fi" && <FormDescription>Hoitovastike</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />

      {marketConfig.features.financeFee && (
        <FormField
          control={control}
          name="financeFeePerMonth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Finance Fee ({currencySymbol}/mo)</FormLabel>
              <FormControl><Input data-testid="input-finance-fee" type="number" {...field} /></FormControl>
              <FormDescription>Rahoitusvastike (Yhtiölaina repayment)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="waterFeePerMonth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Water Fee ({currencySymbol}/mo)</FormLabel>
            <FormControl><Input data-testid="input-water-fee" type="number" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="otherCostsPerMonth"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Other Costs ({currencySymbol}/mo)</FormLabel>
            <FormControl><Input data-testid="input-other-costs" type="number" {...field} /></FormControl>
            <FormDescription>Insurance, etc.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="yearlyExtraMaintenance"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Extra Maintenance ({currencySymbol}/year)</FormLabel>
            <FormControl><Input data-testid="input-yearly-extra-maintenance" type="number" step="1" {...field} /></FormControl>
            <FormDescription>Yearly costs not included in maintenance fee</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {marketConfig.features.financeFee && (
        <FormField
          control={control}
          name="isFinanceFeeDeductible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  data-testid="checkbox-deductible"
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Deductible Finance Fee?</FormLabel>
                <FormDescription>
                  Is the rahoitusvastike "tuloutettu" in the company books?
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
