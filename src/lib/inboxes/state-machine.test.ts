import { describe, expect, it } from "vitest";
import {
  computePromotions,
  dailyLimitFor,
  HARD_CAP_PER_INBOX,
  RAMP_END_DAY,
  targetStateFor,
  WARMING_DAYS,
  type InboxForPromotion,
} from "./state-machine";

const DAY = 86_400_000;

function isoDaysAgo(days: number, now: Date): string {
  return new Date(now.getTime() - days * DAY).toISOString();
}

function isoDaysFromNow(days: number, now: Date): string {
  return new Date(now.getTime() + days * DAY).toISOString();
}

describe("dailyLimitFor", () => {
  it("returns 0 while warming (days 0..13)", () => {
    for (const d of [0, 1, 7, 13]) {
      expect(dailyLimitFor(d)).toBe(0);
    }
  });

  it("steps through 5 / 10 / 15 during the 3-week ramp", () => {
    expect(dailyLimitFor(WARMING_DAYS)).toBe(5);
    expect(dailyLimitFor(WARMING_DAYS + 6)).toBe(5);
    expect(dailyLimitFor(WARMING_DAYS + 7)).toBe(10);
    expect(dailyLimitFor(WARMING_DAYS + 13)).toBe(10);
    expect(dailyLimitFor(WARMING_DAYS + 14)).toBe(15);
    expect(dailyLimitFor(WARMING_DAYS + 20)).toBe(15);
  });

  it("caps at 20 once active", () => {
    expect(dailyLimitFor(RAMP_END_DAY)).toBe(HARD_CAP_PER_INBOX);
    expect(dailyLimitFor(365)).toBe(HARD_CAP_PER_INBOX);
    expect(dailyLimitFor(10_000)).toBe(HARD_CAP_PER_INBOX);
  });
});

describe("targetStateFor", () => {
  it("warming during the warmup window", () => {
    expect(targetStateFor(0)).toBe("warming");
    expect(targetStateFor(WARMING_DAYS - 1)).toBe("warming");
  });

  it("ramping during the 3-week ramp window", () => {
    expect(targetStateFor(WARMING_DAYS)).toBe("ramping");
    expect(targetStateFor(RAMP_END_DAY - 1)).toBe("ramping");
  });

  it("active once past the ramp", () => {
    expect(targetStateFor(RAMP_END_DAY)).toBe("active");
    expect(targetStateFor(1000)).toBe("active");
  });
});

describe("computePromotions", () => {
  const now = new Date("2026-05-11T12:00:00.000Z");

  function inbox(over: Partial<InboxForPromotion> = {}): InboxForPromotion {
    return {
      id: "i1",
      state: "warming",
      warmup_started_at: null,
      paused_until: null,
      current_daily_limit: 0,
      ...over,
    };
  }

  it("leaves an inbox alone when state and limit already match", () => {
    const day36 = isoDaysAgo(36, now);
    const [d] = computePromotions(
      [inbox({ state: "active", warmup_started_at: day36, current_daily_limit: 20 })],
      now,
    );
    expect(d.next_state).toBe("active");
    expect(d.next_daily_limit).toBe(20);
    expect(d.changed).toBe(false);
  });

  it("promotes warming -> ramping at day 14 and bumps limit to 5", () => {
    const [d] = computePromotions(
      [inbox({ state: "warming", warmup_started_at: isoDaysAgo(14, now) })],
      now,
    );
    expect(d.next_state).toBe("ramping");
    expect(d.next_daily_limit).toBe(5);
    expect(d.changed).toBe(true);
  });

  it("ramps through 10 and 15 at the right days", () => {
    const [d21] = computePromotions(
      [
        inbox({
          state: "ramping",
          warmup_started_at: isoDaysAgo(21, now),
          current_daily_limit: 5,
        }),
      ],
      now,
    );
    expect(d21.next_state).toBe("ramping");
    expect(d21.next_daily_limit).toBe(10);
    expect(d21.changed).toBe(true);

    const [d28] = computePromotions(
      [
        inbox({
          state: "ramping",
          warmup_started_at: isoDaysAgo(28, now),
          current_daily_limit: 10,
        }),
      ],
      now,
    );
    expect(d28.next_daily_limit).toBe(15);
  });

  it("promotes ramping -> active at day 35 with limit 20", () => {
    const [d] = computePromotions(
      [
        inbox({
          state: "ramping",
          warmup_started_at: isoDaysAgo(35, now),
          current_daily_limit: 15,
        }),
      ],
      now,
    );
    expect(d.next_state).toBe("active");
    expect(d.next_daily_limit).toBe(HARD_CAP_PER_INBOX);
    expect(d.changed).toBe(true);
  });

  it("never raises beyond the 20/day hard cap", () => {
    const [d] = computePromotions(
      [
        inbox({
          state: "active",
          warmup_started_at: isoDaysAgo(365, now),
          current_daily_limit: 20,
        }),
      ],
      now,
    );
    expect(d.next_daily_limit).toBeLessThanOrEqual(HARD_CAP_PER_INBOX);
  });

  it("keeps paused inboxes paused until paused_until has elapsed", () => {
    const futureRelease = isoDaysFromNow(3, now);
    const [d] = computePromotions(
      [
        inbox({
          state: "paused",
          warmup_started_at: isoDaysAgo(40, now),
          paused_until: futureRelease,
        }),
      ],
      now,
    );
    expect(d.next_state).toBe("paused");
    expect(d.next_daily_limit).toBe(0);
    expect(d.changed).toBe(false);
  });

  it("re-promotes paused inboxes whose pause has expired", () => {
    const pastRelease = isoDaysAgo(1, now);
    const [d] = computePromotions(
      [
        inbox({
          state: "paused",
          warmup_started_at: isoDaysAgo(40, now),
          paused_until: pastRelease,
        }),
      ],
      now,
    );
    expect(d.next_state).toBe("active");
    expect(d.next_daily_limit).toBe(20);
    expect(d.changed).toBe(true);
  });

  it("keeps an inbox with no warmup_started_at stuck at warming/0", () => {
    const [d] = computePromotions(
      [inbox({ state: "warming", warmup_started_at: null })],
      now,
    );
    expect(d.next_state).toBe("warming");
    expect(d.next_daily_limit).toBe(0);
    expect(d.changed).toBe(false);
  });

  it("indefinitely-paused inbox (paused_until=null) stays paused", () => {
    const [d] = computePromotions(
      [
        inbox({
          state: "paused",
          warmup_started_at: isoDaysAgo(40, now),
          paused_until: null,
        }),
      ],
      now,
    );
    expect(d.next_state).toBe("paused");
    expect(d.changed).toBe(false);
  });

  it("makes batch decisions across heterogeneous inboxes", () => {
    const decisions = computePromotions(
      [
        inbox({
          id: "warming",
          state: "warming",
          warmup_started_at: isoDaysAgo(3, now),
        }),
        inbox({
          id: "ready-to-ramp",
          state: "warming",
          warmup_started_at: isoDaysAgo(14, now),
        }),
        inbox({
          id: "active-steady",
          state: "active",
          warmup_started_at: isoDaysAgo(100, now),
          current_daily_limit: 20,
        }),
      ],
      now,
    );
    const byId = Object.fromEntries(decisions.map((d) => [d.id, d]));
    expect(byId.warming.next_state).toBe("warming");
    expect(byId["ready-to-ramp"].next_state).toBe("ramping");
    expect(byId["ready-to-ramp"].changed).toBe(true);
    expect(byId["active-steady"].changed).toBe(false);
  });
});
