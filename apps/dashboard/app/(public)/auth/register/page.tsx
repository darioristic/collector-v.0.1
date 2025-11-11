"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

const registerSchema = z
  .object({
    companyName: z.string().min(2, "Naziv kompanije mora imati bar 2 karaktera."),
    companyDomain: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    fullName: z.string().min(2, "Ime i prezime su obavezni."),
    email: z.string().email("Unesite validan email."),
    password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera."),
    confirmPassword: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera.")
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Lozinke se ne poklapaju."
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const DEFAULT_REDIRECT = "/finance";

const formError = (message: string) => ({
  type: "manual",
  message
} as const);

const SocialButtons = () => (
  <div className="grid grid-cols-1 gap-3">
    <Button variant="outline" className="w-full" disabled>
      <svg viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Google (uskoro)
    </Button>
    <Button variant="outline" className="w-full" disabled>
      <GitHubLogoIcon />
      GitHub (uskoro)
    </Button>
  </div>
);

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirect") ?? DEFAULT_REDIRECT, [searchParams]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      companyName: "",
      companyDomain: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const onSubmit = async (values: RegisterFormValues) => {
    form.clearErrors("root");

    const payload = {
      companyName: values.companyName,
      companyDomain: values.companyDomain,
      fullName: values.fullName,
      email: values.email,
      password: values.password
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        (result && typeof result === "object" && "message" in result && result.message) ||
        "Registracija nije uspela. Proverite podatke i pokušajte ponovo.";

      form.setError("root", formError(message as string));
      return;
    }

    toast.success("Nalog je uspešno kreiran! 🎉");
    router.replace(redirectTo);
    router.refresh();
  };

  return (
    <div className="flex items-center justify-center py-4 lg:h-screen">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Kreiraj nalog</CardTitle>
          <CardDescription>
            Otvori nalog za svoju kompaniju i pozovi tim kada završiš inicijalno podešavanje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naziv kompanije</FormLabel>
                      <FormControl>
                        <Input placeholder="Collector Labs" autoComplete="organization" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domen kompanije (opciono)</FormLabel>
                      <FormControl>
                        <Input placeholder="collectorlabs.test" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ime i prezime</FormLabel>
                      <FormControl>
                        <Input placeholder="Dario Ristic" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poslovni email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="dario@collectorlabs.test" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lozinka</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potvrdi lozinku</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {form.formState.errors.root ? (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Kreiram nalog..." : "Registruj se"}
              </Button>
            </form>
          </Form>

          <div className="my-4">
            <div className="flex items-center gap-3">
              <div className="w-full border-t" />
              <span className="shrink-0 text-sm text-muted-foreground">ili nastavi sa</span>
              <div className="w-full border-t" />
            </div>
          </div>

          <SocialButtons />

          <div className="mt-4 text-center text-sm">
            Već imaš nalog?{" "}
            <Link href="/auth/login" className="underline">
              Prijavi se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


