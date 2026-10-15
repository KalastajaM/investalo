import { Building2, TrendingUp, Calculator, Shield, BarChart3, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroImage from "@/assets/images/hero-finland.webp";

const features = [
  {
    icon: Calculator,
    title: "ROI & Cash Flow Analysis",
    description: "Calculate yearly cash flow, equity growth, and return on investment with detailed monthly breakdowns.",
  },
  {
    icon: Shield,
    title: "Finnish Tax Rules Built In",
    description: "Transfer tax, capital gains tax brackets (30%/34%), and hankintameno-olettama are all handled automatically.",
  },
  {
    icon: BarChart3,
    title: "Compare Investments",
    description: "Compare multiple properties side by side and see how they stack up against stock market alternatives.",
  },
  {
    icon: PiggyBank,
    title: "Loan & Cost Modeling",
    description: "Model loan payments, maintenance fees, vacancy rates, and all ongoing costs over your investment horizon.",
  },
  {
    icon: TrendingUp,
    title: "Growth Projections",
    description: "Project property value appreciation, rent increases, and total equity growth over time.",
  },
  {
    icon: Building2,
    title: "Sale Scenario Planning",
    description: "See your net profit after broker fees, taxes, and deemed acquisition cost if you sell at any year.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">Investalo</span>
          </div>
          <a href="/api/login">
            <Button data-testid="button-login">Sign In</Button>
          </a>
        </div>
      </nav>
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-foreground leading-tight md:leading-none">
                Smart Property
                <br />
                Investment Analysis
                <br />
                <span className="text-primary">for Finland</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Calculate ROI, compare rental properties, and make informed investment decisions with
                Finnish tax rules and legislation built right in.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="/api/login">
                  <Button size="lg" data-testid="button-get-started">
                    Get Started
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Free to use
                </span>
                <span className="flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-primary" />
                  Finnish tax rules
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-md overflow-hidden ring-1 ring-border">
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent z-10" />
                <img
                  src={heroImage}
                  alt="Finnish apartment buildings"
                  className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
                  data-testid="img-hero"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-sans font-bold text-foreground mb-4">
              Everything You Need for Property Analysis
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Purpose-built for the Finnish real estate market with all the calculations and
              tax rules you need to evaluate investment properties.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border bg-card">
                <CardContent className="pt-6 space-y-3">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Investalo</span>
          </div>
          <p>Property investment calculator for the Finnish market</p>
        </div>
      </footer>
    </div>
  );
}
