import type { Control } from "react-hook-form";
import type { InsertProperty } from "@shared/schema";
import type { MarketConfig } from "@/lib/market-configs";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface PurchaseLoanTabProps {
  control: Control<InsertProperty>;
  currencySymbol: string;
  marketConfig: MarketConfig;
}

export function PurchaseLoanTab({ control, currencySymbol, marketConfig }: PurchaseLoanTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={control}
        name="purchasePrice"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Purchase Price ({currencySymbol})</FormLabel>
            <FormControl><Input data-testid="input-purchase-price" type="number" {...field} /></FormControl>
            {marketConfig.id === "fi" && <FormDescription>Myyntihinta</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />

      {marketConfig.features.debtFreePrice && (
        <FormField
          control={control}
          name="debtFreePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Debt Free Price ({currencySymbol})</FormLabel>
              <FormControl><Input data-testid="input-debt-free-price" type="number" {...field} /></FormControl>
              <FormDescription>Velaton hinta (Price + Yhtiölaina)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="downPayment"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Down Payment ({currencySymbol})</FormLabel>
            <FormControl><Input data-testid="input-down-payment" type="number" {...field} /></FormControl>
            <FormDescription>Your own cash contribution</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="renovationCost"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Renovation Cost ({currencySymbol})</FormLabel>
            <FormControl><Input data-testid="input-renovation" type="number" {...field} /></FormControl>
            <FormDescription>Initial renovation investment</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
