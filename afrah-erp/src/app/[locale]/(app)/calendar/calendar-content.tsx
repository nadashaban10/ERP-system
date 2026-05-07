"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HallSelector } from "@/components/shared/hall-selector";
import { MOCK_BOOKINGS } from "@/lib/mock-data";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#4F46E5",
  on_hold: "#D97706",
  inquiry: "#0284C7",
  completed: "#64748B",
  cancelled: "#DC2626",
};

export function CalendarContent() {
  const t = useTranslations("calendar");
  const tStatus = useTranslations("status");
  const locale = useLocale();
  const router = useRouter();
  const calRef = useRef<FullCalendar>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();

  const events = MOCK_BOOKINGS.filter(
    (b) => b.status !== "cancelled"
  ).map((b) => ({
    id: b.id,
    title: b.client?.name ?? "Unknown",
    start: b.event_date,
    allDay: true,
    backgroundColor: STATUS_COLORS[b.status] ?? "#6366F1",
    borderColor: "transparent",
    textColor: "#fff",
    extendedProps: {
      status: b.status,
      hall: b.hall?.name,
      shift: b.shift,
      guestCount: b.guest_count,
    },
    classNames: [`fc-event-${b.status}`],
  }));

  function handleEventClick(arg: EventClickArg) {
    router.push(`/${locale}/bookings/${arg.event.id}`);
  }

  function handleDateClick(arg: DateClickArg) {
    setSelectedDate(arg.dateStr);
    setWizardOpen(true);
  }

  function renderEventContent(arg: EventContentArg) {
    const { hall, shift } = arg.event.extendedProps;
    return (
      <div className="px-1 py-0.5 overflow-hidden w-full">
        <p className="text-[11px] font-semibold leading-tight truncate">
          {arg.event.title}
        </p>
        {hall && (
          <p className="text-[10px] opacity-80 truncate">
            {hall}
            {shift ? ` · ${shift}` : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <HallSelector />
          <Button onClick={() => setWizardOpen(true)} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {t("newBooking")}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Calendar card */}
        <Card className="flex-1 overflow-hidden p-4">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,listWeek",
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventContent={renderEventContent}
            locale={locale}
            direction={locale === "ar" ? "rtl" : "ltr"}
            height="auto"
            dayMaxEvents={3}
            nowIndicator
            selectable
            selectMirror
            buttonText={{
              today: t("today"),
              month: t("month"),
              week: t("week"),
              day: t("day"),
              list: t("list"),
            }}
          />
        </Card>

        {/* Legend */}
        <Card className="lg:w-48 p-4 h-fit">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            {t("legend")}
          </p>
          <div className="space-y-2">
            {(
              [
                ["confirmed", t("confirmed")],
                ["on_hold", t("onHold")],
                ["inquiry", t("inquiry")],
                ["completed", t("completed")],
              ] as [string, string][]
            ).map(([status, label]) => (
              <div key={status} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                />
                <span className="text-xs text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Booking wizard */}
      <BookingWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        defaultDate={selectedDate}
      />
    </div>
  );
}
