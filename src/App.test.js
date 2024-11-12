import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App component", () => {
  test("renders learn react link", () => {
    render(<App />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
  });
  test("renders logo image", () => {
    render(<App />);
    const logoElement = screen.getByAltText(/logo/i);
    expect(logoElement).toBeInTheDocument();
  });
  test("has correct link attributesss", () => {
    render(<App />);
    const link = screen.getByText(/learn react/i);
    expect(link).toHaveAttribute("href", "https://reactjs.org");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
