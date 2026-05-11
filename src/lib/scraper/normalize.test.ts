import { describe, expect, it } from "vitest";
import {
  dedupeKey,
  dedupeLeads,
  normalizeEmail,
  normalizeLead,
  normalizePhone,
  normalizeUrl,
  parseRating,
  parseReviewCount,
} from "./normalize";
import type { RawLead } from "./types";

function lead(over: Partial<RawLead> = {}): RawLead {
  return {
    business_name: "Acme Co",
    email: null,
    phone: null,
    website: null,
    google_maps_url: null,
    address: null,
    rating: null,
    review_count: null,
    review_snippets: [],
    hours_json: null,
    ...over,
  };
}

describe("normalizePhone", () => {
  it("strips punctuation, keeps leading +", () => {
    expect(normalizePhone("(602) 555-0145")).toBe("6025550145");
    expect(normalizePhone("+1 (602) 555-0145")).toBe("+16025550145");
    expect(normalizePhone(" 602.555.0145 ")).toBe("6025550145");
  });

  it("rejects too-short numbers", () => {
    expect(normalizePhone("123")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail(" Owner@Example.com ")).toBe("owner@example.com");
  });

  it("rejects obviously bad addresses", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("normalizeUrl", () => {
  it("adds https:// when missing", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com/");
  });

  it("preserves https:// when present", () => {
    expect(normalizeUrl("https://example.com/about")).toBe(
      "https://example.com/about",
    );
  });

  it("unwraps Google Maps redirector URLs", () => {
    expect(
      normalizeUrl("https://www.google.com/url?q=https://realbiz.com/"),
    ).toBe("https://realbiz.com/");
  });

  it("returns null for invalid input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl("ht tp://invalid")).toBeNull();
  });
});

describe("normalizeLead", () => {
  it("trims and normalizes nested fields", () => {
    const out = normalizeLead(
      lead({
        business_name: "  Foo Dental ",
        phone: "(602) 555-0145",
        email: "  FOO@FOO.com",
        website: "foo.com",
        review_snippets: [" great place ", "", "  loud  "],
      }),
    );
    expect(out.business_name).toBe("Foo Dental");
    expect(out.phone).toBe("6025550145");
    expect(out.email).toBe("foo@foo.com");
    expect(out.website).toBe("https://foo.com/");
    expect(out.review_snippets).toEqual(["great place", "loud"]);
  });
});

describe("dedupeKey", () => {
  it("prefers google_maps_url > email > phone > slug", () => {
    expect(
      dedupeKey(lead({ google_maps_url: "https://goo.gl/maps/abc" })),
    ).toContain("gmap:");
    expect(dedupeKey(lead({ email: "a@b.com" }))).toContain("email:");
    expect(dedupeKey(lead({ phone: "6025550145" }))).toContain("phone:");
    expect(
      dedupeKey(lead({ business_name: "Acme", address: "123 Main St" })),
    ).toContain("slug:");
  });
});

describe("dedupeLeads", () => {
  it("collapses duplicates and keeps the latest occurrence", () => {
    const out = dedupeLeads([
      lead({ business_name: "Sparse", email: "x@y.com" }),
      lead({
        business_name: "Rich",
        email: "x@y.com",
        phone: "6025550145",
        rating: 4.6,
      }),
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].business_name).toBe("Rich");
    expect(out[0].rating).toBe(4.6);
  });

  it("treats normalized fields as the same key", () => {
    const out = dedupeLeads([
      lead({ phone: "(602) 555-0145" }),
      lead({ phone: "6025550145" }),
    ]);
    expect(out).toHaveLength(1);
  });
});

describe("parseRating", () => {
  it("handles dot and comma decimals", () => {
    expect(parseRating("4.6")).toBe(4.6);
    expect(parseRating("4,6")).toBe(4.6);
    expect(parseRating("4.6 stars")).toBe(4.6);
  });

  it("rejects out-of-range or junk", () => {
    expect(parseRating(null)).toBeNull();
    expect(parseRating("six")).toBeNull();
    expect(parseRating("7.0")).toBeNull();
  });
});

describe("parseReviewCount", () => {
  it("strips parens and commas", () => {
    expect(parseReviewCount("(1,234)")).toBe(1234);
    expect(parseReviewCount("87 reviews")).toBe(87);
  });

  it("expands K shorthand", () => {
    expect(parseReviewCount("1.2K")).toBe(1200);
    expect(parseReviewCount("12k reviews")).toBe(12000);
  });

  it("returns null for unparseable inputs", () => {
    expect(parseReviewCount(null)).toBeNull();
    expect(parseReviewCount("none")).toBeNull();
  });
});
