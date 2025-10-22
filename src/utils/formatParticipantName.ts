export const MAX_PARTICIPANT_NAME_LENGTH = 10;

export const sanitizeDisplayName = (raw: string): string =>
  raw
    .replace(/\d+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

export const sanitizeDisplayNameInput = (raw: string): string => {
  const withoutDigits = raw.replace(/\d+/g, "");
  const collapsed = withoutDigits.replace(/\s{2,}/g, " ");
  const trimmedStart = collapsed.replace(/^\s+/, "");
  const trimmedEnd = trimmedStart.trimEnd();

  if (!trimmedEnd) {
    return "";
  }

  return /\s$/.test(collapsed) ? `${trimmedEnd} ` : trimmedEnd;
};

/**
 * Returns a participant display name ensuring a fallback to email and truncation.
 */
export function formatParticipantName(
  name?: string | null,
  email?: string | null,
  maxLength = MAX_PARTICIPANT_NAME_LENGTH,
): string | null {
  const rawName = name ? sanitizeDisplayName(name) : null;
  const raw =
    rawName && rawName.length > 0
      ? rawName
      : email?.trim() && email.trim().length > 0
        ? email.trim()
        : null;

  if (!raw) {
    return null;
  }

  if (raw.length <= maxLength) {
    return raw;
  }

  return `${raw.slice(0, maxLength)}...`;
}
