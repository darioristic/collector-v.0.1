"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2Icon, MailIcon } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Unesite validnu email adresu.")
});

type FormValues = z.infer<typeof formSchema>;

type ForgotPayload = {
  data?: {
    token: string | null;
    expiresAt: string | null;
  };
  error?: string;
  message?: string;
};

export default function ForgotPasswordPage() {
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: ""
    }
  });

  const onSubmit = async (values: FormValues) => {
    setIssuedToken(null);
    setTokenExpiresAt(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = (await response.json().catch(() => null)) as ForgotPayload | null;

    if (!response.ok) {
      const message = payload?.message ?? "Slanje instrukcija nije uspelo. Pokušajte ponovo.";
      toast.error(message);
      return;
    }

    const token = payload?.data?.token ?? null;
    const expiresAt = payload?.data?.expiresAt ?? null;

    if (token) {
      setIssuedToken(token);
      setTokenExpiresAt(expiresAt);
      toast.success("Token za reset lozinke je generisan.");
    } else {
      toast.success("Ako nalog postoji, poslaćemo uputstva na email.");
    }
  };

  return (
    <div className="flex items-center justify-center py-6 lg:h-screen">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Zaboravljena lozinka</CardTitle>
          <CardDescription>
            Unesite email adresu i poslaćemo vam privremeni token za reset lozinke. Pošto je okruženje demo,
            token će se prikazati ispod forme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email adresa</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform opacity-30" />
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          autoComplete="email"
                          className="w-full pl-10"
                          placeholder="dario@collectorlabs.test"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Slanje...
                  </>
                ) : (
                  "Pošalji instrukcije"
                )}
              </Button>
            </form>
          </Form>

          {issuedToken ? (
            <div className="mt-6 rounded-lg border bg-muted/40 p-4 text-sm">
              <p className="font-semibold">Privremeni token:</p>
              <code className="mt-2 block break-all rounded bg-background p-2 text-xs">{issuedToken}</code>
              {tokenExpiresAt ? (
                <p className="mt-2 text-muted-foreground">
                  Važi do: {new Date(tokenExpiresAt).toLocaleString("sr-RS")}
                </p>
              ) : null}
              <p className="mt-2">
                Iskopirajte token i nastavite na{" "}
                <Link href="/auth/reset-password" className="underline">
                  stranu za reset lozinke
                </Link>
                .
              </p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm">
            Već imate nalog?{" "}
            <Link href="/auth/login" className="underline">
              Prijavite se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}


