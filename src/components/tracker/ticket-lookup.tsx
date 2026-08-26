"use client";

import { useState, type FormEvent } from "react";
import { Search, MapPin, Bell, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TRACKER_STEPS, type DemoTicket } from "@/lib/tracker-data";
import { RepairStepper } from "./repair-stepper";

export function TicketLookup() {
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState<DemoTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [notifyMe, setNotifyMe] = useState(false);

  async function lookup(id: string) {
    const trimmed = id.trim();
    if (!trimmed) return;

    setTicket(null);
    setNotFound(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.found) {
        setTicket(data.ticket);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    lookup(query);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your ticket number (e.g. PG-56276)"
              className="w-full rounded-lg border-2 border-border py-2.5 pl-10 pr-3.5 text-sm outline-none transition-colors focus:border-brand-blue"
            />
          </div>
          <Button type="submit">Track It</Button>
        </form>
      </Card>

      {loading && (
        <Card className="mt-6 p-6 text-center text-sm text-muted-foreground">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-brand-red" />
          <p className="mt-2">Checking for your ticket…</p>
        </Card>
      )}

      {!loading && notFound && (
        <Card className="mt-6 p-6 text-center">
          <p className="font-medium text-brand-navy">
            We couldn&rsquo;t find a ticket with that number.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Double-check the number, or give the shop a call and
            we&rsquo;ll look yours up directly.
          </p>
        </Card>
      )}

      {!loading && ticket && (
        <Card className="mt-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ticket {ticket.id}
              </p>
              <h2 className="mt-1 text-xl font-bold text-brand-navy">
                {ticket.device}
              </h2>
              <p className="text-sm text-muted-foreground">{ticket.issue}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue-light px-3 py-1 text-xs font-semibold text-brand-blue">
              <MapPin className="h-3.5 w-3.5" />
              {ticket.location}
            </span>
          </div>

          {ticket.currentStep === TRACKER_STEPS.length - 1 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Ready for pickup — swing by whenever works for you.
            </div>
          )}

          <div className="mt-8">
            <RepairStepper ticket={ticket} />
          </div>

          <label className="mt-8 flex items-start gap-2.5 rounded-lg border border-border p-3.5 text-sm">
            <input
              type="checkbox"
              checked={notifyMe}
              onChange={(e) => setNotifyMe(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-red"
            />
            <span className="text-muted-foreground">
              <Bell className="mr-1 inline h-3.5 w-3.5 text-brand-red" />
              Text me when it&rsquo;s ready for pickup
              <span className="block text-xs text-muted-foreground/70">
                (Demo only — not wired up to real notifications)
              </span>
            </span>
          </label>
        </Card>
      )}
    </div>
  );
}
