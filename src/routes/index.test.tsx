import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceApp } from "@/routes/index";

describe("Booking Holdings workspace navigation", () => {
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