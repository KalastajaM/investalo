import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, type InsertSettings } from "@shared/schema";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useProperties } from "@/hooks/use-properties";
import { useProjects } from "@/hooks/use-projects";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Save, ScrollText } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKET_CONFIGS, getMarketConfig, type MarketConfig } from "@/lib/market-configs";
import { getCurrencySymbol } from "@/lib/formatting";
import { ImportExportCard } from "@/components/ImportExportCard";

function SettingsField({ control, name, label, description, step, isInteger }: {
  control: any;
  name: string;
  label: string;
  description?: string;
  step?: string;
  isInteger?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              data-testid={`input-${name}`}
              type="number"
              step={step || "0.1"}
              {...field}
              onChange={e => isInteger ? field.onChange(parseInt(e.target.value) || 0) : field.onChange(e.target.value)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const isDevMode = user?.id === "dev-user";
  const [devCurrentPw, setDevCurrentPw] = useState("");
  const [devNewPw, setDevNewPw] = useState("");
  const [devPwError, setDevPwError] = useState<string | null>(null);
  const [devPwSuccess, setDevPwSuccess] = useState(false);
  const [devPwSubmitting, setDevPwSubmitting] = useState(false);

  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const { toast } = useToast();
  const { data: properties, isLoading: loadingProperties } = useProperties();
  const { data: projects, isLoading: loadingProjects } = useProjects();

  const form = useForm<InsertSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      market: "fi",
      currency: "EUR",
      loanInterestRate: "3.5",
      loanDurationYears: 25,
      transferTaxRate: "1.5",
      capitalGainsTaxRate: "30.0",
      capitalGainsTaxRateHigh: "34.0",
      inflationRate: "2.0",
      alternativeInvestmentReturn: "7.0",
      simulationDurationYears: 10,
      rentIncreaseRate: "1.5",
      maintenanceFeeIncreaseRate: "3.0",
      valueAppreciationRate: "1.5",
      brokerFeePercentage: "3.0",
      minBrokerFee: "4000",
      registrationCosts: "450",
      monthlyLoanFees: "2.50",
      emptyMonthsPerYear: "0.5",
      landlordAssociationFee: "98",
      liabilityInsurance: "200",
      capitalGainsThreshold: "30000",
      deductLoanInterest: true,
      depreciationDeductionEnabled: false,
      depreciationRate: "2.5",
      depreciableValuePercent: "70",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...settings,
        market: settings.market ?? "fi",
        currency: settings.currency ?? "EUR",
        loanInterestRate: String(settings.loanInterestRate),
        transferTaxRate: String(settings.transferTaxRate),
        capitalGainsTaxRate: String(settings.capitalGainsTaxRate),
        capitalGainsTaxRateHigh: String(settings.capitalGainsTaxRateHigh),
        inflationRate: String(settings.inflationRate),
        alternativeInvestmentReturn: String(settings.alternativeInvestmentReturn),
        rentIncreaseRate: String(settings.rentIncreaseRate),
        maintenanceFeeIncreaseRate: String(settings.maintenanceFeeIncreaseRate),
        valueAppreciationRate: String(settings.valueAppreciationRate),
        brokerFeePercentage: String(settings.brokerFeePercentage),
        minBrokerFee: String(settings.minBrokerFee),
        registrationCosts: String(settings.registrationCosts),
        monthlyLoanFees: String(settings.monthlyLoanFees),
        emptyMonthsPerYear: String(settings.emptyMonthsPerYear),
        landlordAssociationFee: String(settings.landlordAssociationFee),
        liabilityInsurance: String(settings.liabilityInsurance),
        capitalGainsThreshold: String(settings.capitalGainsThreshold),
        deductLoanInterest: settings.deductLoanInterest ?? true,
        depreciationDeductionEnabled: settings.depreciationDeductionEnabled ?? false,
        depreciationRate: String(settings.depreciationRate ?? "2.5"),
        depreciableValuePercent: String(settings.depreciableValuePercent ?? "70"),
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: InsertSettings) => {
    try {
      await updateMutation.mutateAsync(data);
      toast({ title: "Settings Updated", description: "Global simulation parameters have been saved." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDevPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevPwError(null);
    setDevPwSuccess(false);
    setDevPwSubmitting(true);
    try {
      const res = await fetch("/api/dev-change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword: devCurrentPw, newPassword: devNewPw }),
      });
      if (res.ok) {
        setDevPwSuccess(true);
        setDevCurrentPw("");
        setDevNewPw("");
      } else {
        const data = await res.json().catch(() => ({}));
        setDevPwError(data.error ?? "Failed to change password");
      }
    } catch {
      setDevPwError("Network error — please try again");
    } finally {
      setDevPwSubmitting(false);
    }
  };

  const watchedMarket = form.watch("market");
  const watchedCurrency = form.watch("currency");
  const watchedThreshold = form.watch("capitalGainsThreshold");
  const watchedDepreciation = form.watch("depreciationDeductionEnabled");
  const marketConfig = getMarketConfig(watchedMarket);
  const currencySymbol = getCurrencySymbol(watchedCurrency ?? marketConfig.currency);

  /** Apply a market preset's defaults to the form, keeping market & currency as-is */
  const applyMarketDefaults = (config: MarketConfig) => {
    const d = config.defaults;
    form.setValue("loanInterestRate", d.loanInterestRate);
    form.setValue("loanDurationYears", d.loanDurationYears);
    form.setValue("transferTaxRate", d.transferTaxRate);
    form.setValue("capitalGainsTaxRate", d.capitalGainsTaxRate);
    form.setValue("capitalGainsTaxRateHigh", d.capitalGainsTaxRateHigh);
    form.setValue("capitalGainsThreshold", d.capitalGainsThreshold);
    form.setValue("registrationCosts", d.registrationCosts);
    form.setValue("monthlyLoanFees", d.monthlyLoanFees);
    form.setValue("landlordAssociationFee", d.landlordAssociationFee);
    form.setValue("liabilityInsurance", d.liabilityInsurance);
    form.setValue("brokerFeePercentage", d.brokerFeePercentage);
    form.setValue("minBrokerFee", d.minBrokerFee);
    form.setValue("rentIncreaseRate", d.rentIncreaseRate);
    form.setValue("maintenanceFeeIncreaseRate", d.maintenanceFeeIncreaseRate);
    form.setValue("valueAppreciationRate", d.valueAppreciationRate);
    form.setValue("emptyMonthsPerYear", d.emptyMonthsPerYear);
  };

  const handleMarketChange = (newMarket: string) => {
    form.setValue("market", newMarket);
    const config = getMarketConfig(newMarket);
    form.setValue("currency", config.currency);
    applyMarketDefaults(config);
    toast({ title: "Market Changed", description: `Defaults loaded for ${config.name}. Review and save when ready.` });
  };

  if (isLoading) return <div className="container mx-auto p-8"><Skeleton className="h-12 w-48 mb-6" /><Skeleton className="h-[500px] w-full" /></div>;

  return (
    <div className="container mx-auto p-4 md:p-8 min-h-screen">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <PageHeader
        title="Global Settings"
        description="Configure default parameters used across all property simulations."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* Market Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Market</CardTitle>
                  <CardDescription>
                    Select your target market. This enables market-specific features and loads appropriate defaults.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="market"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Market</FormLabel>
                          <Select
                            value={field.value ?? "fi"}
                            onValueChange={(val) => { field.onChange(val); handleMarketChange(val); }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-market">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(MARKET_CONFIGS).map((cfg) => (
                                <SelectItem key={cfg.id} value={cfg.id}>{cfg.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Changing market loads preset defaults and enables market-specific fields.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input data-testid="input-currency" placeholder="EUR" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormDescription>ISO 4217 code (EUR, USD, GBP…)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Loan & Financing */}
              <Card>
                <CardHeader>
                  <CardTitle>Loan & Financing</CardTitle>
                  <CardDescription>Parameters for personal bank loan calculations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingsField control={form.control} name="loanInterestRate" label="Loan Interest Rate (%)" description={marketConfig.id === "fi" ? "Total rate (Margin + Euribor)" : "Annual interest rate"} />
                    <SettingsField control={form.control} name="loanDurationYears" label="Loan Duration (Years)" isInteger />
                    <SettingsField control={form.control} name="monthlyLoanFees" label={`Monthly Loan Fees (${currencySymbol})`} description="Bank service fee per month" step="0.01" />
                    <SettingsField control={form.control} name="registrationCosts" label={`Registration Costs (${currencySymbol})`} description="One-time costs when buying" step="1" />
                  </div>
                </CardContent>
              </Card>

              {/* Taxes & Fees */}
              <Card>
                <CardHeader>
                  <CardTitle>Taxes & Fees</CardTitle>
                  <CardDescription>Tax rates and transaction costs for your market.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingsField
                      control={form.control}
                      name="transferTaxRate"
                      label="Transfer Tax Rate (%)"
                      description={marketConfig.id === "fi" ? "Varainsiirtovero (1.5% for apartments)" : "Tax on property purchase"}
                    />
                    <SettingsField
                      control={form.control}
                      name="capitalGainsTaxRate"
                      label="Capital Gains Tax (%)"
                      description={
                        marketConfig.features.tieredCapitalGains && Number(watchedThreshold) > 0
                          ? `Up to ${Number(watchedThreshold).toLocaleString()} ${currencySymbol}`
                          : "Applied to rental income and sale gains"
                      }
                    />
                    {marketConfig.features.tieredCapitalGains && (
                      <>
                        <SettingsField
                          control={form.control}
                          name="capitalGainsTaxRateHigh"
                          label="Capital Gains Tax High (%)"
                          description={`Rate for amount exceeding ${Number(watchedThreshold || 0).toLocaleString()} ${currencySymbol}`}
                        />
                        <SettingsField
                          control={form.control}
                          name="capitalGainsThreshold"
                          label={`Capital Gains Threshold (${currencySymbol})`}
                          description="Threshold where the higher tax rate kicks in"
                          step="1"
                        />
                      </>
                    )}
                    <SettingsField control={form.control} name="brokerFeePercentage" label="Broker Fee (%)" description={marketConfig.id === "fi" ? "Välityspalkkio when selling" : "Agent/broker fee when selling"} />
                    <SettingsField control={form.control} name="minBrokerFee" label={`Minimum Broker Fee (${currencySymbol})`} description="Floor fee regardless of sale price" step="1" />
                  </div>
                </CardContent>
              </Card>

              {/* Yearly Growth Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Yearly Growth Rates</CardTitle>
                  <CardDescription>Estimated annual increases applied to the simulation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingsField control={form.control} name="rentIncreaseRate" label="Rent Increase (%/year)" description="Expected yearly rent growth" />
                    <SettingsField
                      control={form.control}
                      name="maintenanceFeeIncreaseRate"
                      label={marketConfig.id === "fi" ? "Hoitovastike Increase (%/year)" : "Maintenance Fee Increase (%/year)"}
                      description="Expected yearly maintenance cost growth"
                    />
                    <SettingsField control={form.control} name="valueAppreciationRate" label="Property Value Growth (%/year)" description="Expected appreciation" />
                    <SettingsField control={form.control} name="inflationRate" label="Inflation Rate (%)" description="General inflation (reference only)" />
                  </div>
                </CardContent>
              </Card>

              {/* Simulation */}
              <Card>
                <CardHeader>
                  <CardTitle>Simulation</CardTitle>
                  <CardDescription>General simulation and comparison parameters.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingsField control={form.control} name="simulationDurationYears" label="Simulation Duration (Years)" description="Length of the projection" isInteger />
                    <SettingsField control={form.control} name="alternativeInvestmentReturn" label="Alt. Investment Return (%)" description="Expected ETF/fund return for comparison" />
                    <SettingsField control={form.control} name="emptyMonthsPerYear" label="Empty Months / Year" description="Avg. vacancy (e.g. 0.5 = 1 month every 2 years)" step="0.1" />
                  </div>
                </CardContent>
              </Card>

              {/* Landlord Costs */}
              <Card>
                <CardHeader>
                  <CardTitle>Landlord Costs</CardTitle>
                  <CardDescription>Annual costs that are tax-deductible for landlords.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SettingsField
                      control={form.control}
                      name="landlordAssociationFee"
                      label={marketConfig.id === "fi" ? `Vuokranantajat Membership (${currencySymbol}/year)` : `Landlord Association Fee (${currencySymbol}/year)`}
                      description="Annual membership fee (tax-deductible)"
                      step="1"
                    />
                    <SettingsField
                      control={form.control}
                      name="liabilityInsurance"
                      label={marketConfig.id === "fi" ? `Vastuuvakuutus (${currencySymbol}/year)` : `Liability Insurance (${currencySymbol}/year)`}
                      description="Annual liability insurance (tax-deductible)"
                      step="1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Optional Tax Deductions — shown for all non-Finland markets */}
              {marketConfig.id !== "fi" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optional Tax Deductions</CardTitle>
                    <CardDescription>
                      Select which deductions apply in your country. These vary significantly between markets.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Loan interest toggle */}
                    <FormField
                      control={form.control}
                      name="deductLoanInterest"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mortgage interest deduction</FormLabel>
                            <FormDescription>
                              Deduct loan interest payments from taxable rental income. Allowed in most countries (EU, US, AU…).
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-deduct-loan-interest"
                              checked={field.value ?? true}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Depreciation toggle */}
                    <FormField
                      control={form.control}
                      name="depreciationDeductionEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Annual depreciation deduction</FormLabel>
                            <FormDescription>
                              Deduct annual building depreciation from taxable income. Common in the US, Australia, and Germany.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-depreciation-enabled"
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Depreciation inputs — visible only when depreciation is on */}
                    {watchedDepreciation && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-muted">
                        <SettingsField
                          control={form.control}
                          name="depreciationRate"
                          label="Depreciation Rate (%/year)"
                          description="e.g. 3.64% (US, 27.5yr), 2.5% (AU), 2% (DE)"
                          step="0.01"
                        />
                        <SettingsField
                          control={form.control}
                          name="depreciableValuePercent"
                          label="Depreciable Portion (%)"
                          description="Building % of property value (exclude land, typically 60–80%)"
                          step="1"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button type="submit" className="w-full md:w-auto" disabled={updateMutation.isPending} data-testid="button-save-settings">
                {updateMutation.isPending ? "Saving..." : "Save Settings"}
                {!updateMutation.isPending && <Save className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-6">
          {/* Market-specific tax rules info */}
          {marketConfig.id === "fi" && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Finnish Tax Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 text-muted-foreground">
                <p>
                  <strong>Capital Gains Tax:</strong> {settings?.capitalGainsTaxRate || "30"}% on capital income up to {Number(settings?.capitalGainsThreshold || 30000).toLocaleString()} {currencySymbol}, and {settings?.capitalGainsTaxRateHigh || "34"}% for the exceeding part (pääomatulovero).
                </p>
                <p>
                  <strong>Deemed Acquisition Cost:</strong> You can deduct either real costs OR hankintameno-olettama: 20% if owned under 10 years, 40% if over 10 years.
                </p>
                <p>
                  <strong>Transfer Tax:</strong> 1.5% for housing company shares (asunto-osake). First-time buyers may be exempt.
                </p>
                <p>
                  <strong>Deductible Expenses:</strong> Maintenance fees, water, insurance, loan interest, and rahoitusvastike (if tuloutettu) reduce taxable rental income.
                </p>
              </CardContent>
            </Card>
          )}

          {marketConfig.id !== "fi" && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Tax Settings</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 text-muted-foreground">
                <p>
                  Configure the tax rates for your market. Capital gains tax is applied to both annual rental income and property sale gains.
                </p>
                <p>
                  <strong>Always deductible:</strong> maintenance fees, water, property insurance, and other monthly costs reduce taxable rental income.
                </p>
                <p>
                  <strong>Optional deductions</strong> (see card below): mortgage interest and building depreciation can be toggled on or off depending on your country's rules.
                </p>
                <p>
                  Set the transfer tax to 0 if your market does not have a purchase tax on property transactions.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="text-lg">Alternative Investment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4 text-muted-foreground">
              <p>
                This calculator compares your property investment against investing the same initial capital (down payment + costs) into an index fund/ETF.
              </p>
              <p>
                If the property generates negative cash flow, that money is also "invested" into the alternative scenario for a fair comparison.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <ImportExportCard
          properties={properties ?? []}
          projects={projects ?? []}
          isLoading={loadingProperties || loadingProjects}
        />
      </div>

      {isDevMode && (
        <div className="mt-8">
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="text-lg">Dev Environment Password</CardTitle>
              <CardDescription>Change the password for this staging environment's access gate.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDevPasswordChange} className="space-y-4 max-w-sm">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="dev-current-pw">Current password</label>
                  <Input
                    id="dev-current-pw"
                    type="password"
                    value={devCurrentPw}
                    onChange={(e) => setDevCurrentPw(e.target.value)}
                    placeholder="Current password"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="dev-new-pw">New password</label>
                  <Input
                    id="dev-new-pw"
                    type="password"
                    value={devNewPw}
                    onChange={(e) => setDevNewPw(e.target.value)}
                    placeholder="New password"
                  />
                </div>
                {devPwError && <p className="text-sm text-destructive">{devPwError}</p>}
                {devPwSuccess && <p className="text-sm text-green-600">Password changed successfully.</p>}
                <Button type="submit" disabled={devPwSubmitting || !devCurrentPw || !devNewPw}>
                  {devPwSubmitting ? "Saving…" : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="mt-6">
        <Link href="/release-notes">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground pl-0">
            <ScrollText className="w-4 h-4 mr-2" />
            Release Notes
          </Button>
        </Link>
      </div>
    </div>
  );
}
