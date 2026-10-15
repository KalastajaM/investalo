import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Property } from "@shared/schema";
import type { SimulationResults } from "@/hooks/use-simulation-results";

interface PropertyInputsTabProps {
  property: Property;
  simResults: SimulationResults;
}

export function PropertyInputsTab({ property, simResults }: PropertyInputsTabProps) {
  const { fmt, purchasePrice, debtFreePrice, downPayment } = simResults;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Inputs</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {property.rooms && (
            <div>
              <dt className="text-muted-foreground">Rooms</dt>
              <dd className="font-medium text-lg">{property.rooms}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Size</dt>
            <dd className="font-medium text-lg">{property.sizeM2} m²</dd>
          </div>
          {property.buildYear && (
            <div>
              <dt className="text-muted-foreground">Built</dt>
              <dd className="font-medium text-lg">{property.buildYear}</dd>
            </div>
          )}
          <div className={(property.rooms || property.buildYear) ? "sm:col-span-2 lg:col-span-4 border-t my-2" : "sm:col-span-2 lg:col-span-4"}></div>
          <div>
            <dt className="text-muted-foreground">Purchase Price</dt>
            <dd className="font-medium text-lg">{fmt(purchasePrice)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Debt Free Price</dt>
            <dd className="font-medium text-lg">{fmt(debtFreePrice)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Down Payment</dt>
            <dd className="font-medium text-lg">{fmt(downPayment)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Renovation</dt>
            <dd className="font-medium text-lg">{fmt(parseFloat(property.renovationCost || "0"))}</dd>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 border-t my-2"></div>

          <div>
            <dt className="text-muted-foreground">Rent</dt>
            <dd className="font-medium text-lg">{fmt(parseFloat(property.rentPerMonth))}/mo</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Hoitovastike</dt>
            <dd className="font-medium text-lg">{fmt(parseFloat(property.maintenanceFeePerMonth))}/mo</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Rahoitusvastike</dt>
            <dd className="font-medium text-lg">{fmt(parseFloat(property.financeFeePerMonth || "0"))}/mo</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Finance Fee Deductible?</dt>
            <dd className="font-medium text-lg">{property.isFinanceFeeDeductible ? "Yes (Tuloutettu)" : "No (Rahastoitu)"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
