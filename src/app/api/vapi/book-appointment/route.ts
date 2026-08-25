import { handleVapiTools, type VapiToolCall } from "@/lib/vapi";
import { LOCATIONS } from "@/lib/locations";

/** Same PG-##### style as the /track demo tickets, for a consistent bit. */
function generateReference() {
  return `PG-${Math.floor(10000 + Math.random() * 90000)}`;
}

function bookAppointment(call: VapiToolCall) {
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

  // No real persistence in this demo — logged so it's visible during a
  // test call, not written anywhere durable. See the "Open Questions"
  // section of vapi-front-desk-agent-brief.md for wiring this into the
  // /track demo data as a follow-up.
  console.log("[vapi] mock appointment booked", {
    reference,
    device,
    issue,
    location: loc.slug,
    caller_name,
    callback_number,
    preferred_time,
  });

  return {
    referenceNumber: reference,
    status: "pending confirmation",
    location: loc.name,
    summary: `${device} — ${issue} at ${loc.name}${
      preferred_time ? `, preferred time: ${preferred_time}` : ""
    }`,
    disclaimer:
      "This is a demo booking, not a confirmed real appointment — a person from the shop will call to confirm.",
  };
}

export async function POST(req: Request) {
  return handleVapiTools(req, bookAppointment);
}
