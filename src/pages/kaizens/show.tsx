import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useList, useNotification, useOne } from "@refinedev/core";
import { Database, type BackendFilterNode, type BackendFilterTreeRoot } from "@taruvi/sdk";
import { useNavigate, useParams } from "react-router";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import CancelScheduleSendRoundedIcon from "@mui/icons-material/CancelScheduleSendRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Link from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import { taruviClient } from "../../taruviClient";
import { executeFunction } from "../../utils/functionHelpers";
import { getStorageUrl } from "../../utils/storageHelpers";
import {
  REVIEW_REASON_MIN_LENGTH,
  hasReviewReasonLimitError,
  reviewErrorDescription,
  reviewReasonLimitMessage,
} from "../../utils/reviewValidation";
import {
  CategoryChip,
  EMPLOYEE_EDIT_RESUBMIT_STATUSES,
  EmptyState,
  KaizenTitleText,
  REJECTION_CATEGORIES,
  StatusChip,
  canLeadEditKaizenCorrection,
  emptyValue,
  formatCurrency,
  formatDate,
  formatFteSaving,
  formatInteger,
  kaizenReferenceLabel,
  useKaizenRoles,
  type CertificateRow,
  type KaizenIdea,
  type Review,
} from "./shared";
import { calculateConfiguredFteSaving, useBenefitCalculationConfigs } from "../settings/shared";

type AttachmentRow = {
  id: string;
  bucket?: string | null;
  file_name?: string | null;
  path?: string | null;
  file_size?: number | string | null;
  attachment_type?: string | null;
  uploaded_at?: string | null;
};

type TeamContributionRow = {
  id: string;
  idea_id: string;
  member_username?: string | null;
  member_email?: string | null;
  member_name?: string | null;
  role_type?: string | null;
  project_role?: string | null;
  contribution_percent?: number | string | null;
  contribution_description?: string | null;
  participation_status?: string | null;
  incentive_share_percent?: number | string | null;
};

type CommentRow = {
  id: string;
  idea_id: string;
  parent_comment_id?: string | null;
  author_username?: string | null;
  author_name?: string | null;
  author_role?: string | null;
  comment_type?: string | null;
  body_text?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type CommentActionResponse = {
  success: boolean;
  error?: string;
  comment?: CommentRow;
};

type JsonMap = Record<string, unknown>;

type AuditLogRow = {
  id: string;
  timestamp?: string | null;
  user_username?: string | null;
  user_display_name?: string | null;
  user_role?: string | null;
  action_type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  kaizen_id?: string | null;
  source?: string | null;
  old_value?: JsonMap | null;
  new_value?: JsonMap | null;
  created_at?: string | null;
};

type ActivityChangeRow = {
  id: string;
  timestamp?: string | null;
  updatedBy: string;
  role: string;
  section: string;
  field: string;
  previousValue: unknown;
  newValue: unknown;
  action: string;
};

type WithdrawalResponse = {
  success: boolean;
  error?: string;
};

type ReviewResponse = {
  success: boolean;
  error?: string;
  idea?: KaizenIdea;
  next_notifications?: Array<{
    status?: string | null;
    error?: string | null;
  } | null>;
};

type CertificateRenderResponse = {
  success?: boolean;
  error?: string;
  message?: string;
};

const PE_QA_AUDIT_DECISIONS = [
  { value: "Certificate Generated", label: "Close & Generate Certificate" },
  { value: "Rejected", label: "Return for Correction" },
] as const;

const WITHDRAWAL_REASONS = [
  "No longer relevant",
  "Already implemented by other means",
  "Technical constraints",
  "Submitted in error",
  "Duplicate",
  "Incorrect submission",
  "Business priority changed",
  "Insufficient data",
  "Other",
] as const;

const Field = ({ label, value }: { label: string; value: unknown }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{label}</Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>{emptyValue(value)}</Typography>
  </Box>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <Typography
    sx={{
      color: "text.secondary",
      fontFamily: "'Quicksand', sans-serif",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.05em",
      mb: 1.5,
      textTransform: "uppercase",
    }}
  >
    {children}
  </Typography>
);

const FieldGrid = ({ children, columns = 4 }: { children: ReactNode; columns?: number }) => (
  <Box
    sx={{
      display: "grid",
      gap: 2.5,
      gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(2, minmax(0, 1fr))",
        md: `repeat(${columns}, minmax(0, 1fr))`,
      },
    }}
  >
    {children}
  </Box>
);

