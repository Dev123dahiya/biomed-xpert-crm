import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

export const Spinner = ({ className }: { className?: string }): JSX.Element => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
);
