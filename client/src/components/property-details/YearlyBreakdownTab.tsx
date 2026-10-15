import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SimulationResults } from "@/hooks/use-simulation-results";

interface YearlyBreakdownTabProps {
  simResults: SimulationResults;
}

export function YearlyBreakdownTab({ simResults }: YearlyBreakdownTabProps) {
  const { sim, fmt } = simResults;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yearly Breakdown</CardTitle>
        <CardDescription>Detailed financial data for each year of ownership.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px] sticky left-0 bg-background">Year</TableHead>
              <TableHead>Gross Rent</TableHead>
              <TableHead>Vacancy Loss</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Loan Fees</TableHead>
              <TableHead>Cash Flow</TableHead>
              <TableHead>Tax Paid</TableHead>
              <TableHead>Prop. Value</TableHead>
              <TableHead>Equity</TableHead>
              <TableHead className="text-right">Profit (Sold)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sim.years.map((year) => (
              <TableRow key={year.year}>
                <TableCell className="font-medium sticky left-0 bg-background">{year.year}</TableCell>
                <TableCell>{fmt(year.grossRent)}</TableCell>
                <TableCell className="text-red-500">{year.vacancyLoss > 0 ? `-${fmt(year.vacancyLoss)}` : "0"}</TableCell>
                <TableCell>{fmt(year.maintenance)}</TableCell>
                <TableCell>{fmt(year.interest)}</TableCell>
                <TableCell>{fmt(year.principalRepaid)}</TableCell>
                <TableCell>{fmt(year.loanFees)}</TableCell>
                <TableCell className={year.cashFlow > 0 ? "text-green-600" : "text-red-500"}>
                  {fmt(year.cashFlow)}
                </TableCell>
                <TableCell>{fmt(year.taxPaid)}</TableCell>
                <TableCell>{fmt(year.propertyValue)}</TableCell>
                <TableCell>{fmt(year.equity)}</TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {fmt(year.totalProfitIfSold)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
