import { getBooking } from "@/lib/booking-store";
import type { DemoTicket } from "@/lib/tracker-data";

/**
 * Public lookup for the /track page's TicketLookup component — checks a
 * phone-booked appointment (see /api/vapi/book-appointment) and shapes it
 * as a DemoTicket so RepairStepper renders it with zero changes. A
 * booking always starts at step 0 ("Dropped Off") since
 * the caller hasn't brought the device in yet — the phone call only
 * requests an appointment, it doesn't check the device in.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const booking = await getBooking(decodeURIComponent(id));

  if (!booking) {
    return Response.json({ found: false }, { status: 200 });
  }

  const timestamp = new Date(booking.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const ticket: DemoTicket = {
    id: booking.reference,
    device: booking.device,
    issue: booking.issue,
    location: booking.locationName,
    currentStep: 0,
    events: [
      {
        note: booking.preferredTime
          ? `Booked over the phone — preferred time: ${booking.preferredTime}. Bring your device by to check in.`
          : "Booked over the phone. Bring your device by to check in.",
        timestamp,
      },
    ],
  };

  return Response.json({ found: true, ticket }, { status: 200 });
}
