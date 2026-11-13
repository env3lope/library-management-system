import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";
import Availability from "../../../src/components/books/Availability";

describe("Availability", () => {
  test("shows available and total copies", () => {
    render(<Availability available={3} total={8} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 8")).toBeInTheDocument();
  });

  test("uses the unavailable style when no copies are available", () => {
    const { container } = render(<Availability available="0" total={8} />);

    expect(container.firstChild).toHaveClass("text-availability-text-empty");
    expect(container.querySelector("i")).toHaveClass("bg-availability-dot-empty");
  });
});
