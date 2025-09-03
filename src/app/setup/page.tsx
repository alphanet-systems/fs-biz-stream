
"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { createInitialWallets, saveCompanyDetails } from "@/lib/actions";
import { ImportDialog } from "@/components/ImportDialog";
import { File, Building, Wallet, Users, Package, CheckCircle, Circle } from "lucide-react";

type Step = "company" | "wallets" | "import" | "done";

const stepsConfig: { id: Step, title: string, icon: React.ElementType }[] = [
  { id: "company", title: "Company Details", icon: Building },
  { id: "wallets", title: "Create Wallets", icon: Wallet },
  { id: "import", title: "Import Data", icon: File },
  { id: "done", title: "Finish", icon: CheckCircle },
];


export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState<Step>("company");
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  const markStepAsCompleted = (step: Step) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps(prev => [...prev, step]);
    }
  }

  const handleNextStep = (nextStep: Step, markCurrentAsComplete = true) => {
    if (markCurrentAsComplete) {
      markStepAsCompleted(currentStep);
    }
    setCurrentStep(nextStep);
  };
  
  const handleFinishSetup = () => {
    markStepAsCompleted("done");
    toast({
      title: "Setup Complete!",
      description: "Welcome! You're being redirected to your dashboard.",
    });
    router.push('/');
    router.refresh(); // Force a refresh to re-evaluate middleware and auth state
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case "company":
        return <CompanyStep onCompleted={() => handleNextStep("wallets")} />;
      case "wallets":
        return <WalletStep onCompleted={() => handleNextStep("import")} onSkip={() => handleNextStep("import", false)} />;
      case "import":
        return <ImportStep onCompleted={() => handleNextStep("done")} onSkip={() => handleNextStep("done", false)} />;
      case "done":
        return <FinishStep onFinish={handleFinishSetup} />
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Welcome to BizStream! Let's get you set up.</CardTitle>
          <CardDescription>Follow these steps to configure your business.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/4">
              <nav className="space-y-1">
                {stepsConfig.map(step => (
                   <Button
                    key={step.id}
                    variant={currentStep === step.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setCurrentStep(step.id)}
                    disabled={step.id !== 'company' && !completedSteps.includes(stepsConfig[stepsConfig.findIndex(s => s.id === step.id) - 1].id)}
                  >
                    {completedSteps.includes(step.id) ? (
                      <CheckCircle className="mr-2 h-4 w-4 text-green-500"/>
                    ) : (
                      <step.icon className="mr-2 h-4 w-4"/>
                    )}
                    {step.title}
                  </Button>
                ))}
              </nav>
            </div>
            <div className="flex-1 border-l pl-8">
              {renderStepContent()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components

function CompanyStep({ onCompleted }: { onCompleted: () => void }) {
    const [companyName, setCompanyName] = useState('');
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleSave = () => {
        if (!companyName) {
            toast({ title: "Company name is required.", variant: "destructive" });
            return;
        }
        startTransition(async () => {
            const result = await saveCompanyDetails({ companyName });
            if (result.success) {
                toast({ title: "Company details saved!" });
                onCompleted();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Company Details</h2>
            <p className="text-muted-foreground">This information will appear on your invoices.</p>
            <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your Company LLC"/>
            </div>
            <Button onClick={handleSave} disabled={isPending || !companyName}>
                {isPending ? 'Saving...' : 'Save and Continue'}
            </Button>
        </div>
    )
}

function WalletStep({ onCompleted, onSkip }: { onCompleted: () => void, onSkip: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleCreateDefaults = () => {
        startTransition(async () => {
            const result = await createInitialWallets();
            if (result.success) {
                toast({ title: "Default wallets created!", description: "We've created a 'Main Bank Account' and 'Cash Drawer' for you." });
                onCompleted();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        });
    }
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Financial Wallets</h2>
            <p className="text-muted-foreground">
                Wallets represent your real-world accounts (e.g., bank accounts, cash). We can create some common defaults for you. You can add more later.
            </p>
            <div className="flex gap-4">
                 <Button onClick={handleCreateDefaults} disabled={isPending}>
                    {isPending ? 'Creating...' : 'Create Default Wallets'}
                </Button>
                 <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
            </div>
        </div>
    )
}

function ImportStep({ onCompleted, onSkip }: { onCompleted: () => void, onSkip: () => void }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Import Existing Data</h2>
            <p className="text-muted-foreground">
                Get a head start by importing your existing clients and products from a CSV file. You can download a template to see the required format.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Clients / Vendors</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ImportDialog importType="counterparties" onImportSuccess={() => {}} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary"/> Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <ImportDialog importType="products" onImportSuccess={() => {}} />
                    </CardContent>
                </Card>
            </div>
             <Separator className="my-6"/>
            <div className="flex gap-4">
                 <Button onClick={onCompleted}>
                    Finish Importing & Continue
                </Button>
                 <Button variant="ghost" onClick={onSkip}>Skip for now</Button>
            </div>
        </div>
    )
}

function FinishStep({ onFinish }: { onFinish: () => void }) {
    return (
        <div className="space-y-6 text-center flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500"/>
            <h2 className="text-2xl font-semibold">You're All Set!</h2>
            <p className="text-muted-foreground max-w-md">
                Your initial setup is complete. You can now start managing your business with BizStream. You can always change these settings later.
            </p>
            <Button onClick={onFinish} size="lg">Go to Dashboard</Button>
        </div>
    )
}
