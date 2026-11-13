import { describe, expect, test } from "@jest/globals";
import { formatDate, plural } from "../../src/utils/formatters";

describe("plural", () => {
  test.each([
    [1, "книжка"],
    [3, "книжки"],
    [5, "книжок"],
    [11, "книжок"],
    [21, "книжка"],
    [24, "книжки"],
  ])("returns the correct Ukrainian form for %i", (value, expected) => {
    expect(plural(value, "книжка", "книжки", "книжок")).toBe(expected);
  });
});

describe("formatDate", () => {
  test("formats a date in Ukrainian locale", () => {
    expect(formatDate("2025-01-02T12:00:00Z")).toContain("2025");
  });

  test("shows a dash when a date is missing", () => {
    expect(formatDate(null)).toBe("—");
  });
});
