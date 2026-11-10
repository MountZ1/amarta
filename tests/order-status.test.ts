import { describe, expect, it } from "bun:test";
import {
  canTransitionStatus,
  getNextAllowedStatuses,
  ALLOWED_TRANSITIONS,
} from "../src/lib/order-status";

describe("Order Status Transition Rules", () => {
  it("should allow pending to transition only to processing or cancelled", () => {
    expect(canTransitionStatus("pending", "processing")).toBe(true);
    expect(canTransitionStatus("pending", "cancelled")).toBe(true);

    expect(canTransitionStatus("pending", "shipped")).toBe(false);
    expect(canTransitionStatus("pending", "completed")).toBe(false);
    expect(canTransitionStatus("pending", "pending")).toBe(false);

    expect(getNextAllowedStatuses("pending")).toEqual(["processing", "cancelled"]);
  });

  it("should allow processing to transition only to shipped", () => {
    expect(canTransitionStatus("processing", "shipped")).toBe(true);

    expect(canTransitionStatus("processing", "pending")).toBe(false);
    expect(canTransitionStatus("processing", "cancelled")).toBe(false);
    expect(canTransitionStatus("processing", "completed")).toBe(false);

    expect(getNextAllowedStatuses("processing")).toEqual(["shipped"]);
  });

  it("should allow shipped to transition only to completed", () => {
    expect(canTransitionStatus("shipped", "completed")).toBe(true);

    expect(canTransitionStatus("shipped", "pending")).toBe(false);
    expect(canTransitionStatus("shipped", "processing")).toBe(false);
    expect(canTransitionStatus("shipped", "cancelled")).toBe(false);

    expect(getNextAllowedStatuses("shipped")).toEqual(["completed"]);
  });

  it("should not allow completed or cancelled to transition to any status", () => {
    expect(canTransitionStatus("completed", "pending")).toBe(false);
    expect(canTransitionStatus("completed", "processing")).toBe(false);
    expect(canTransitionStatus("completed", "shipped")).toBe(false);
    expect(canTransitionStatus("completed", "cancelled")).toBe(false);

    expect(canTransitionStatus("cancelled", "pending")).toBe(false);
    expect(canTransitionStatus("cancelled", "processing")).toBe(false);
    expect(canTransitionStatus("cancelled", "shipped")).toBe(false);
    expect(canTransitionStatus("cancelled", "completed")).toBe(false);

    expect(getNextAllowedStatuses("completed")).toEqual([]);
    expect(getNextAllowedStatuses("cancelled")).toEqual([]);
  });
});
