"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRouter } from "next/navigation";

import type { EventClickArg } from "@fullcalendar/core";

function dosDigitos(n: number) {
  return n.toString().padStart(2, "0");
}

export function CalendarioClient() {
  const router = useRouter();

  function alHacerClicEnCita(info: EventClickArg) {
    router.push(`/calendario/citas/${info.event.id}`);
  }

  function alHacerClicEnHorario(info: DateClickArg) {
    const fecha = `${info.date.getFullYear()}-${dosDigitos(info.date.getMonth() + 1)}-${dosDigitos(info.date.getDate())}`;
    const hora = `${dosDigitos(info.date.getHours())}:${dosDigitos(info.date.getMinutes())}`;
    router.push(`/calendario/nueva?fecha=${fecha}&hora=${hora}`);
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      locale={esLocale}
      allDaySlot={false}
      slotMinTime="06:00:00"
      slotMaxTime="20:00:00"
      height="auto"
      events={{ url: "/api/citas", method: "GET" }}
      eventClick={alHacerClicEnCita}
      dateClick={alHacerClicEnHorario}
    />
  );
}
