import { useForm } from "react-hook-form";
import { apiError } from "../../lib/api";
import { Field, Input, MoneyInput, Textarea } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useProductMutations } from "../../hooks/useProducts";
import { useProductCategories } from "../../hooks/useMeta";
import type { Product } from "../../types";

interface FormValues { name: string; make: string; model: string; category?: string; description?: string; unitPrice: number | string }

export const ProductForm = ({ existing, onDone }: { existing?: Product; onDone: () => void }): JSX.Element => {
  const { create, update } = useProductMutations();
  const { data: categories } = useProductCategories();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: existing
      ? { name: existing.name, make: existing.make, model: existing.model, category: existing.category ?? "", description: existing.description ?? "", unitPrice: existing.unitPrice }
      : { unitPrice: "" },
  });

  const submit = handleSubmit(async (values) => {
    const body = { ...values, unitPrice: Number(values.unitPrice || 0), category: values.category?.trim() || undefined, description: values.description || undefined };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, body });
      else await create.mutateAsync(body);
      toast(existing ? "Product saved" : "Product added");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  const busy = create.isPending || update.isPending;
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Product name" error={errors.name?.message} htmlFor="p-name">
        <Input id="p-name" placeholder="Multipara patient monitor" aria-invalid={Boolean(errors.name)} {...register("name", { required: "Enter a product name" })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Make" error={errors.make?.message} htmlFor="p-make"><Input id="p-make" placeholder="Mindray" aria-invalid={Boolean(errors.make)} {...register("make", { required: "Enter the brand" })} /></Field>
        <Field label="Model" error={errors.model?.message} htmlFor="p-model"><Input id="p-model" placeholder="uMEC 12" aria-invalid={Boolean(errors.model)} {...register("model", { required: "Enter the model" })} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" optional htmlFor="p-cat">
          <Input id="p-cat" list="p-cats" placeholder="Patient monitoring" {...register("category")} />
          <datalist id="p-cats">{categories?.map((c) => <option key={c.name} value={c.name} />)}</datalist>
        </Field>
        <Field label="List price" error={errors.unitPrice?.message} htmlFor="p-price" hint="Before tax. Can be changed per lead.">
          <MoneyInput id="p-price" aria-invalid={Boolean(errors.unitPrice)} {...register("unitPrice", { required: "Enter a price", validate: (v) => Number(v) >= 0 || "Can't be negative" })} />
        </Field>
      </div>
      <Field label="Description" optional htmlFor="p-desc">
        <Textarea id="p-desc" rows={3} placeholder="Key specifications, warranty, accessories" {...register("description")} />
      </Field>
      <div className="flex gap-2 pt-1">
        <button className="btn btn-primary flex-1" disabled={busy}>{busy && <Spinner />} {existing ? "Save product" : "Add product"}</button>
        <button type="button" className="btn" onClick={onDone}>Cancel</button>
      </div>
    </form>
  );
};
