import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SlideOver } from "../ui/Modal";
import { LeadForm } from "../../features/leads/LeadForm";
import { CustomerForm } from "../../features/customers/CustomerForm";
import { ProductForm } from "../../features/products/ProductForm";
import type { ComboOption } from "../ui/Combobox";

interface CreateState {
  openLead: (customer?: ComboOption) => void;
  openCustomer: () => void;
  openProduct: () => void;
}

const CreateContext = createContext<CreateState | undefined>(undefined);

// One place for the "new record" drawers, so any page, the command palette
// and the top bar can open them.
export const CreateProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const navigate = useNavigate();
  const [lead, setLead] = useState<{ customer?: ComboOption } | null>(null);
  const [customer, setCustomer] = useState(false);
  const [product, setProduct] = useState(false);

  const openLead = useCallback((c?: ComboOption) => setLead({ customer: c }), []);
  const openCustomer = useCallback(() => setCustomer(true), []);
  const openProduct = useCallback(() => setProduct(true), []);

  return (
    <CreateContext.Provider value={{ openLead, openCustomer, openProduct }}>
      {children}
      <SlideOver open={Boolean(lead)} title="New lead" description="Capture an enquiry and its equipment of interest." onClose={() => setLead(null)} width={560}>
        {lead && (
          <LeadForm
            initialCustomer={lead.customer}
            onDone={(id) => {
              setLead(null);
              if (id) navigate(`/leads/${id}`);
            }}
          />
        )}
      </SlideOver>
      <SlideOver open={customer} title="New customer" description="A doctor, hospital or clinic you sell to." onClose={() => setCustomer(false)} width={540}>
        {customer && (
          <CustomerForm
            onDone={(id) => {
              setCustomer(false);
              if (id) navigate(`/customers/${id}`);
            }}
          />
        )}
      </SlideOver>
      <SlideOver open={product} title="New product" description="Add equipment to the catalogue." onClose={() => setProduct(false)}>
        {product && <ProductForm onDone={() => setProduct(false)} />}
      </SlideOver>
    </CreateContext.Provider>
  );
};

export const useCreate = (): CreateState => {
  const ctx = useContext(CreateContext);
  if (!ctx) throw new Error("useCreate must be used within CreateProvider");
  return ctx;
};
