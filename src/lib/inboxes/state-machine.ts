import type { InboxState, Tables } from "@/types/database";

/**
 * Inbox lifecycle (PROJECT_SPEC.md §2):
 *
 *   new → warming (14 days) → ramping (3 weeks) → active → [paused] → active
 *
 * Daily limits during ramping/active:
 *   - Days 0–13:   warming, limit 0 (Instantly warmup only)
 *   - Day 14–20:   ramping week 1, limit 5
 *   - Day 21–27:   ramping week 2, limit 10
 *   - Day 28–34:   ramping week 3, limit 15
 *   - Day 35+:     active, limit 20 (HARD CAP — never raise)
 *
 * "Day" = whole days elapsed since `warmup_started_at`.
 */

export const HARD_CAP_PER_INBOX = 20;
export const WARMING_DAYS = 14;
export const RAMP_END_DAY = 35;

export type InboxForPromotion = Pick<
  Tables<"inboxes">,
  "id" | "state" | "warmup_started_at" | "paused_until" | "current_daily_limit"
>;

export interface PromotionDecision {
  id: string;
  next_state: InboxState;
  next_daily_limit: number;
  changed: boolean;
}

function daysBetween(startIso: string, now: Date): number {
  const start = new Date(startIso).getTime();
  const diffMs = now.getTime() - start;
  return Math.max(0, Math.floor(diffMs / 86_400_000));
}

/** Returns the daily limit for an inbox that is at `daysSinceWarmup` days in. */
export function dailyLimitFor(daysSinceWarmup: number): number {
  if (daysSinceWarmup < WARMING_DAYS) return 0;
  if (daysSinceWarmup < WARMING_DAYS + 7) return 5;
  if (daysSinceWarmup < WARMING_DAYS + 14) return 10;
  if (daysSinceWarmup < RAMP_END_DAY) return 15;
  return HARD_CAP_PER_INBOX;
}

/** Returns the state an inbox should be in based on age (ignoring `paused`). */
export function targetStateFor(daysSinceWarmup: number): InboxState {
  if (daysSinceWarmup < WARMING_DAYS) return "warming";
  if (daysSinceWarmup < RAMP_END_DAY) return "ramping";
  return "active";
}

/**
 * Pure function: given the current state of inboxes and the current time,
 * return what each inbox should be promoted to. Caller persists.
 *
 * Paused inboxes are left in `paused` until `paused_until` has elapsed, then
 * they re-enter the age-based state. Inboxes without `warmup_started_at` stay
 * `warming` with limit 0 — no promotion until you start the clock.
 */
export function computePromotions(
  inboxes: InboxForPromotion[],
  now: Date = new Date(),
): PromotionDecision[] {
  const decisions: PromotionDecision[] = [];

  for (const inbox of inboxes) {
    if (inbox.state === "paused") {
      const pausedUntil = inbox.paused_until
        ? new Date(inbox.paused_until)
        : null;
      const stillPaused = pausedUntil ? pausedUntil.getTime() > now.getTime() : true;
      if (stillPaused) {
        decisions.push({
          id: inbox.id,
          next_state: "paused",
          next_daily_limit: 0,
          changed: false,
        });
        continue;
      }
    }

    if (!inbox.warmup_started_at) {
      decisions.push({
        id: inbox.id,
        next_state: "warming",
        next_daily_limit: 0,
        changed:
          inbox.state !== "warming" || inbox.current_daily_limit !== 0,
      });
      continue;
    }

    const days = daysBetween(inbox.warmup_started_at, now);
    const nextState = targetStateFor(days);
    const nextLimit = dailyLimitFor(days);

    decisions.push({
      id: inbox.id,
      next_state: nextState,
      next_daily_limit: nextLimit,
      changed:
        inbox.state !== nextState ||
        inbox.current_daily_limit !== nextLimit,
    });
  }

  return decisions;
}
