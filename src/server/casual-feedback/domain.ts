import "server-only";

export function assertValidCasualFeedbackText(text: string) {
  if (!text.trim()) {
    throw new Error("Casual feedback text is required.");
  }
}