const TextSection = ({ label, value }: { label: string; value: unknown }) => (
  <Box sx={{ py: 0.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>{label}</Typography>
    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{emptyValue(value)}</Typography>
  </Box>
);

const certificateUrl = (path?: string | null) =>
  path ? `${__TARUVI_SITE_URL__}/api/apps/${__TARUVI_APP_SLUG__}/storage/buckets/kaizen-attachments/objects/${path}` : "";

const attachmentFileName = (attachment: AttachmentRow) =>
  attachment.file_name || attachment.path?.split("/").pop() || "Attachment";

const attachmentDownloadUrl = (attachment: AttachmentRow) =>
  getStorageUrl(attachment.bucket || "kaizen-attachments", attachment.path);

const certificateDownloadName = (certificate: CertificateRow) => {
  const pathName = certificate.certificate_path?.split("/").pop() || "kaizen-certificate.svg";
  const extension = pathName.includes(".") ? pathName.slice(pathName.lastIndexOf(".")) : ".svg";
  const baseName = (certificate.certificate_number || pathName.replace(/\.[^.]+$/, "") || "kaizen-certificate")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return `${baseName || "kaizen-certificate"}${extension}`;
};

const hasMetricValue = (value: unknown) => value !== null && value !== undefined && value !== "";
const nullableInteger = (value: unknown) => hasMetricValue(value) ? formatInteger(value) : "-";
const nullableMinutes = (value: unknown) => hasMetricValue(value) ? `${formatInteger(value)} min` : "-";
const nullableFteSaving = (value: unknown) => hasMetricValue(value) ? formatFteSaving(value) : "-";

const AUDIT_TIMESTAMP_DESC = [{ field: "timestamp", order: "desc" as const }];

const isJsonMap = (value: unknown): value is JsonMap =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const formatAuditDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const activityFieldLabel = (field: string) =>
  field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const ACTIVITY_FIELD_META: Record<string, { section: string; label: string }> = {
  title: { section: "Idea Details", label: "Title" },
  problem_statement: { section: "Idea Details", label: "Problem Statement" },
  proposed_solution: { section: "Idea Details", label: "Proposed Solution" },
  expected_benefit: { section: "Idea Details", label: "Expected Benefit" },
  category: { section: "Classification", label: "Category" },
  effort_type: { section: "Classification", label: "Effort Type" },
  dependency: { section: "Idea Details", label: "Dependency" },
  department_name: { section: "Organization", label: "Department" },
  client_name: { section: "Organization", label: "Client" },
  process_name: { section: "Organization", label: "Process" },
  team_lead_name: { section: "Ownership", label: "Team Lead" },
  project_members: { section: "Ownership", label: "Project Members" },
  status: { section: "Workflow", label: "Status" },
  current_stage: { section: "Workflow", label: "Stage" },
  rejection_category: { section: "Review", label: "Rejection Category" },
  rejection_reason: { section: "Review", label: "Rejection Reason" },
  manager_review_comments: { section: "Review", label: "Lead/Manager Comments" },
  om_som_comments: { section: "Review", label: "OM/SOM Comments" },
  pe_qa_comments: { section: "Review", label: "PE/QA Comments" },
  impacted_volume: { section: "Impact", label: "Monthly Impacted Volume" },
  time_saved: { section: "Impact", label: "Time Saved" },
  fte_saving: { section: "Impact", label: "FTE Saved" },
  fte_cost_usd: { section: "Impact", label: "FTE Cost (USD)" },
  hours_saved: { section: "Impact", label: "Hours Saved" },
  cost_saved: { section: "Impact", label: "Cost Saved" },
  error_before: { section: "Impact", label: "Before Error Count" },
  error_after: { section: "Impact", label: "After Error Count" },
  rework_time: { section: "Impact", label: "Rework Time" },
  rework_reduced_percent: { section: "Impact", label: "Rework Reduction (%)" },
  total_time_saved: { section: "Impact", label: "Total Time Saved" },
  tat_before: { section: "Impact", label: "TAT Before" },
  tat_after: { section: "Impact", label: "TAT After" },
  monthly_transaction_volume: { section: "Impact", label: "Monthly Transaction Volume" },
  monthly_time_saved: { section: "Impact", label: "Monthly Time Saved" },
  tat_improvement_percent: { section: "Impact", label: "TAT Improvement (%)" },
  revenue_generated_usd: { section: "Impact", label: "Revenue Generated (USD)" },
  advanced_impact_score: { section: "Impact", label: "Advanced Impact Score" },
  impact_validation_status: { section: "Impact", label: "Impact Validation Status" },
  evidence_status: { section: "Impact", label: "Evidence Status" },
  reward_amount: { section: "Impact", label: "Reward Amount" },
  high_impact_nomination_status: { section: "High Impact", label: "Nomination Status" },
  high_impact_nomination_reason: { section: "High Impact", label: "Nomination Reason" },
  high_impact_decision_comments: { section: "High Impact", label: "Decision Comments" },
  certificate_path: { section: "Certificate", label: "Certificate" },
};

const activityFieldMeta = (field: string) =>
  ACTIVITY_FIELD_META[field] ?? { section: "Other", label: activityFieldLabel(field) };

const activityValueText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length > 0 ? value.map(activityValueText).join(", ") : "-";
  if (isJsonMap(value)) return JSON.stringify(value);
  return String(value);
};

const valuesMatch = (first: unknown, second: unknown) =>
  JSON.stringify(first ?? null) === JSON.stringify(second ?? null);

const activityRoleText = (log: AuditLogRow) => {
  if (log.user_role) return log.user_role;
  const context = `${log.action_type ?? ""} ${log.user_username ?? ""}`.toLowerCase();
  if (context.includes("lead/manager") || context.includes("leadmanager")) return "Lead/Manager";
  if (context.includes("om/som") || context.includes("omsom")) return "OM/SOM";
  if (context.includes("pe/qa") || context.includes("peqa")) return "PE/QA";
  if (context.includes("employee")) return "Employee";
  if (context.includes("admin")) return "Admin";
  return "-";
};

const activityChangeRows = (logs: AuditLogRow[]): ActivityChangeRow[] =>
  logs.flatMap((log) => {
    const oldValue = isJsonMap(log.old_value) ? log.old_value : {};
    const newValue = isJsonMap(log.new_value) ? log.new_value : {};
    const changedFields = Array.from(new Set([...Object.keys(oldValue), ...Object.keys(newValue)]))
      .filter((field) => !["id", "created_at", "updated_at", "search_vector"].includes(field))
      .filter((field) => !valuesMatch(oldValue[field], newValue[field]));

    if (changedFields.length === 0) {
      return [{
        id: `${log.id}-action`,
        timestamp: log.timestamp ?? log.created_at,
        updatedBy: String(log.user_display_name || log.user_username || "System"),
        role: activityRoleText(log),
        section: "Activity",
        field: "Action",
        previousValue: null,
        newValue: log.action_type,
        action: String(log.action_type || "Activity"),
      }];
    }

    return changedFields.map((field) => {
      const meta = activityFieldMeta(field);
      return {
        id: `${log.id}-${field}`,
        timestamp: log.timestamp ?? log.created_at,
        updatedBy: String(log.user_display_name || log.user_username || "System"),
        role: activityRoleText(log),
        section: meta.section,
        field: meta.label,
        previousValue: oldValue[field],
        newValue: newValue[field],
        action: String(log.action_type || "Updated"),
      };
    });
  }).sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());

