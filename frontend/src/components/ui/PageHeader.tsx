import { type ReactNode } from "react";
import { useDocumentTitle } from "../../lib/hooks";

export const PageHeader = ({ title, subtitle, actions, docTitle }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; docTitle?: string }): JSX.Element => {
  useDocumentTitle(docTitle ?? (typeof title === "string" ? title : undefined));
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="muted mt-1 text-sm">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
};
