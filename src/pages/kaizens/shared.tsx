import { ReactNode, useEffect, useMemo, useState } from "react";
import { useGetIdentity, usePermissions, type CrudFilters } from "@refinedev/core";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography, { type TypographyProps } from "@mui/material/Typography";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";

export const KAIZEN_STATUSES = [
  "Draft",
  "Submitted",
  "In Review",
  "In Feasibility Review",
  "Approved",
  "Rejected",
  "Withdrawn",
  "Closed",
  "Resubmitted",
  "Impact Updated",
  "Pending Audit",
  "Audit In Progress",
  "Audit Pass",
  "Audit Fail",
  "Audit Closed",
  "Implementation Not Started",
  "Implementation In Progress",
  "Implementation Complete",
  "Impact Validation Pending",
  "Incentive Approved",
  "Certificate Generated",
] as const;

export const KAIZEN_CATEGORIES = [
  "Productivity",
  "Quality",
  "Revenue Generation",
  "TAT",
  "Other",
] as const;

export const KAIZEN_TITLE_MAX_LENGTH = 120;
export const KAIZEN_TITLE_LIMIT_MESSAGE = `Title must be ${KAIZEN_TITLE_MAX_LENGTH} characters or fewer.`;

export type KaizenCategory = (typeof KAIZEN_CATEGORIES)[number];

export const normalizeKaizenCategory = (category?: string | null): KaizenCategory =>
  (KAIZEN_CATEGORIES as readonly string[]).includes(category ?? "") ? (category as KaizenCategory) : "Other";

export const FTE_SAVING_DENOMINATOR = 9600;

export const REJECTION_CATEGORIES = [
  "Out of Scope",
  "Duplicate",
  "Not Feasible",
  "Insufficient Information",
] as const;

export const REVIEW_DECISIONS = [
  "Approved",
  "Rejected",
  "Impact Updated",
  "Audit Closed",
  "Certificate Generated",
] as const;

export const LEAD_CORRECTION_EDIT_STATUSES = ["Rejected", "Resubmitted"] as const;
export const EMPLOYEE_EDIT_RESUBMIT_STATUSES = ["Rejected", "Resubmitted", "Withdrawn"] as const;

