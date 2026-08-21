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

/**
 * Mock data for the demo — no backend behind this. Timestamps are
 * relative-sounding strings rather than real dates since these are
 * illustrative, not live records.
 */
export const DEMO_TICKETS: DemoTicket[] = [
  {
    id: "PG-48213",
    device: "iPhone 14 Pro",
    issue: "Cracked Screen Repair",
    location: "Arnold",
    currentStep: 2,
    events: [
      { note: "Checked in at the front counter — logged and queued.", timestamp: "9:12 AM" },
      { note: "Confirmed it's just the glass and digitizer, nothing deeper.", timestamp: "9:24 AM" },
      { note: "New screen's going in now.", timestamp: "9:41 AM" },
    ],
  },
  {
    id: "PG-30188",
    device: "Samsung Galaxy S23",
    issue: "Battery Replacement",
    location: "Ballwin",
    currentStep: 4,
    events: [
      { note: "Checked in — battery draining fast, confirmed with customer.", timestamp: "Yesterday, 2:03 PM" },
      { note: "Battery health test confirmed — swap approved.", timestamp: "Yesterday, 2:15 PM" },
      { note: "New battery installed and charging normally.", timestamp: "Yesterday, 2:52 PM" },
      { note: "Full charge/discharge cycle passed — good to go.", timestamp: "Yesterday, 3:30 PM" },
      { note: "Sitting at the front counter, ready whenever you are.", timestamp: "Yesterday, 3:35 PM" },
    ],
  },
  {
    id: "PG-59902",
    device: "MacBook Air (M2)",
    issue: "Liquid Damage Cleaning",
    location: "Arnold",
    currentStep: 1,
    events: [
      { note: "Checked in — logged the spill details for the tech.", timestamp: "11:05 AM" },
      { note: "Opened it up for a full internal inspection.", timestamp: "11:20 AM" },
    ],
  },
];
