import { SERVICE_CATEGORIES } from "./services-data";

export interface SymptomOption {
  /** Plain-language symptom description, not a repair-catalog name. */
  label: string;
  /** Must match a RepairItem.name in this category's repairs array. */
  repairName: string;
  /** Short "why we think so" line shown on the result screen. */
  reasoning: string;
}

/** Only categories with a real repair catalog get a symptom flow. */
export const DIAGNOSE_CATEGORIES = SERVICE_CATEGORIES.filter(
  (c) => c.repairs.length > 0
);

export const SYMPTOMS_BY_CATEGORY: Record<string, SymptomOption[]> = {
  smartphone: [
    {
      label: "The screen is cracked or the glass is broken",
      repairName: "Screen Repair",
      reasoning: "Cracked glass or a broken digitizer is almost always a screen swap.",
    },
    {
      label: "Battery drains fast or dies without warning",
      repairName: "Battery Replacement",
      reasoning: "A battery that's lost capacity is the most common cause of sudden shutdowns.",
    },
    {
      label: "Won't charge, or the cable has to be held at an angle",
      repairName: "Charging Port Repair",
      reasoning: "That's a classic sign of a worn or bent charging port, not the battery itself.",
    },
    {
      label: "Camera is blurry, black, or won't focus",
      repairName: "Camera Replacement",
      reasoning: "Usually the camera module itself, especially if it happened suddenly.",
    },
    {
      label: "Can't hear calls, or audio sounds crackly",
      repairName: "Speaker / Mic Repair",
      reasoning: "Points to the speaker or microphone assembly rather than a software issue.",
    },
    {
      label: "It got wet or was dropped in liquid",
      repairName: "Water Damage Diagnostic",
      reasoning: "Water damage needs a hands-on diagnostic before we can quote a fix.",
    },
  ],
  computer: [
    {
      label: "Screen is cracked, has lines, or won't display right",
      repairName: "Screen Replacement",
      reasoning: "Physical screen damage or display artifacts point to a panel replacement.",
    },
    {
      label: "Battery drains fast or won't hold a charge",
      repairName: "Battery Replacement",
      reasoning: "Laptop batteries degrade over time — this is the most common fix for it.",
    },
    {
      label: "Keys don't register, or the trackpad is unresponsive",
      repairName: "Keyboard / Trackpad Repair",
      reasoning: "Usually a hardware issue with the keyboard or trackpad assembly.",
    },
    {
      label: "Running slow, popups, or acting strange",
      repairName: "Virus Removal / Software Fix",
      reasoning: "Classic signs of malware or a software issue rather than hardware.",
    },
    {
      label: "It won't turn on and I need what's on it",
      repairName: "Data Recovery",
      reasoning: "Before anything else, we'd want to see what's recoverable off the drive.",
    },
    {
      label: "Spilled something on it or it got wet",
      repairName: "Liquid Damage Cleaning",
      reasoning: "Liquid damage needs cleaning and inspection before we know the full scope.",
    },
  ],
  tablet: [
    {
      label: "The screen is cracked or unresponsive",
      repairName: "Screen Repair",
      reasoning: "Cracked glass or a dead digitizer means a screen replacement.",
    },
    {
      label: "Battery drains fast or won't hold a charge",
      repairName: "Battery Replacement",
      reasoning: "The battery is the usual culprit for sudden power loss.",
    },
    {
      label: "Won't charge or the cable barely stays in",
      repairName: "Charging Port Repair",
      reasoning: "Sounds like a worn charging port rather than the battery.",
    },
  ],
  console: [
    {
      label: "No picture, or the HDMI connection is loose/flickering",
      repairName: "HDMI Port Repair",
      reasoning: "A loose or damaged HDMI port is the most common cause of that.",
    },
    {
      label: "Won't read discs, or makes grinding noises",
      repairName: "Disc Drive Repair",
      reasoning: "Points to the disc drive mechanism rather than the console itself.",
    },
    {
      label: "Runs hot, shuts off randomly, or the fan is loud",
      repairName: "Overheating / Fan Cleaning",
      reasoning: "Classic dust buildup or thermal paste issue — a cleaning usually fixes it.",
    },
    {
      label: "A controller isn't responding right",
      repairName: "Controller Repair",
      reasoning: "Stick drift or unresponsive buttons are a controller-side repair.",
    },
  ],
};