export type KaizenIdea = {
  id: string;
  kaizen_id?: string | null;
  title?: string | null;
  problem_statement?: string | null;
  proposed_solution?: string | null;
  expected_benefit?: string | null;
  category?: string | null;
  effort_type?: string | null;
  dependency?: string | null;
  department_id?: string | null;
  department_code?: string | null;
  department_name?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  process_id?: string | null;
  process_name?: string | null;
  team_lead_username?: string | null;
  team_lead_email?: string | null;
  team_lead_name?: string | null;
  project_members?: string[] | null;
  submitted_by_username?: string | null;
  submitted_by_email?: string | null;
  submitted_by_name?: string | null;
  reporting_manager_username?: string | null;
  reporting_manager_email?: string | null;
  status?: string | null;
  current_stage?: string | null;
  is_draft?: boolean | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  withdrawn_at?: string | null;
  reactivated_at?: string | null;
  closed_at?: string | null;
  rejection_category?: string | null;
  rejection_reason?: string | null;
  withdrawal_reason?: string | null;
  withdrawal_comments?: string | null;
  manager_review_comments?: string | null;
  om_som_comments?: string | null;
  pe_qa_comments?: string | null;
  hours_saved?: number | string | null;
  cost_saved?: number | string | null;
  rework_reduced_percent?: number | string | null;
  impacted_volume?: number | string | null;
  time_saved?: number | string | null;
  error_before?: number | string | null;
  error_after?: number | string | null;
  rework_time?: number | string | null;
  total_time_saved?: number | string | null;
  tat_before?: number | string | null;
  tat_after?: number | string | null;
  monthly_transaction_volume?: number | string | null;
  monthly_time_saved?: number | string | null;
  tat_improvement_percent?: number | string | null;
  revenue_generated_usd?: number | string | null;
  fte_saving?: number | string | null;
  fte_cost_usd?: number | string | null;
  reward_amount?: number | string | null;
  advanced_impact_score?: number | string | null;
  impact_validation_status?: string | null;
  evidence_status?: string | null;
  sla_status?: string | null;
  stage_started_at?: string | null;
  sla_due_at?: string | null;
  responsible_username?: string | null;
  high_impact_nomination_status?: string | null;
  high_impact_nomination_reason?: string | null;
  high_impact_nominated_by_username?: string | null;
  high_impact_nominated_by_name?: string | null;
  high_impact_nominated_at?: string | null;
  high_impact_decision_by_username?: string | null;
  high_impact_decision_by_name?: string | null;
  high_impact_decision_at?: string | null;
  high_impact_decision_comments?: string | null;
  certificate_path?: string | null;
  similar_warning_acknowledged?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Department = {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  is_active?: boolean | null;
  lead_id?: string | PeopleEmployee | null;
  manager_username?: string | null;
  manager_email?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type PeopleEmployee = {
  id: string;
  user_id?: string | Record<string, unknown> | null;
  employee_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  hire_date?: string | null;
  end_date?: string | null;
  employment_status?: string | null;
  employment_type?: string | null;
  department_id?: string | Department | null;
  profile_photo_url?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type Client = {
  id: string;
  code: string;
  name: string;
  industry?: string | null;
  status?: string | null;
};

export type Review = {
  id: string;
  idea_id: string;
  reviewer_username?: string | null;
  reviewer_name?: string | null;
  reviewer_role?: string | null;
  decision?: string | null;
  comments?: string | null;
  high_impact_action?: string | null;
  high_impact_nomination_status?: string | null;
  high_impact_nomination_reason?: string | null;
  rejection_category?: string | null;
  previous_status?: string | null;
  new_status?: string | null;
  created_at?: string | null;
};

export type NotificationRow = {
  id: string;
  idea_id?: string | null;
  recipient_username?: string | null;
  recipient_email?: string | null;
  notification_type?: string | null;
  status?: string | null;
  subject?: string | null;
  direct_link?: string | null;
  created_at?: string | null;
};

export type CertificateRow = {
  id: string;
  idea_id: string;
  certificate_number: string;
  recipient_username?: string | null;
  recipient_email?: string | null;
  recipient_name?: string | null;
  status?: string | null;
  certificate_path?: string | null;
  reward_amount?: number | string | null;
  issued_at?: string | null;
};

export type HierarchyAssignment = {
  id: string;
  employee_username?: string | null;
  manager_username?: string | null;
  reporting_line_type?: string | null;
  status?: string | null;
};

export type BackendFilterNode =
  | Record<string, unknown>
  | { and: BackendFilterNode[] }
  | { or: BackendFilterNode[] };

export const backendFilterTree = (nodes: BackendFilterNode[]): CrudFilters =>
  nodes.length > 0 ? [{ field: "filters", operator: "eq", value: JSON.stringify({ and: nodes }) }] : [];

export const hierarchyEmployeeUsernames = (assignments: HierarchyAssignment[] = [], managerUsername?: string | null) => {
  const manager = String(managerUsername ?? "").trim();
  return Array.from(
    new Set(
      assignments
        .filter((row) => row.status === "Active")
        .filter((row) => !row.reporting_line_type || row.reporting_line_type === "Primary")
        .filter((row) => !manager || row.manager_username === manager)
        .map((row) => String(row.employee_username ?? "").trim())
        .filter((username) => username && username !== manager),
    ),
  );
};

export const leadManagerIdeaFilters = (
  managerUsername?: string | null,
  assignedEmployeeUsernames: string[] = [],
): CrudFilters => {
  const nodes = leadManagerIdeaFilterNodes(managerUsername, assignedEmployeeUsernames);
  return nodes ? backendFilterTree(nodes) : [{ field: "id", operator: "eq", value: "__no_manager__" }];
};

export const leadManagerIdeaFilterNodes = (
  managerUsername?: string | null,
  assignedEmployeeUsernames: string[] = [],
): BackendFilterNode[] | null => {
  const manager = String(managerUsername ?? "").trim();
  if (!manager) return null;

  const employeeUsernames = Array.from(new Set(assignedEmployeeUsernames.filter((username) => username && username !== manager)));
  const scope: BackendFilterNode[] = [{ reporting_manager_username__eq: manager }];
  if (employeeUsernames.length > 0) scope.push({ submitted_by_username__in: employeeUsernames });

  return [
    { or: scope },
    { submitted_by_username__ne: manager },
  ];
};

export const canLeadEditKaizenCorrection = (idea?: Pick<KaizenIdea, "status" | "reporting_manager_username" | "team_lead_username"> | null, username?: string | null) => {
  const leadUsername = String(username ?? "").trim().toLowerCase();
  if (!idea || !leadUsername) return false;
  const status = String(idea.status ?? "");
  if (!(LEAD_CORRECTION_EDIT_STATUSES as readonly string[]).includes(status)) return false;
  return [idea.reporting_manager_username, idea.team_lead_username]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .some((value) => value === leadUsername);
};

export type TaruviIdentity = {
  id?: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  roles?: Array<string | Record<string, unknown>>;
  attributes?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const relatedRecordId = (value: unknown) => {
  if (typeof value === "string") return value;
  if (isRecord(value)) return String(value.id ?? "");
  return "";
};

export const employeeFullName = (employee?: PeopleEmployee | null) =>
  [employee?.first_name, employee?.last_name]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ");

export const employeeDisplayLabel = (employee?: PeopleEmployee | null) => {
  if (!employee) return "";
  const name = employeeFullName(employee);
  const primary = name || employee.email || employee.employee_number || employee.id;
  const secondary = employee.employee_number || employee.email || employee.title;
  return secondary && secondary !== primary ? `${primary} - ${secondary}` : String(primary);
};

export const employeeDepartment = (employee?: PeopleEmployee | null) =>
  isRecord(employee?.department_id) ? (employee.department_id as Department) : null;

export const getDepartmentLead = (department?: Department | null) =>
  isRecord(department?.lead_id) ? (department.lead_id as PeopleEmployee) : null;

export const emptyValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export const normalizeKaizenTitle = (value?: string | null) => String(value ?? "").trim();

export const isKaizenTitleTooLong = (value?: string | null) =>
  normalizeKaizenTitle(value).length > KAIZEN_TITLE_MAX_LENGTH;

export const KaizenTitleText = ({
  title,
  lines = 1,
  sx,
  variant = "body2",
  ...typographyProps
}: {
  title?: string | null;
  lines?: number;
} & Omit<TypographyProps, "children" | "title">) => {
  const label = emptyValue(title);
  const tooltipTitle = normalizeKaizenTitle(title);
  const clampSx =
    lines <= 1
      ? {
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }
      : {
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: lines,
        };

  return (
    <Tooltip title={tooltipTitle} disableHoverListener={!tooltipTitle}>
      <Typography
        variant={variant}
        {...typographyProps}
        sx={[
          {
            fontWeight: 700,
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            ...clampSx,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        {label}
      </Typography>
    </Tooltip>
  );
};

export const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatCurrency = (value: unknown) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

export const formatInteger = (value: unknown) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(toNumber(value));

export const formatFteSaving = (value: unknown) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(toNumber(value));

export const calculateTatImpact = (idea: Pick<KaizenIdea, "tat_before" | "tat_after" | "monthly_transaction_volume">) => {
  const before = toNumber(idea.tat_before);
  const after = toNumber(idea.tat_after);
  const timeSaved = Math.max(0, before - after);
  return {
    timeSaved,
    improvementPercent: before > 0 ? (timeSaved / before) * 100 : 0,
    monthlyTimeSaved: 0,
    fteSaving: 0,
    hoursSaved: 0,
  };
};

export const calculateFteSaving = ({
  category,
  impacted_volume,
  time_saved,
  error_before,
  error_after,
  rework_time,
  total_time_saved,
}: Pick<KaizenIdea, "category" | "impacted_volume" | "time_saved" | "error_before" | "error_after" | "rework_time" | "total_time_saved">) => {
  const normalizedCategory = normalizeKaizenCategory(category);
  if (normalizedCategory === "Productivity") {
    return (toNumber(impacted_volume) * toNumber(time_saved)) / FTE_SAVING_DENOMINATOR;
  }
  if (normalizedCategory === "Quality") {
    return ((toNumber(error_before) - toNumber(error_after)) * toNumber(rework_time)) / FTE_SAVING_DENOMINATOR;
  }
  if (normalizedCategory === "Other") {
    return toNumber(total_time_saved) / FTE_SAVING_DENOMINATOR;
  }
  if (normalizedCategory === "TAT") {
    return 0;
  }
  return 0;
};

export const calculateHoursSaved = (idea: Pick<
  KaizenIdea,
  "hours_saved" | "category" | "impacted_volume" | "time_saved" | "error_before" | "error_after" | "rework_time" | "total_time_saved" | "tat_before" | "tat_after" | "monthly_transaction_volume"
>) => {
  if (idea.hours_saved !== null && idea.hours_saved !== undefined && idea.hours_saved !== "") {
    return toNumber(idea.hours_saved);
  }

  const normalizedCategory = normalizeKaizenCategory(idea.category);
  if (normalizedCategory === "Productivity") {
    return (toNumber(idea.impacted_volume) * toNumber(idea.time_saved)) / 60;
  }
  if (normalizedCategory === "Quality") {
    return ((toNumber(idea.error_before) - toNumber(idea.error_after)) * toNumber(idea.rework_time)) / 60;
  }
  if (normalizedCategory === "Other") {
    return toNumber(idea.total_time_saved) / 60;
  }
  if (normalizedCategory === "TAT") {
    return 0;
  }
  return 0;
};

export const kaizenReferenceLabel = (idea?: Pick<KaizenIdea, "kaizen_id" | "status" | "is_draft"> | null) => {
  const kaizenId = idea?.kaizen_id?.trim();
  if (kaizenId) return kaizenId;
  if (idea?.is_draft || idea?.status === "Draft") return "Draft";
  return "No Kaizen ID";
};

export const StatusChip = ({ status }: { status?: string | null }) => {
  const normalized = status || "Draft";
  if (
    normalized === "Approved" ||
    normalized === "Closed" ||
    normalized === "Certificate Generated" ||
    normalized === "Audit Pass" ||
    normalized === "Implementation Complete" ||
    normalized === "Incentive Approved"
  ) {
    return <Chip color="success" label={normalized} size="small" />;
  }
  if (
    normalized === "Submitted" ||
    normalized === "In Review" ||
    normalized === "In Feasibility Review" ||
    normalized === "Impact Updated" ||
    normalized === "Pending Audit" ||
    normalized === "Audit In Progress" ||
    normalized === "Implementation In Progress" ||
    normalized === "Impact Validation Pending" ||
    normalized === "Verified" ||
    normalized === "Complete" ||
    normalized === "Green"
  ) {
    return <Chip color="info" label={normalized} size="small" />;
  }
  if (
    normalized === "Draft" ||
    normalized === "Resubmitted" ||
    normalized === "Audit Closed" ||
    normalized === "Implementation Not Started" ||
    normalized === "Pending" ||
    normalized === "Partial" ||
    normalized === "Yellow"
  ) {
    return <Chip color="warning" label={normalized} size="small" />;
  }
  if (normalized === "Rejected" || normalized === "Audit Fail" || normalized === "Withdrawn" || normalized === "Red") {
    return <Chip color="error" label={normalized} size="small" />;
  }
  return <Chip label={normalized} size="small" />;
};

const tagVariants = ["tagBlue", "tagPurple", "tagGreen", "tagOrange"] as const;

export const CategoryChip = ({ category }: { category?: string | null }) => {
  const label = category || "Other";
  const index = Math.abs(
    label.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) | 0, 0),
  ) % tagVariants.length;
  return <Chip variant={tagVariants[index]} label={label} size="small" />;
};

export const useDebouncedValue = <T,>(value: T, delay = 350) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
};

type EmptyStateKind = "no-data" | "no-results" | "no-matches" | "error";

export const EmptyState = ({
  kind,
  title,
  body,
  action,
}: {
  kind: EmptyStateKind;
  title: string;
  body: string;
  action?: ReactNode;
}) => {
  const Icon =
    kind === "no-results"
      ? SearchOffRoundedIcon
      : kind === "no-matches"
        ? FilterListRoundedIcon
        : kind === "error"
          ? ErrorRoundedIcon
          : FolderOpenRoundedIcon;

  return (
    <Box sx={{ textAlign: "center", py: 5, px: 2.5, color: "text.disabled" }}>
      <Icon sx={{ fontSize: 48, mb: 1.5, display: "block", mx: "auto" }} />
      <Typography variant="h5" sx={{ color: "text.secondary", mb: 0.75 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        {body}
      </Typography>
      {action}
    </Box>
  );
};

export const ActiveFilterChips = ({
  filters,
  onDelete,
  onClear,
}: {
  filters: Array<{ key: string; label: string }>;
  onDelete: (key: string) => void;
  onClear: () => void;
}) => {
  if (filters.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
      {filters.map((filter) => (
        <Chip
          key={filter.key}
          variant="outlined"
          color="primary"
          label={filter.label}
          onDelete={() => onDelete(filter.key)}
        />
      ))}
      <Button size="small" variant="text" onClick={onClear}>
        Clear all
      </Button>
    </Stack>
  );
};

export const useKaizenRoles = () => {
  const { data: identity, isLoading: isIdentityLoading } = useGetIdentity<TaruviIdentity>();
  const { data: permissions, isLoading: isPermissionsLoading } = usePermissions<Record<string, unknown>>({});

  return useMemo(() => {
    const attrs = identity?.attributes ?? {};
    const identityRoles = Array.isArray(identity?.roles) ? identity.roles : [];
    const permissionRoles = Array.isArray(permissions?.roles) ? permissions.roles : [];
    const permissionGroups = Array.isArray(permissions?.groups) ? permissions.groups : [];
    const attrRoleSlugs = Array.isArray(attrs.role_slugs) ? attrs.role_slugs : [];
    const attrRoles = Array.isArray(attrs.roles) ? attrs.roles : [];
    const readRole = (role: unknown) =>
      typeof role === "string"
        ? role
        : String(
            (role as Record<string, unknown>).name ??
              (role as Record<string, unknown>).slug ??
              (role as Record<string, unknown>).role_slug ??
              (role as Record<string, unknown>).role ??
              "",
          );
    const roleValues = [
      ...identityRoles.map(readRole),
      ...permissionRoles.map(readRole),
      ...permissionGroups.map(readRole),
      ...attrRoleSlugs.map(String),
      ...attrRoles.map(readRole),
      String(attrs.role_slug ?? ""),
      String(attrs.role ?? ""),
      String(attrs.kaizen_role ?? ""),
    ]
      .filter(Boolean)
      .map((role) => role.toLowerCase().replace(/[^a-z0-9]/g, ""));

    const has = (needles: string[]) =>
      needles.some((needle) => roleValues.some((role) => role.includes(needle.toLowerCase().replace(/[^a-z0-9]/g, ""))));

    const hasRoleSuffix = (needles: string[]) =>
      needles.some((needle) => {
        const normalizedNeedle = needle.toLowerCase().replace(/[^a-z0-9]/g, "");
        return roleValues.some((role) => role === normalizedNeedle || role.endsWith(normalizedNeedle));
      });

    const isEmployeeRole = has(["employee"]);
    const isPeQaRole =
      has([
        "peqa",
        "processquality",
        "processexcellence",
        "processengineering",
        "qualityassurance",
        "qualityanalyst",
        "qualityaudit",
        "qualityauditor",
        "qualitycontrol",
      ]) || hasRoleSuffix(["peqa", "pe", "qa"]);

    const isExecutiveRole =
      has(["executiveview", "executive"]) ||
      hasRoleSuffix(["kaizenprasunadmin"]);

    const isSuperAdmin =
      Boolean((identity?.is_superuser || permissions?.is_superuser) && !isExecutiveRole) ||
      has(["superadmin", "superuser"]);

    const isAdmin =
      Boolean(identity?.is_staff || identity?.is_superuser || permissions?.is_staff || permissions?.is_superuser) ||
      has(["admin", "superadmin"]);

    const isOmSomRole =
      has([
        "omsom",
        "omsmo",
        "operationmanager",
        "operationsmanager",
        "seniormanageroperations",
        "smo",
      ]) || hasRoleSuffix(["om"]);

    return {
      identity,
      isLoading: Boolean(isIdentityLoading || isPermissionsLoading),
      isEmployee: isEmployeeRole || isAdmin,
      isManager: has(["leadmanager", "manager"]) || isAdmin,
      isOmSom: isOmSomRole || isAdmin,
      isOmSomRole,
      isPeQa: isPeQaRole || isAdmin,
      isPeQaRole,
      isExecutiveRole,
      isAdmin,
      isSuperAdmin,
      canSubmitKaizen: !isAdmin && isEmployeeRole && !isPeQaRole && !isOmSomRole,
      canReview: has(["leadmanager", "manager", "omsom", "omsmo"]) || isOmSomRole || isPeQaRole || isAdmin,
    };
  }, [identity, isIdentityLoading, isPermissionsLoading, permissions]);
};

export const AccessDenied = ({ title = "Access denied" }: { title?: string }) => (
  <Box sx={{ p: { xs: 2, md: 4 } }}>
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Your current Kaizen role does not include access to this area.
      </Typography>
    </Box>
  </Box>
);
