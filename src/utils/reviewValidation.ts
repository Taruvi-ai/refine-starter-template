export const REVIEW_REASON_MIN_LENGTH = 20;

export const reviewReasonLimitMessage = (label = "Correction reason") =>
  `${label} must be at least ${REVIEW_REASON_MIN_LENGTH} characters.`;

export const hasReviewReasonLimitError = (value: string) => {
  const length = value.trim().length;
  return length > 0 && length < REVIEW_REASON_MIN_LENGTH;
};

export const reviewErrorDescription = (error: unknown, fallback = "Please try again.") => {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";

  if (/rejection reason must be at least\s+50\s+characters/i.test(message)) {
    return reviewReasonLimitMessage("Rejection reason");
  }

  return message || fallback;
};
