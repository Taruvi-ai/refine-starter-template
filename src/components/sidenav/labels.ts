const MAX_LABEL_EXPANDED = 40;
const MAX_COLLAPSED_LINE_LENGTH = 12;

const COLLAPSED_LABELS: Record<string, string> = {
  Dashboard: "Dash\nboard",
  "Executive View Dashboard": "Exec\nView",
  Kaizen: "Kaizen",
  "My Kaizen": "Kaizen",
  "Team Dashboard": "Team\nDashboard",
  "Team's Dashboard": "Team\nDashboard",
  "OM/SOM Dashboard": "OM/SOM\nDash",
  Reviews: "Reviews",
  Notification: "Notification",
  Notifications: "Notification",
  Leaderboard: "Leaderboard",
  Report: "Report",
  Reports: "Reports",
  "Global Search": "Global\nSearch",
  "PE/QA Audit": "PE/QA\nAudit",
  "High Impact Kaizen": "High\nImpact",
  "Audit Logs": "Audit\nLogs",
  Certificate: "Certificate",
  Certificates: "Certificate",
  Settings: "Settings",
};

const normalizeLabel = (text: string) => text.replace(/\s+/g, " ").trim();

const trimExpandedLabel = (text: string) =>
  text.length > MAX_LABEL_EXPANDED ? `${text.slice(0, MAX_LABEL_EXPANDED - 3)}...` : text;

const fitCollapsedLine = (text: string) =>
  text.length > MAX_COLLAPSED_LINE_LENGTH
    ? `${text.slice(0, MAX_COLLAPSED_LINE_LENGTH - 3)}...`
    : text;

export const formatMenuLabel = (text: string, expanded: boolean) => {
  const label = normalizeLabel(text);

  if (expanded) {
    return trimExpandedLabel(label);
  }

  const explicitLabel = COLLAPSED_LABELS[label];
  if (explicitLabel) return explicitLabel;

  const words = label.split(" ");
  if (words.length === 1) {
    return fitCollapsedLine(words[0]);
  }

  return [
    fitCollapsedLine(words[0]),
    fitCollapsedLine(words.slice(1).join(" ")),
  ].join("\n");
};
