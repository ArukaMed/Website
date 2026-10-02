import type { Employee } from "@aegis/types";

export type ProfileTab =
  | "overview"
  | "personal"
  | "job-org"
  | "pay-statutory"
  | "documents"
  | "assets";

export type EditCardType =
  | "identity"
  | "contact"
  | "emergency"
  | "address"
  | "job"
  | "statutory"
  | "banking"
  | "qr-settings"
  | null;
