import { FOLLOW_UP_REMINDERS } from "@/lib/constants";

export function reminderMinutes(offset?: string | null) {
  return FOLLOW_UP_REMINDERS.find((r) => r.value === offset)?.minutes ?? 0;
}

export function reminderLabel(offset?: string | null) {
  return FOLLOW_UP_REMINDERS.find((r) => r.value === offset)?.label ?? "No reminder";
}

export function computeRemindAt(when: Date, offset?: string | null) {
  const minutes = reminderMinutes(offset);
  if (!minutes) return null;
  return new Date(when.getTime() - minutes * 60 * 1000);
}

/** 1 hour / 2 hours / 1 day reminders need that much lead time before the meeting. */
export function reminderRequiresLeadTime(offset?: string | null) {
  const minutes = reminderMinutes(offset);
  return minutes >= 60;
}

export function reminderHasEnoughLeadTime(when: Date, offset?: string | null, now = new Date()) {
  if (!reminderRequiresLeadTime(offset)) return true;
  return when.getTime() - now.getTime() >= reminderMinutes(offset) * 60 * 1000;
}

export function reminderLeadTimeAlert(offset?: string | null) {
  const minutes = reminderMinutes(offset);
  if (minutes >= 1440) return "A 1 day reminder needs at least 24 hours between now and the scheduled time.";
  if (minutes >= 120) return "A 2 hour reminder needs at least 2 hours between now and the scheduled time.";
  if (minutes >= 60) return "A 1 hour reminder needs at least 1 hour between now and the scheduled time.";
  return "";
}

export function playReminderSound() {
  const Ctx = window.AudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const beep = (start: number, freq: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.24);
  };
  const t = ctx.currentTime;
  beep(t, 880);
  beep(t + 0.28, 1174);
}
