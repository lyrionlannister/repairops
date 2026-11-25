import type { FC } from "react";
import { AsyncSearchSelect } from "@ui/async-search-select/async-search-select";
import { labelFor } from "@commerce/customers/utils/format";
import type { Customer } from "@commerce/customers/types/customers";
import type { CustomerSelectProps } from "../props/customer-select-props";

// Selector de cliente existente -- al elegir uno, el caller decide si
// autollena nombre/telefono (ver repair-note-form-page / quote-form-page).
// Nunca obliga a tener cliente guardado: el caller conserva los campos de
// texto libre para clientes de paso.
export const CustomerSelect: FC<CustomerSelectProps> = ({
  value,
  onChange,
  placeholder = "Busca un cliente por nombre o teléfono (opcional)",
  disabled,
  className = "",
}) => (
  <AsyncSearchSelect<Customer>
    path="/customers/lookup"
    resolvePath={(id) => `/customers/${encodeURIComponent(id)}`}
    value={value}
    onSelect={(customer) => onChange(customer?.id ?? "", customer)}
    getId={(customer) => customer.id}
    getLabel={labelFor}
    placeholder={placeholder}
    ariaLabel="Cliente"
    disabled={disabled}
    className={className}
  />
);
