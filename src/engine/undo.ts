import type { ListingFields } from "./worksheet";

export type UndoSnap = {
  item: string;
  freeShip: boolean;
  qty: string;
  shipCharge: string;
  salePercent: string;
};

export function snapListing(fields: ListingFields): UndoSnap {
  return {
    item: fields.item,
    freeShip: fields.freeShip,
    qty: fields.qty,
    shipCharge: fields.shipCharge,
    salePercent: fields.salePercent,
  };
}

export function applyUndoSnap(fields: ListingFields, snap: UndoSnap): ListingFields {
  return { ...fields, ...snap };
}
