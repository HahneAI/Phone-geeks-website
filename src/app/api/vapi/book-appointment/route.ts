import { handleVapiTools, type VapiToolCall } from "@/lib/vapi";
import { LOCATIONS } from "@/lib/locations";
import { saveBooking, isBookingStoreDurable } from "@/lib/booking-store";

/** Same PG-##### style as regular in-shop ticket numbers, for consistency. */
function generateReference() {
  return `PG-${Math.floor(10000 + Math.random() * 90000)}`;
}

async function bookAppointment(call: VapiToolCall) {
  const { device, issue, location, caller_name, callback_number, preferred_time } =
    call.arguments;

  const missing = [
    !device && "device",
    !issue && "issue",
    !location && "location",
    !caller_name && "name",
    !callback_number && "callback number",
  ].filter(Boolean);

  if (missing.length > 0) {
    const list =
      missing.length === 1
        ? missing[0]
        : `${missing.slice(0, -1).join(", ")}${missing.length > 2 ? "," : ""} and ${missing.at(-1)}`;
    return `I still need your ${list} before I can set that up.`;
  }

  const loc = LOCATIONS.find(
    (l) => l.slug === String(location).toLowerCase()
  );
  if (!loc) {
    return "I can only book at our Arnold or Ballwin shop right now — which one works for you?";
  }

  const reference = generateReference();

  await saveBooking({
    reference,
    device: String(device),
    issue: String(issue),
    locationSlug: loc.slug,
    locationName: loc.name,
    callerName: String(caller_name),
    callbackNumber: String(callback_number),
    preferredTime: preferred_time ? String(preferred_time) : undefined,
    createdAt: new Date().toISOString(),
  });

  console.log("[vapi] appointment booked", {
    reference,
    device,
    issue,
    location: loc.slug,
    caller_name,
    callback_number,
    preferred_time,
    durable: isBookingStoreDurable(),
  });

  return {
    referenceNumber: reference,
    status: "pending confirmation",
    location: loc.name,
    summary: `${device} — ${issue} at ${loc.name}${
      preferred_time ? `, preferred time: ${preferred_time}` : ""
    }`,
    trackable: isBookingStoreDurable(),
    disclaimer:
      "This is a demo booking, not a confirmed real appointment — a person from the shop will call to confirm." +
      (isBookingStoreDurable()
        ? " You can look up this reference number on our website's Track Repair page."
        : ""),
  };
}

export async function POST(req: Request) {
  return handleVapiTools(req, bookAppointment);
}
