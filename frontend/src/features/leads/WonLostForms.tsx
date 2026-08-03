import { useForm } from "react-hook-form";
import { apiError } from "../../lib/api";
import { FieldError, Input, Textarea } from "../../components/ui/Field";
import { Spinner } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { useLeadMutations } from "../../hooks/useLeads";

export const WonForm = ({ leadId, onDone }: { leadId: string; onDone: () => void }): JSX.Element => {
  const { markWon } = useLeadMutations(leadId);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<{ finalValue: number; invoiceNumber?: string; closingDate?: string }>();

  const submit = handleSubmit(async (values) => {
    try {
      await markWon.mutateAsync({
        finalValue: Number(values.finalValue),
        invoiceNumber: values.invoiceNumber || undefined,
        closingDate: values.closingDate ? new Date(values.closingDate).toISOString() : undefined,
      });
      toast("Deal marked won");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="muted text-sm">Equipment lines are copied from the lead and can be edited afterwards.</p>
      <div>
        <label className="label">Final negotiated value</label>
        <Input className="mono mt-1" type="number" step="1" {...register("finalValue", { required: "Required", min: { value: 1, message: "Must be greater than zero" } })} />
        <FieldError message={errors.finalValue?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Invoice number</label><Input className="mt-1" {...register("invoiceNumber")} /></div>
        <div><label className="label">Closing date</label><Input className="mt-1" type="date" {...register("closingDate")} /></div>
      </div>
      <button className="btn btn-primary w-full justify-center" disabled={markWon.isPending}>{markWon.isPending && <Spinner />} Mark won</button>
    </form>
  );
};

export const LostForm = ({ leadId, onDone }: { leadId: string; onDone: () => void }): JSX.Element => {
  const { markLost } = useLeadMutations(leadId);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<{ reason: string; competitor?: string; remarks?: string }>();

  const submit = handleSubmit(async (values) => {
    try {
      await markLost.mutateAsync(values);
      toast("Deal marked lost");
      onDone();
    } catch (err) {
      toast(apiError(err).message, "error");
    }
  });

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">Reason</label>
        <Input className="mt-1" {...register("reason", { required: "A reason is required" })} />
        <FieldError message={errors.reason?.message} />
      </div>
      <div><label className="label">Competitor</label><Input className="mt-1" {...register("competitor")} /></div>
      <div><label className="label">Remarks</label><Textarea className="mt-1" rows={2} {...register("remarks")} /></div>
      <button className="btn btn-danger w-full justify-center" disabled={markLost.isPending}>{markLost.isPending && <Spinner />} Mark lost</button>
    </form>
  );
};
