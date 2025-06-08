import { describe, it, expect, vi, afterEach } from "vitest";
import * as SolidWeb from "solid-js/web";

// Use "describe" to create a test suite
describe("Example tests for index.src expected behaviour", () => {
  // Runs after each test case
  afterEach(() => {
    vi.resetModules(); // reset all modules after the test is done
    document.body.innerHTML = ""; // reset the html after the test is done
  });

  // Use "it" to define a test case
  it("Renders <App /> into #root when #root exists", async () => {
    // Spy on the render function so we can check if it was called
    const renderSpy = vi.spyOn(SolidWeb, "render");

    // Create a custom root element
    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);

    // Import index.tsx
    await import("../src/index");

    // Assert render was called with our custom root element
    expect(renderSpy).toHaveBeenCalledWith(expect.any(Function), root);
  });

  it("throws an error if #root does not exist", async () => {
    await expect(import("../src/index")).rejects.toThrow();
  });
});
