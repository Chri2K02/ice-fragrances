import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoPlayer } from "@/components/VideoPlayer";

beforeAll(() => {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test shim
  global.IntersectionObserver = IO;
  window.HTMLMediaElement.prototype.play = async () => {};
  window.HTMLMediaElement.prototype.pause = () => {};
});

describe("VideoPlayer", () => {
  it("renders a muted, looping video with the poster", () => {
    render(<VideoPlayer src="/media/x.mp4" poster="/media/x.jpg" label="X" />);
    const video = screen.getByTestId("video") as HTMLVideoElement;
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("poster", "/media/x.jpg");
    expect(video.muted).toBe(true);
  });

  it("toggles mute when the unmute button is clicked", async () => {
    render(<VideoPlayer src="/media/x.mp4" poster="/media/x.jpg" label="X" />);
    const video = screen.getByTestId("video") as HTMLVideoElement;
    const button = screen.getByRole("button", { name: /unmute/i });
    await userEvent.click(button);
    expect(video.muted).toBe(false);
    expect(screen.getByRole("button", { name: /mute/i })).toBeInTheDocument();
  });
});
