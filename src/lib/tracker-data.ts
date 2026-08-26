export const TRACKER_STEPS = [
  "Dropped Off",
  "Diagnosing",
  "Repairing",
  "Quality Check",
  "Ready for Pickup",
] as const;

export interface TrackerStepEvent {
  note: string;
  timestamp: string;
}

export interface DemoTicket {
  id: string;
  device: string;
  issue: string;
  location: string;
  /** Index into TRACKER_STEPS the ticket currently sits at. */
  currentStep: number;
  /** One entry per completed/current step, same order as TRACKER_STEPS. */
  events: TrackerStepEvent[];
}