const buildActivityFilters = (ideaId?: string, kaizenId?: string | null): BackendFilterTreeRoot => {
  const matchNodes: BackendFilterNode[] = [];
  if (ideaId) matchNodes.push({ field: "entity_id", operator: "eq", value: ideaId });
  if (kaizenId) matchNodes.push({ field: "kaizen_id", operator: "eq", value: kaizenId });

  return [
    {
      operator: "and",
      value: [
        { field: "entity_type", operator: "eq", value: "Kaizen" },
        matchNodes.length > 1 ? { operator: "or", value: matchNodes } : matchNodes[0] ?? { field: "entity_id", operator: "eq", value: "__no_kaizen__" },
      ],
    },
  ];
};

const useAuditLogRows = (filters: BackendFilterTreeRoot, enabled: boolean, pageSize = 1000) => {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const filtersKey = useMemo(() => JSON.stringify({ filters, pageSize }), [filters, pageSize]);

  useEffect(() => {
    if (!enabled) {
      setRows([]);
      setTotal(0);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsError(false);

    let query = new Database(taruviClient).from("kaizen_audit_logs").filters(filters);
    AUDIT_TIMESTAMP_DESC.forEach((sorter) => {
      query = query.sort(sorter.field, sorter.order);
    });

    query
      .page(1)
      .pageSize(pageSize)
      .execute()
      .then((response) => {
        if (cancelled) return;
        const data = Array.isArray(response.data) ? response.data : [];
        setRows(data as AuditLogRow[]);
        setTotal(response.total ?? data.length);
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setTotal(0);
        setIsError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, filtersKey, pageSize, refreshKey]);

  return {
    rows,
    total,
    query: {
      isLoading,
      isError,
      refetch: () => setRefreshKey((current) => current + 1),
    },
  };
};

export const KaizenShow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const [tab, setTab] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("No longer relevant");
  const [withdrawComments, setWithdrawComments] = useState("");
  const [approverConsent, setApproverConsent] = useState(false);
  const [approverConsentError, setApproverConsentError] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditDecision, setAuditDecision] = useState("Certificate Generated");
  const [auditRejectionCategory, setAuditRejectionCategory] = useState("");
  const [auditComments, setAuditComments] = useState("");
  const auditCommentsRef = useRef("");
  const auditCommentsInputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [auditHoursSaved, setAuditHoursSaved] = useState("");
  const [auditReworkReduced, setAuditReworkReduced] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("General");
  const [replyingTo, setReplyingTo] = useState<CommentRow | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const { result: idea, query } = useOne<KaizenIdea>({
    resource: "kaizen_ideas",
    id: id ?? "",
    queryOptions: { enabled: Boolean(id) },
  });

  const listOptions = {
    filters: [{ field: "idea_id", operator: "eq" as const, value: id }],
    pagination: { currentPage: 1, pageSize: 50 },
    queryOptions: { enabled: Boolean(id) },
  };
  const { result: reviewsResult } = useList<Review>({
    resource: "kaizen_reviews",
    ...listOptions,
    sorters: [{ field: "created_at", order: "desc" }],
  });
  const { result: attachmentsResult } = useList<AttachmentRow>({
    resource: "kaizen_attachments",
    ...listOptions,
    sorters: [{ field: "uploaded_at", order: "desc" }],
  });
  const { result: certificatesResult } = useList<CertificateRow>({
    resource: "kaizen_certificates",
    ...listOptions,
    sorters: [{ field: "issued_at", order: "desc" }],
  });
  const { result: teamResult } = useList<TeamContributionRow>({
    resource: "kaizen_team_contributions",
    ...listOptions,
    sorters: [{ field: "created_at", order: "asc" }],
  });
  const commentsQuery = useList<CommentRow>({
    resource: "kaizen_comments",
    ...listOptions,
    pagination: { currentPage: 1, pageSize: 500 },
    sorters: [{ field: "created_at", order: "asc" }],
  });
  const activityFilters = useMemo(
    () => buildActivityFilters(id, idea?.kaizen_id),
    [id, idea?.kaizen_id],
  );
  const activityLogsQuery = useAuditLogRows(activityFilters, Boolean(id));
  const reviews = reviewsResult.data ?? [];
  const comments = commentsQuery.result.data ?? [];
  const attachments = attachmentsResult.data ?? [];
  const certificates = certificatesResult.data ?? [];
  const teamContributions = teamResult.data ?? [];
  const activityLogs = activityLogsQuery.rows;
  const activityRows = useMemo(() => activityChangeRows(activityLogs), [activityLogs]);
  const hasProductivityInputs = hasMetricValue(idea?.impacted_volume) && hasMetricValue(idea?.time_saved);
  const hasQualityInputs = hasMetricValue(idea?.error_before) && hasMetricValue(idea?.error_after) && hasMetricValue(idea?.rework_time);
  const hasOtherInputs = hasMetricValue(idea?.total_time_saved);
  const hasTatInputs = hasMetricValue(idea?.tat_before) && hasMetricValue(idea?.tat_after);
  const hasFteInputs = hasProductivityInputs || hasQualityInputs || hasOtherInputs || hasTatInputs;
  const fteSaving = idea?.fte_saving ?? (hasFteInputs ? calculateConfiguredFteSaving(idea ?? {}, benefitCalculationConfigs) : null);

  const postComment = async () => {
    const bodyText = commentText.trim();
    if (!id || !bodyText) {
      open?.({ type: "error", message: "Comment required", description: "Enter a comment or reply before posting." });
      return;
    }
    setIsPostingComment(true);
    try {
      const response = await executeFunction<CommentActionResponse>("kaizen-comment-action", {
        action: "add",
        idea_id: id,
        parent_comment_id: replyingTo?.parent_comment_id || replyingTo?.id || undefined,
        comment_type: commentType,
        body_text: bodyText,
      });
      if (!response.success) throw new Error(response.error || "Unable to post comment");
      setCommentText("");
      setCommentType("General");
      setReplyingTo(null);
      await commentsQuery.query.refetch();
      open?.({ type: "success", message: replyingTo ? "Reply posted" : "Comment posted", description: "Relevant Kaizen participants were notified." });
    } catch (error) {
      open?.({ type: "error", message: "Unable to post comment", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsPostingComment(false);
    }
  };

  const withdrawIdea = async () => {
    if (!id) return;
    if (!approverConsent) {
      setApproverConsentError(true);
      open?.({
        type: "error",
        message: "Approver consent required",
        description: "Capture approver consent before withdrawing this Kaizen.",
      });
      return;
    }
    setIsWithdrawing(true);
    try {
      const response = await executeFunction<WithdrawalResponse>("kaizen-withdrawal-action", {
        action: "withdraw",
        idea_id: id,
        reason: withdrawReason,
        comments: withdrawComments,
        approver_consent: approverConsent,
      });
      if (!response.success) throw new Error(response.error || "Withdrawal failed");
      setWithdrawOpen(false);
      setWithdrawComments("");
      setApproverConsent(false);
      setApproverConsentError(false);
      open?.({ type: "success", message: "Kaizen withdrawn", description: "The workflow status and withdrawal audit trail were updated." });
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to withdraw", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const openWithdrawDialog = () => {
    setApproverConsent(false);
    setApproverConsentError(false);
    setWithdrawOpen(true);
  };

  const closeWithdrawDialog = () => {
    setWithdrawOpen(false);
    setApproverConsent(false);
    setApproverConsentError(false);
  };

  const openAudit = () => {
    const initialAuditComments = String(idea?.pe_qa_comments ?? "");
    setAuditDecision("Certificate Generated");
    setAuditRejectionCategory("");
    auditCommentsRef.current = initialAuditComments;
    setAuditComments(initialAuditComments);
    setAuditHoursSaved(hasMetricValue(idea?.hours_saved) ? String(idea?.hours_saved) : "");
    setAuditReworkReduced(hasMetricValue(idea?.rework_reduced_percent) ? String(idea?.rework_reduced_percent) : "");
    setAuditOpen(true);
  };

  const updateAuditComments = (value: string) => {
    auditCommentsRef.current = value;
    setAuditComments(value);
  };

  const submitAudit = async () => {
    if (!id || !idea) return;
    const currentAuditComments = auditCommentsInputRef.current?.value ?? (auditCommentsRef.current || auditComments);
    const auditCommentsText = currentAuditComments.trim();
    if (!auditCommentsText) {
      open?.({ type: "error", message: "Audit comments required", description: "Add audit comments before saving this decision." });
      return;
    }
    if (auditDecision === "Rejected" && !auditRejectionCategory) {
      open?.({ type: "error", message: "Correction category required", description: "Choose a correction category before saving this decision." });
      return;
    }
    if (auditDecision === "Rejected" && hasReviewReasonLimitError(currentAuditComments)) {
      open?.({ type: "error", message: "Character limit not met", description: reviewReasonLimitMessage("Correction reason") });
      return;
    }
    setIsAuditing(true);
    try {
      const response = await executeFunction<ReviewResponse>("kaizen-review-idea", {
        idea_id: id,
        decision: auditDecision,
        reviewer_role: "PE/QA",
        rejection_category: auditRejectionCategory || undefined,
        comments: auditCommentsText,
        correction_reason: auditDecision === "Rejected" ? auditCommentsText : undefined,
        reason: auditDecision === "Rejected" ? auditCommentsText : undefined,
        impact_metrics: {
          hours_saved: auditHoursSaved,
          rework_reduced_percent: auditReworkReduced,
        },
        portal_base_url: window.location.origin,
      });
      if (!response.success) throw new Error(response.error || "Audit failed");
      if (auditDecision === "Certificate Generated") {
        const certificateResponse = await executeFunction<CertificateRenderResponse>("kaizen-cert-template-lite", {
          action: "regenerate",
          idea_id: response.idea?.id || id,
        });
        if (certificateResponse.success === false) {
          throw new Error(certificateResponse.error || certificateResponse.message || "Certificate rendering failed");
        }
      }
      const nextNotificationCount = (response.next_notifications ?? []).filter(
        (notification) => notification && notification.status !== "Skipped",
      ).length;
      const nextNotificationText = nextNotificationCount > 0 ? ` ${nextNotificationCount} notification${nextNotificationCount === 1 ? "" : "s"} queued.` : "";
      const message =
        auditDecision === "Certificate Generated"
          ? "Certificate generated"
          : auditDecision === "Rejected"
            ? "Returned for correction"
            : "Kaizen closed";
      const description =
        auditDecision === "Certificate Generated"
          ? `${idea.kaizen_id || idea.title || "Kaizen"} was closed and the certificate was generated.${nextNotificationText}`
          : auditDecision === "Rejected"
            ? `${idea.kaizen_id || idea.title || "Kaizen"} was returned to the Lead/Manager queue for correction.${nextNotificationText}`
            : `${idea.kaizen_id || idea.title || "Kaizen"} benefits were audited and the Kaizen is now closed.${nextNotificationText}`;
      open?.({ type: "success", message, description });
      setAuditOpen(false);
      if (auditDecision === "Certificate Generated") {
        navigate("/reviews");
        return;
      }
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save audit", description: reviewErrorDescription(error) });
    } finally {
      setIsAuditing(false);
    }
  };

  if (query.isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <Skeleton variant="text" width={240} />
        <Skeleton variant="rounded" height={240} sx={{ mt: 2 }} />
      </Container>
    );
  }

  if (query.isError || !idea) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <EmptyState kind="error" title="Unable to load data" body="There was a problem loading this Kaizen" action={<Button variant="contained" onClick={() => query.refetch()}>Try again</Button>} />
      </Container>
    );
  }

  const canSubmissionOwnerModify = roles.canSubmitKaizen && (roles.isAdmin || idea.submitted_by_username === roles.identity?.username);
  const canLeadEditCorrection =
    roles.isManager &&
    !roles.isAdmin &&
    !roles.isOmSomRole &&
    !roles.isPeQaRole &&
    canLeadEditKaizenCorrection(idea, roles.identity?.username);
  const canModifySubmission = canSubmissionOwnerModify || canLeadEditCorrection;
  const canEmployeeEditOrResubmit =
    canSubmissionOwnerModify &&
    Boolean(idea.is_draft || EMPLOYEE_EDIT_RESUBMIT_STATUSES.includes(idea.status as (typeof EMPLOYEE_EDIT_RESUBMIT_STATUSES)[number]));
  const canWithdraw = canSubmissionOwnerModify && ["Draft", "Submitted", "In Review", "In Feasibility Review", "Rejected"].includes(idea.status || "");
  const canAuditKaizen = roles.isPeQa && (idea.current_stage === "PE/QA Audit" || idea.status === "Approved");
  const showAuditReasonLimitPopup = (value = auditCommentsRef.current) => {
    if (auditDecision !== "Rejected" || !hasReviewReasonLimitError(value)) return;
    open?.({
      type: "error",
      message: "Character limit not met",
      description: reviewReasonLimitMessage("Correction reason"),
    });
  };
  const isAuditDisabled =
    isAuditing ||
    !auditComments.trim() ||
    (auditDecision === "Rejected" && (!auditRejectionCategory || auditComments.trim().length < REVIEW_REASON_MIN_LENGTH));
  const highImpactStatus = String(idea.high_impact_nomination_status ?? "").trim();
  const showHighImpactDetails = Boolean(
    (highImpactStatus && highImpactStatus !== "Not Nominated") ||
    idea.high_impact_nomination_reason ||
    idea.high_impact_nominated_by_name ||
    idea.high_impact_nominated_by_username ||
    idea.high_impact_decision_by_name ||
    idea.high_impact_decision_by_username ||
    idea.high_impact_decision_comments,
  );
  const impactInputFields =
    idea.category === "Productivity"
      ? [
          { label: "Impacted Month Volume", value: nullableInteger(idea.impacted_volume) },
          { label: "Time Saved", value: nullableMinutes(idea.time_saved) },
        ]
      : idea.category === "Quality"
        ? [
            { label: "Error Before", value: nullableInteger(idea.error_before) },
            { label: "Error After", value: nullableInteger(idea.error_after) },
            { label: "Rework Time per Transaction", value: nullableMinutes(idea.rework_time) },
          ]
        : idea.category === "TAT"
          ? [
              { label: "TAT Before", value: nullableMinutes(idea.tat_before) },
              { label: "TAT After", value: nullableMinutes(idea.tat_after) },
              { label: "TAT Improvement", value: hasMetricValue(idea.tat_improvement_percent) ? `${Number(idea.tat_improvement_percent).toFixed(2)}%` : "-" },
            ]
        : idea.category === "Other"
          ? [{ label: "Total Time Saved", value: nullableMinutes(idea.total_time_saved) }]
          : idea.category === "Revenue Generation"
            ? [{ label: "Revenue Generated", value: formatCurrency(idea.revenue_generated_usd) }]
          : [];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Breadcrumbs>
          <Link component="button" color="inherit" onClick={() => navigate("/kaizens")}>Kaizen</Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>{kaizenReferenceLabel(idea)}</Typography>
        </Breadcrumbs>

        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap", rowGap: 1, minWidth: 0 }}>
              <KaizenTitleText title={idea.title} variant="h2" lines={2} sx={{ flex: "1 1 320px" }} />
              <StatusChip status={idea.status} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {formatDate(idea.submitted_at || idea.created_at)} · Owner: {emptyValue(idea.submitted_by_name || idea.submitted_by_username)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {canWithdraw && (
              <Button color="error" variant="outlined" startIcon={<CancelScheduleSendRoundedIcon />} onClick={openWithdrawDialog}>
                Withdraw
              </Button>
            )}
            {canModifySubmission && (canEmployeeEditOrResubmit || canLeadEditCorrection) && (
              <Button variant="contained" startIcon={<EditRoundedIcon />} onClick={() => navigate(`/kaizens/edit/${idea.id}`)}>
                {canLeadEditCorrection
                  ? "Edit Correction"
                  : idea.status === "Rejected" || idea.status === "Resubmitted" || idea.status === "Withdrawn"
                    ? "Resubmit"
                    : "Edit"}
              </Button>
            )}
          </Stack>
        </Stack>

        {(idea.status === "Rejected" || idea.status === "Resubmitted") && idea.rejection_reason && (
          <Alert severity="error">
            {idea.rejection_category}: {idea.rejection_reason}
          </Alert>
        )}

        {idea.status === "Withdrawn" && (
          <Alert severity="warning">
            Withdrawn: {emptyValue(idea.withdrawal_reason)} - {emptyValue(idea.withdrawal_comments)}
          </Alert>
        )}

        <Card>
          <CardContent>
            <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 3 }}>
              <Tab label="Overview" />
              <Tab label={`Reviews (${reviews.length})`} />
              <Tab label={`Comments (${comments.length})`} />
              <Tab label={`Team (${teamContributions.length})`} />
              <Tab label={`Attachments (${attachments.length})`} />
              <Tab label="Certificates" />
              <Tab label={`Activity Log (${activityRows.length})`} />
            </Tabs>

            {tab === 0 && (
              <Stack spacing={3.5}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                  <CategoryChip category={idea.category} />
                </Stack>
                <Box>
                  <SectionTitle>Kaizen details</SectionTitle>
                  <FieldGrid columns={4}>
                    <Field label="Department" value={idea.department_name} />
                    <Field label="Client" value={idea.client_name} />
                    <Field label="Process" value={idea.process_name} />
                    <Field label="Dependency" value={idea.dependency} />
                    <Field label="Stage" value={idea.current_stage} />
                    <Field label="Owner" value={idea.submitted_by_name || idea.submitted_by_username} />
                    <Field label="Submitted" value={formatDate(idea.submitted_at || idea.created_at)} />
                  </FieldGrid>
                </Box>
                <Divider />
                <Box>
                  <SectionTitle>Idea summary</SectionTitle>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2.5,
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                    }}
                  >
                    <TextSection label="Problem Statement" value={idea.problem_statement} />
                    <TextSection label="Proposed Solution" value={idea.proposed_solution} />
                    <TextSection label="Expected Benefit" value={idea.expected_benefit} />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <SectionTitle>Impact</SectionTitle>
                  <Box sx={{ borderTop: 1, borderBottom: 1, borderColor: "divider", py: 2 }}>
                    <FieldGrid columns={3}>
                      <Field label="Hours Saved" value={formatInteger(idea.hours_saved)} />
                      <Field label="FTE Saving" value={nullableFteSaving(fteSaving)} />
                      <Field label="FTE Cost (USD)" value={formatCurrency(idea.fte_cost_usd)} />
                      <Field label="Rework Reduced" value={`${formatInteger(idea.rework_reduced_percent)}%`} />
                      <Field label="Cost Saved" value={formatCurrency(idea.cost_saved)} />
                      <Field label="Reward" value={formatCurrency(idea.reward_amount)} />
                    </FieldGrid>
                  </Box>
                </Box>
                {impactInputFields.length > 0 ? (
                  <Box>
                    <SectionTitle>Calculation inputs</SectionTitle>
                    <FieldGrid columns={3}>
                      {impactInputFields.map((field) => (
                        <Field key={field.label} label={field.label} value={field.value} />
                      ))}
                    </FieldGrid>
                  </Box>
                ) : null}
                <Divider sx={{ display: "none" }} />
                <Box sx={{ display: "none" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1} sx={{ mb: attachments.length > 0 ? 1.5 : 0 }}>
                    <Typography variant="h3">Attachments ({attachments.length})</Typography>
                    {attachments.length > 3 ? (
                      <Button size="small" variant="text" onClick={() => setTab(4)}>
                        View all
                      </Button>
                    ) : null}
                  </Stack>
                  {attachments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No attachments added.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {attachments.slice(0, 3).map((attachment) => (
                        <Stack
                          key={attachment.id}
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          spacing={1}
                          sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {attachmentFileName(attachment)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {attachment.attachment_type || "Document"} · {formatDate(attachment.uploaded_at)}
                            </Typography>
                          </Box>
                          <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} href={attachmentDownloadUrl(attachment)} target="_blank">
                            Download
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
                <Divider sx={{ display: "none" }} />
                <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ display: "none" }}>
                  <Field label="SLA Status" value={idea.sla_status} />
                  <Field label="SLA Due" value={formatDate(idea.sla_due_at)} />
                  <Field label="Responsible" value={idea.responsible_username} />
                  <Field label="Evidence Status" value={idea.evidence_status} />
                  <Field label="Impact Score" value={formatInteger(idea.advanced_impact_score)} />
                  <Field label="Validation" value={idea.impact_validation_status} />
                </Stack>
                {showHighImpactDetails ? (
                  <>
                    <Divider />
                    <Box>
                      <SectionTitle>High impact</SectionTitle>
                      <FieldGrid columns={4}>
                        <Field label="Status" value={highImpactStatus || "Not Nominated"} />
                        <Field label="Nominated By" value={idea.high_impact_nominated_by_name || idea.high_impact_nominated_by_username} />
                        <Field label="Nominated At" value={formatDate(idea.high_impact_nominated_at)} />
                        <Field label="Decision By" value={idea.high_impact_decision_by_name || idea.high_impact_decision_by_username} />
                      </FieldGrid>
                      {idea.high_impact_nomination_reason || idea.high_impact_decision_comments ? (
                        <Box sx={{ mt: 2 }}>
                          <FieldGrid columns={2}>
                            {idea.high_impact_nomination_reason ? <TextSection label="Reason" value={idea.high_impact_nomination_reason} /> : null}
                            {idea.high_impact_decision_comments ? <TextSection label="Decision Comments" value={idea.high_impact_decision_comments} /> : null}
                          </FieldGrid>
                        </Box>
                      ) : null}
                    </Box>
                  </>
                ) : null}
              </Stack>
            )}

            {tab === 1 && (
              <Stack spacing={2}>
                {reviews.length === 0 ? (
                  <EmptyState kind="no-data" title="No reviews yet" body="Review activity will appear here" />
                ) : reviews.map((review) => (
                  <Box key={review.id} sx={{ borderBottom: 1, borderColor: "divider", pb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{review.decision}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(review.created_at)}</Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{review.reviewer_role} · {review.reviewer_name || review.reviewer_username}</Typography>
                    {review.high_impact_action ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                        High Impact: {review.high_impact_action}
                      </Typography>
                    ) : null}
                    <Typography variant="body2" sx={{ mt: 1 }}>{review.comments}</Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 2 && (
              <Stack spacing={3}>
                <Box>
                  <SectionTitle>{replyingTo ? `Reply to ${replyingTo.author_name || replyingTo.author_username || "comment"}` : "Add comment"}</SectionTitle>
                  <Stack spacing={2}>
                    {replyingTo ? (
                      <Alert severity="info" action={<Button size="small" onClick={() => setReplyingTo(null)}>Cancel reply</Button>}>
                        Your response will be added to this discussion thread.
                      </Alert>
                    ) : null}
                    <FormControl fullWidth>
                      <InputLabel>Comment Type</InputLabel>
                      <Select label="Comment Type" value={commentType} onChange={(event) => setCommentType(event.target.value)}>
                        {(["General", "Question", "Clarification", "Update"] as const).map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField
                      label={replyingTo ? "Reply" : "Comment"}
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      helperText={`${commentText.length}/4000 characters. Use @username to mention a user.`}
                      inputProps={{ maxLength: 4000 }}
                      multiline
                      minRows={3}
                      required
                      fullWidth
                    />
                    <Stack direction="row" justifyContent="flex-end">
                      <Button variant="contained" startIcon={isPostingComment ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />} disabled={isPostingComment || !commentText.trim()} onClick={postComment}>
                        {replyingTo ? "Post Reply" : "Post Comment"}
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
                <Divider />
                <Box>
                  <SectionTitle>Discussion</SectionTitle>
                  {commentsQuery.query.isError ? (
                    <EmptyState kind="error" title="Unable to load comments" body="There was a problem loading this discussion" action={<Button variant="contained" onClick={() => commentsQuery.query.refetch()}>Try again</Button>} />
                  ) : commentsQuery.query.isLoading ? (
                    <Stack spacing={1}>{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} variant="rounded" height={88} />)}</Stack>
                  ) : comments.length === 0 ? (
                    <EmptyState kind="no-data" title="No comments yet" body="Start a discussion by asking a question or providing an update" />
                  ) : (
                    <Stack spacing={2}>
                      {comments.filter((comment) => !comment.parent_comment_id).map((comment) => {
                        const replies = comments.filter((reply) => reply.parent_comment_id === comment.id);
                        const commentCard = (entry: CommentRow, isReply = false) => (
                          <Box key={entry.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2, ml: isReply ? { xs: 2, sm: 6 } : 0 }}>
                            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{entry.author_name || entry.author_username || "User"}</Typography>
                                <Typography variant="caption" color="text.secondary">{entry.author_role || "Authorized User"} · {entry.comment_type || "General"}</Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">{formatAuditDateTime(entry.created_at)}</Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ mt: 1.25, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{entry.body_text}</Typography>
                            <Button size="small" variant="text" startIcon={<ReplyRoundedIcon />} onClick={() => { setReplyingTo(comment); setCommentText(""); }} sx={{ mt: 1 }}>
                              Reply
                            </Button>
                          </Box>
                        );
                        return (
                          <Stack key={comment.id} spacing={1.25}>
                            {commentCard(comment)}
                            {replies.map((reply) => commentCard(reply, true))}
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Stack>
            )}

            {tab === 3 && (
              <Stack spacing={2}>
                {teamContributions.length === 0 ? (
                  <EmptyState kind="no-data" title="No team contributions" body="Project lead and member contribution splits will appear here" />
                ) : teamContributions.map((member) => (
                  <Box key={member.id} sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {emptyValue(member.member_name || member.member_username)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}

            {tab === 4 && (
              <Stack spacing={2}>
                {attachments.length === 0 ? (
                  <EmptyState kind="no-data" title="No attachments yet" body="Uploaded documents and screenshots will appear here" />
                ) : attachments.map((attachment) => (
                  <Stack key={attachment.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{attachmentFileName(attachment)}</Typography>
                      <Typography variant="caption" color="text.secondary">{attachment.attachment_type || "Document"} - {formatDate(attachment.uploaded_at)}</Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} href={attachmentDownloadUrl(attachment)} target="_blank">
                      Download
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}

            {/* {tab === 4 && (
              <Stack spacing={2}>
                {notifications.length === 0 ? (
                  <EmptyState kind="no-data" title="No notifications yet" body="Status-change notifications will appear here" />
                ) : notifications.map((notification) => (
                  <Box key={notification.id} sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{notification.subject}</Typography>
                      <StatusChip status={notification.status} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{notification.notification_type} · {formatDate(notification.created_at)}</Typography>
                  </Box>
                ))}
              </Stack>
            )} */}

            {tab === 5 && (
              <Stack spacing={2}>
                {certificates.length === 0 ? (
                  <EmptyState kind="no-data" title="No certificates yet" body="Generated certificates will appear here" />
                ) : certificates.map((certificate) => {
                  const url = certificateUrl(certificate.certificate_path);
                  return (
                  <Stack key={certificate.id} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1.5} sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{certificate.certificate_number}</Typography>
                      <Typography variant="caption" color="text.secondary">{certificate.status} · Reward {formatCurrency(certificate.reward_amount)}</Typography>
                    </Box>
                    {url ? (
                      <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
                        <Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} href={url} target="_blank" rel="noopener noreferrer">
                          View
                        </Button>
                        <Button size="small" variant="contained" startIcon={<DownloadRoundedIcon />} href={url} download={certificateDownloadName(certificate)}>
                          Download
                        </Button>
                      </Stack>
                    ) : null}
                  </Stack>
                  );
                })}
              </Stack>
            )}

            {tab === 6 && (
              <Stack spacing={2}>
                {activityLogsQuery.query.isError ? (
                  <EmptyState
                    kind="error"
                    title="Unable to load activity"
                    body="There was a problem loading the activity log"
                    action={<Button variant="contained" onClick={() => activityLogsQuery.query.refetch()}>Try again</Button>}
                  />
                ) : activityLogsQuery.query.isLoading ? (
                  <Stack spacing={1}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} variant="rounded" height={48} />
                    ))}
                  </Stack>
                ) : activityRows.length === 0 ? (
                  <EmptyState kind="no-data" title="No activity yet" body="Changes to this Kaizen will appear here" />
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Table size="small" sx={{ minWidth: 1240 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 190 }}>Date &amp; Time</TableCell>
                          <TableCell sx={{ width: 220 }}>Updated By</TableCell>
                          <TableCell sx={{ width: 140 }}>Role</TableCell>
                          <TableCell sx={{ width: 150 }}>Section</TableCell>
                          <TableCell sx={{ width: 180 }}>Field</TableCell>
                          <TableCell>Previous Value</TableCell>
                          <TableCell>New Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {activityRows.map((activity) => (
                          <TableRow key={activity.id} hover title={activity.action}>
                            <TableCell>{formatAuditDateTime(activity.timestamp)}</TableCell>
                            <TableCell>{emptyValue(activity.updatedBy)}</TableCell>
                            <TableCell>{emptyValue(activity.role)}</TableCell>
                            <TableCell>{activity.section}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{activity.field}</TableCell>
                            <TableCell sx={{ maxWidth: 260, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                              {activityValueText(activity.previousValue)}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                              {activityValueText(activity.newValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Stack>
            )}

          </CardContent>
        </Card>
        {canAuditKaizen ? (
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" startIcon={<RateReviewRoundedIcon />} onClick={openAudit}>
              Audit
            </Button>
          </Stack>
        ) : null}
      </Stack>

      <Dialog open={auditOpen} onClose={() => setAuditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Audit Kaizen Benefit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">{idea.kaizen_id} - {idea.title}</Typography>
            <FormControl fullWidth>
              <InputLabel>Decision</InputLabel>
              <Select label="Decision" value={auditDecision} onChange={(event) => setAuditDecision(event.target.value)}>
                {PE_QA_AUDIT_DECISIONS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </Select>
            </FormControl>
            {auditDecision === "Rejected" ? (
              <FormControl fullWidth required>
                <InputLabel>Correction Category</InputLabel>
                <Select label="Correction Category" value={auditRejectionCategory} onChange={(event) => setAuditRejectionCategory(event.target.value)}>
                  {REJECTION_CATEGORIES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            ) : null}
            <TextField
              label={auditDecision === "Rejected" ? "Correction Reason" : "Audit Comments"}
              helperText={auditDecision === "Rejected" ? `${auditComments.trim().length}/${REVIEW_REASON_MIN_LENGTH} minimum characters` : "Required. Confirm audited benefits and closure notes"}
              value={auditComments}
              inputRef={auditCommentsInputRef}
              onChange={(event) => updateAuditComments(event.target.value)}
              onBlur={(event) => showAuditReasonLimitPopup(event.target.value)}
              multiline
              rows={4}
              required
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Hours Saved"
                type="number"
                value={auditHoursSaved}
                InputProps={{ readOnly: true }}
                helperText="Read-only for QA audit"
                fullWidth
              />
              <TextField
                label="Rework Reduced %"
                type="number"
                value={auditReworkReduced}
                InputProps={{ readOnly: true }}
                helperText="Read-only for QA audit"
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setAuditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={isAuditing ? <CircularProgress size={16} color="inherit" /> : <RateReviewRoundedIcon />}
            disabled={isAuditDisabled}
            onClick={submitAudit}
          >
            {auditDecision === "Certificate Generated" ? "Generate Certificate" : auditDecision === "Rejected" ? "Return for Correction" : "Save Audit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={withdrawOpen} onClose={closeWithdrawDialog} fullWidth maxWidth="sm">
        <DialogTitle>Withdraw this Kaizen?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <DialogContentText>
              This will move {idea.kaizen_id || idea.title} to Withdrawn and create an auditable withdrawal record. You can edit and resubmit it from My Kaizens later.
            </DialogContentText>
            <FormControl fullWidth>
              <InputLabel>Reason</InputLabel>
              <Select label="Reason" value={withdrawReason} onChange={(event) => setWithdrawReason(event.target.value)}>
                {WITHDRAWAL_REASONS.map((reason) => (
                  <MenuItem key={reason} value={reason}>{reason}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Comments"
              value={withdrawComments}
              onChange={(event) => setWithdrawComments(event.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <FormControl required error={approverConsentError}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={approverConsent}
                    inputProps={{
                      "aria-describedby": "withdraw-approver-consent-helper",
                      "aria-required": true,
                    }}
                    onChange={(event) => {
                      setApproverConsent(event.target.checked);
                      if (event.target.checked) setApproverConsentError(false);
                    }}
                  />
                }
                label="Approver consent captured when required *"
              />
              {approverConsentError ? (
                <FormHelperText id="withdraw-approver-consent-helper">
                  Approver consent is required before withdrawing this Kaizen.
                </FormHelperText>
              ) : null}
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeWithdrawDialog}>Cancel</Button>
          <Button color="error" variant="contained" startIcon={isWithdrawing ? <CircularProgress size={16} color="inherit" /> : <CancelScheduleSendRoundedIcon />} disabled={isWithdrawing} onClick={withdrawIdea}>
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

