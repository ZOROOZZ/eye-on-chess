import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Skeleton, BoardSkeleton, MoveListSkeleton, ProfileSkeleton } from "./Skeleton";

describe("Skeleton components", () => {
  it("should render Skeleton with custom class", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("h-10");
  });

  it("should render Skeleton with default class when none provided", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("animate-pulse");
    expect(el.className).toContain("bg-gray-700");
  });

  it("should render BoardSkeleton with loading text", () => {
    const { container } = render(<BoardSkeleton />);
    expect(container.textContent).toContain("Loading board...");
  });

  it("should render BoardSkeleton with square aspect ratio", () => {
    const { container } = render(<BoardSkeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("aspect-square");
  });

  it("should render MoveListSkeleton with multiple rows", () => {
    const { container } = render(<MoveListSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(5);
  });

  it("should render ProfileSkeleton with avatar and text placeholders", () => {
    const { container } = render(<ProfileSkeleton />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(3);
  });
});
