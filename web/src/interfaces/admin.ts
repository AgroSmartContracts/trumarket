import { DealStatus } from "./shipment";

export interface IGetDealsParameters {
  offset?: number;
  status?: DealStatus;
  emailSearch?: string;
}

export interface HeadCell {
  disablePadding: boolean;
  id: any;
  label: string;
  numeric: boolean;
}

export type Order = "asc" | "desc";
