"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import { Banknote, Edit2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type {
  CreateBudgetCategoryPayload,
  ProjectBudgetCategory,
  ProjectBudgetSummary,
  UpdateBudgetCategoryPayload,
  UpdateBudgetPayload
} from "@/src/types/projects";

type BudgetFormValues = {
  total: number;
  spent: number;
  currency: string;
};

type CategoryFormValues = {
  category: string;
  allocated: number;
  spent: number;
};

type ProjectBudgetProps = {
  budget: ProjectBudgetSummary;
  onUpdateBudget: (payload: UpdateBudgetPayload) => Promise<unknown>;
  onCreateCategory: (payload: CreateBudgetCategoryPayload) => Promise<unknown>;
  onUpdateCategory: (categoryId: string, payload: UpdateBudgetCategoryPayload) => Promise<unknown>;
  onDeleteCategory: (categoryId: string) => Promise<unknown>;
  isMutating?: boolean;
};

const palette = ["#2563eb", "#16a34a", "#9333ea", "#f97316", "#db2777"];

export function ProjectBudget({
  budget,
  onUpdateBudget,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  isMutating
}: ProjectBudgetProps) {
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectBudgetCategory | null>(null);

  const budgetForm = useForm<BudgetFormValues>({
    defaultValues: {
      total: budget.total,
      spent: budget.spent,
      currency: budget.currency || "EUR"
    }
  });

  const categoryForm = useForm<CategoryFormValues>({
    defaultValues: {
      category: "",
      allocated: 0,
      spent: 0
    }
  });

  const utilisation = useMemo(() => {
    const total = Math.max(budget.total, 0);
    const spent = Math.min(Math.max(budget.spent, 0), total);
    const remaining = Math.max(total - spent, 0);
    return {
      total,
      spent,
      remaining,
      percent: total === 0 ? 0 : Math.min(Math.round((spent / total) * 100), 100)
    };
  }, [budget]);

  const chartData = [
    { name: "Potrošeno", value: utilisation.spent, fill: "hsl(var(--primary))" },
    { name: "Preostalo", value: utilisation.remaining, fill: "hsl(var(--muted))" }
  ];

  const openBudgetDialog = () => {
    budgetForm.reset({
      total: budget.total,
      spent: budget.spent,
      currency: budget.currency
    });
    setIsBudgetDialogOpen(true);
  };

  const openCategoryDialog = (category?: ProjectBudgetCategory) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        category: category.category,
        allocated: category.allocated,
        spent: category.spent
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset({
        category: "",
        allocated: 0,
        spent: 0
      });
    }
    setIsCategoryDialogOpen(true);
  };

  const submitBudget = async (values: BudgetFormValues) => {
    await onUpdateBudget({
      total: Number(values.total),
      spent: Number(values.spent),
      currency: values.currency
    });
    setIsBudgetDialogOpen(false);
  };

  const submitCategory = async (values: CategoryFormValues) => {
    const payload: CreateBudgetCategoryPayload = {
      category: values.category,
      allocated: Number(values.allocated),
      spent: Number(values.spent)
    };

    if (editingCategory) {
      await onUpdateCategory(editingCategory.id, payload);
    } else {
      await onCreateCategory(payload);
    }

    setIsCategoryDialogOpen(false);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await onDeleteCategory(categoryId);
  };

  return (
    <Card className="border-none bg-card/80 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold">Budžet</CardTitle>
          <p className="text-muted-foreground text-sm">
            Pregled ukupnog budžeta, utrošenih sredstava i raspodele po kategorijama.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openBudgetDialog}>
            <Edit2 className="mr-2 size-4" />
            Ažuriraj budžet
          </Button>
          <Button size="sm" onClick={() => openCategoryDialog()}>
            <Plus className="mr-2 size-4" />
            Nova kategorija
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-card/80 p-6 shadow-inner">
          <div className="text-sm font-semibold uppercase tracking-wide text-primary">Ukupan budžet</div>
          <div className="mt-2 flex items-baseline gap-2 text-3xl font-bold text-primary">
            {budget.currency} {utilisation.total.toLocaleString("sr-RS")}
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="110%"
                barSize={18}
                data={chartData}
                startAngle={90}
                endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, utilisation.total || 1]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={30} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Potrošeno</span>
              <span className="font-medium">
                {budget.currency} {utilisation.spent.toLocaleString("sr-RS")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Preostalo</span>
              <span className="font-medium">
                {budget.currency} {utilisation.remaining.toLocaleString("sr-RS")}
              </span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Iskorišćenost</span>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {utilisation.percent}%
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {budget.categories.length === 0 ? (
            <div className="h-full rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Još uvek nema raspodele budžeta. Dodajte kategorije kako biste pratili troškove po segmentima.
            </div>
          ) : (
            budget.categories.map((category, index) => {
              const color = palette[index % palette.length];
              const percent =
                category.allocated === 0
                  ? 0
                  : Math.min(Math.round((category.spent / category.allocated) * 100), 999);
              return (
                <div
                  key={category.id}
                  className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-4 shadow-sm transition hover:shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: color, boxShadow: `0 0 0 4px ${color}1a` }}
                        />
                        <span className="text-sm font-semibold text-foreground">{category.category}</span>
                      </div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wide">
                        Alocirano: {budget.currency} {category.allocated.toLocaleString("sr-RS")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                        {percent}%
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openCategoryDialog(category)}>
                        <Edit2 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1">
                      <Banknote className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {budget.currency} {category.spent.toLocaleString("sr-RS")}
                      </span>
                      <span className="text-muted-foreground text-xs uppercase tracking-wide">
                        potrošeno
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ažuriraj budžet</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={budgetForm.handleSubmit(submitBudget)}>
            <div className="space-y-2">
              <Label htmlFor="total">Ukupan budžet</Label>
              <Input id="total" type="number" step="0.01" {...budgetForm.register("total", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spent">Potrošeno</Label>
              <Input id="spent" type="number" step="0.01" {...budgetForm.register("spent", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Valuta</Label>
              <Controller
                control={budgetForm.control}
                name="currency"
                render={({ field }) => (
                  <Input
                    id="currency"
                    placeholder="npr. EUR"
                    maxLength={4}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsBudgetDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isMutating}>
                Sačuvaj
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Ažuriraj kategoriju" : "Dodaj budžetsku kategoriju"}
            </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={categoryForm.handleSubmit(submitCategory)}>
            <div className="space-y-2">
              <Label htmlFor="category">Naziv kategorije</Label>
              <Input
                id="category"
                placeholder="npr. Dizajn, DevOps..."
                {...categoryForm.register("category", { required: true })}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="allocated">Alocirano</Label>
                <Input
                  id="allocated"
                  type="number"
                  step="0.01"
                  {...categoryForm.register("allocated", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spent">Potrošeno</Label>
                <Input
                  id="spent"
                  type="number"
                  step="0.01"
                  {...categoryForm.register("spent", { valueAsNumber: true })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={isMutating}>
                Sačuvaj
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

