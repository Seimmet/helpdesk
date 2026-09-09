import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomer, queryKeys } from "@/lib/mock/api";

export const Route = createFileRoute("/customers/new")({
  head: () => ({
    meta: [
      { title: "New customer — Relay Helpdesk" },
      { name: "description", content: "Add a new customer account to your workspace." },
      { property: "og:title", content: "New customer — Relay Helpdesk" },
      {
        property: "og:description",
        content: "Add a new customer account to your workspace.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["owner", "admin"]}>
      <NewCustomerPage />
    </RequireAuth>
  ),
});

function NewCustomerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: queryKeys.customers("") });
      toast.success(`${customer.name} added as a customer`);
      navigate({ to: "/customers" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create the customer"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};

    if (name.trim().length < 2) next.name = "Customer name is required (at least 2 characters).";
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) next.email = "A valid email address is required.";

    setErrors(next);
    if (Object.keys(next).length) return;

    mutation.mutate({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber: phoneNumber.trim() || undefined,
      company: company.trim() || undefined,
    });
  };

  return (
    <AppShell title="New customer" description="Add a new customer account to your workspace">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/customers">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to customers
        </Link>
      </Button>

      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Customer name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                placeholder="e.g., Taiwo Adetona"
                required
              />
              {errors.name ? (
                <p id="name-error" role="alert" className="text-xs text-destructive">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="e.g., customer@example.com"
                required
              />
              {errors.email ? (
                <p id="email-error" role="alert" className="text-xs text-destructive">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., +1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Acme Corp"
              />
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {mutation.isPending ? "Creating..." : "Create customer"}
            </Button>
          </CardContent>
        </Card>

        <div>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h3 className="font-semibold text-sm mb-2">Customer information</h3>
                <p className="text-xs text-muted-foreground">
                  Fill in the customer's basic information. Name and email are required. Phone number and company are optional.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-2">What happens next?</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Customer account is created immediately</li>
                  <li>✓ You can assign tickets to this customer</li>
                  <li>✓ Customer can log in with their email</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </AppShell>
  );
}
