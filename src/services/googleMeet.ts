import { readFileSync } from "node:fs";
import { google } from "googleapis";
import { config } from "../config.js";

export interface MeetEventResult {
  meetLink: string;
  eventId: string;
}

/**
 * Створює подію в Google Calendar з посиланням Google Meet.
 * Потрібен сервісний акаунт Google Workspace з делегуванням домену
 * або календар, до якого надано доступ сервісному акаунту.
 */
export async function createMeetEvent(params: {
  summary: string;
  description: string;
  startIso: string;
  durationMinutes?: number;
}): Promise<MeetEventResult | null> {
  if (!config.google.enabled || !config.google.credentialsPath) {
    return null;
  }

  try {
    const credentials = JSON.parse(
      readFileSync(config.google.credentialsPath, "utf-8")
    );
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });
    const calendar = google.calendar({ version: "v3", auth });

    const start = new Date(params.startIso);
    const end = new Date(
      start.getTime() + (params.durationMinutes ?? 30) * 60 * 1000
    );

    const event = await calendar.events.insert({
      calendarId: config.google.calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        conferenceData: {
          createRequest: {
            requestId: `angelia-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink =
      event.data.hangoutLink ??
      event.data.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri;

    if (!meetLink || !event.data.id) return null;
    return { meetLink, eventId: event.data.id };
  } catch (err) {
    console.error("Google Calendar / Meet помилка:", err);
    return null;
  }
}
