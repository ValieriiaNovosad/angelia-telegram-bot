export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  schedule: {
    weekdays: string;
    friday: string;
    weekend: string;
  };
  directions: string;
  /** Текст про цілодобову роботу бота (редагується в data/clinic.json) */
  support247: string;
}

/** 0 = неділя, 1 = понеділок, … 6 = субота */
export interface DoctorAvailability {
  days: number[];
  from: string;
  to: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  schedule: string;
  availability: DoctorAvailability[];
  slotMinutes?: number;
  room: string;
  bio: string;
  online: boolean;
}

export interface ServiceItem {
  name: string;
  price: string;
}

export interface ServiceCategory {
  category: string;
  items: ServiceItem[];
}

export interface ClinicDirection {
  id: string;
  title: string;
  summary: string;
  services: string[];
  doctorIds: string[];
}

export interface HandbookSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Appointment {
  id: number;
  user_id: number;
  username: string | null;
  patient_name: string;
  phone: string;
  doctor_id: string;
  datetime: string;
  is_online: number;
  status: AppointmentStatus;
  meet_link: string | null;
  reminder_sent: number;
  created_at: string;
}

export interface BotContext {
  // Extended in bot.ts via SessionFlavor if needed
}
