import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceApp } from "@/routes/index";

describe("Booking Holdings workspace navigation", () => {
  it("lets the user hide and show the pages navigation", () => {
    render(<WorkspaceApp />);

    const navigation = screen.getByRole("navigation", { name: "Pages navigation" });
    expect(navigation).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide pages navigation" }));
    expect(navigation.parentElement).toHaveClass("md:hidden");

    fireEvent.click(screen.getByRole("button", { name: "Show pages navigation" }));
    expect(navigation.parentElement).not.toHaveClass("md:hidden");
  });

  it("starts on Page 1 and switches among all five blank workspaces without leaving the page", () => {
    render(<WorkspaceApp />);

    const navigation = screen.getByRole("navigation", { name: "Pages navigation" });
    expect(screen.getByRole("heading", { level: 1, name: "Page 1" })).toBeInTheDocument();

    for (const pageNumber of [2, 3, 4, 5, 1]) {
      fireEvent.click(within(navigation).getByRole("button", { name: new RegExp(`Page ${pageNumber}`) }));

      expect(screen.getByRole("heading", { level: 1, name: `Page ${pageNumber}` })).toBeInTheDocument();
      expect(screen.getByLabelText(`Page ${pageNumber} blank workspace`)).toBeInTheDocument();
      expect(within(navigation).getByRole("button", { name: new RegExp(`Page ${pageNumber}`) })).toHaveAttribute("aria-current", "page");
    }
  });
});