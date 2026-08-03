import { useEffect, useMemo, useRef, useState } from "react";
import { useList, useNotification, type CrudFilters } from "@refinedev/core";
import { useNavigate } from "react-router";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RateReviewRoundedIcon from "@mui/icons-material/RateReviewRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { taruviDataProvider, taruviStorageProvider } from "../../providers/refineProviders";
import { executeFunction } from "../../utils/functionHelpers";
import { getStorageUrl } from "../../utils/storageHelpers";
import {
  REVIEW_REASON_MIN_LENGTH,
  hasReviewReasonLimitError,
  reviewErrorDescription,
  reviewReasonLimitMessage,
} from "../../utils/reviewValidation";
import {
  AccessDenied,
  ActiveFilterChips,
  backendFilterTree,
  EmptyState,
  KaizenTitleText,
  REJECTION_CATEGORIES,
  StatusChip,
  canLeadEditKaizenCorrection,
  calculateTatImpact,
  emptyValue,
  employeeDisplayLabel,
  formatDate,
  formatCurrency,
  formatFteSaving,
  hierarchyEmployeeUsernames,
  leadManagerIdeaFilterNodes,
  normalizeKaizenCategory,
  toNumber,
  useDebouncedValue,
  useKaizenRoles,
  type BackendFilterNode,
  type Department,
  type HierarchyAssignment,
  type KaizenIdea,
  type PeopleEmployee,
} from "../kaizens/shared";

const DEPENDENCY_OPTIONS = ["No", "Client", "Other Department"] as const;
import {
  benefitCalculationHelperText,
  calculateConfiguredFteSaving,
  COST_SAVED_PER_FTE_CONFIG_KEY,
  DEFAULT_COST_SAVED_PER_FTE,
  useBenefitCalculationConfigs,
  type AppConfig,
} from "../settings/shared";

type ReviewResponse = {
  success: boolean;
  error?: string;
  idea?: KaizenIdea;
  high_impact?: {
    action?: string | null;
    status?: string | null;
  };
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

type AttachmentRow = {
  id: string;
  bucket?: string | null;
  path?: string | null;
  file_name?: string | null;
  attachment_type?: string | null;
  uploaded_at?: string | null;
};

const REVIEW_DECISION_OPTIONS = [
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
] as const;
const PE_QA_REVIEW_DECISION_OPTIONS = [
  { value: "Certificate Generated", label: "Close & Generate Certificate" },
  { value: "Rejected", label: "Return for Correction" },
] as const;
const REVIEW_STATUS_OPTIONS = ["Submitted", "In Review", "Approved", "Rejected"] as const;
const PE_QA_REVIEW_STATUS_OPTIONS = [
  "Approved",
  "Pending Audit",
  "Audit In Progress",
  "Audit Pass",
  "Audit Fail",
  "Certificate Generated",
  "Rejected",
] as const;
const PE_QA_REVIEW_STAGE = "PE/QA Audit";
const HIGH_IMPACT_REVIEW_OPTIONS = ["Approved", "Rejected"] as const;
const REVIEW_ATTACHMENT_BUCKET = "kaizen-attachments";
const MAX_REVIEW_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_REVIEW_ATTACHMENT_FILES = 10;
const ACTIVE_PEOPLE_EMPLOYEE_FILTERS: CrudFilters = [{ field: "employment_status", operator: "eq", value: "active" }];
const ACTIVE_DEPARTMENT_FILTERS: CrudFilters = [{ field: "is_active", operator: "eq", value: true }];
const DEPARTMENT_PAGINATION = { currentPage: 1, pageSize: 100 };
const EMPLOYEE_PAGINATION = { currentPage: 1, pageSize: 1000 };
const EMPLOYEE_NAME_ASC_SORTERS = [
  { field: "first_name", order: "asc" as const },
  { field: "last_name", order: "asc" as const },
];
const HIDDEN_REVIEW_KAIZEN_STATUSES = ["Draft", "Withdrawn"] as const;
const EMPTY_REVIEW_IMPACT_INPUTS = {
  impacted_volume: "",
  time_saved: "",
  error_before: "",
  error_after: "",
  rework_time: "",
  total_time_saved: "",
  tat_before: "",
  tat_after: "",
  monthly_transaction_volume: "",
  revenue_generated_usd: "",
};
const TAT_BEFORE_TOOLTIP = "Before Minutes = (Before Days × Working Hours Per Day × 60)\n+ (Before Hours × 60)\n+ Before Minutes";
const TAT_AFTER_TOOLTIP = "After Minutes = (After Days × Working Hours Per Day × 60)\n+ (After Hours × 60)\n+ After Minutes";

type ReviewImpactInputs = typeof EMPTY_REVIEW_IMPACT_INPUTS;
type ReviewFilterOperator = "eq" | "ne" | "nin" | "in" | "nnull" | "gte" | "lte" | "contains";

const isLeadManagerOnly = (roles: ReturnType<typeof useKaizenRoles>) =>
  roles.isManager && !roles.isAdmin && !roles.isOmSom && !roles.isPeQa;

const isOmSomOnly = (roles: ReturnType<typeof useKaizenRoles>) =>
  roles.isOmSom && !roles.isAdmin && !roles.isPeQa;

const pushReviewFilter = (
  filters: CrudFilters,
  nodes: BackendFilterNode[],
  field: string,
  operator: ReviewFilterOperator,
  value: unknown,
) => {
  filters.push({ field, operator, value });
  nodes.push({ [`${field}__${operator}`]: value });
};

const hasMetricValue = (value: unknown) => value !== null && value !== undefined && value !== "";
const metricInputValue = (value: unknown) => (hasMetricValue(value) ? String(value) : "");
const nullableMetric = (value: string) => (value.trim() ? toNumber(value) : null);
const wholeNumberInput = (value: string) => value.replace(/[^\d]/g, "");
const decimalInput = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [first, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${first}.${rest.join("")}` : first;
};
const reviewMetricValue = (value: unknown) => {
  if (!hasMetricValue(value)) return "";
  const numberValue = toNumber(value);
  if (!Number.isFinite(numberValue)) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numberValue);
};

const reviewImpactInputsFromIdea = (idea?: KaizenIdea | null): ReviewImpactInputs => ({
  impacted_volume: metricInputValue(idea?.impacted_volume),
  time_saved: metricInputValue(idea?.time_saved),
  error_before: metricInputValue(idea?.error_before),
  error_after: metricInputValue(idea?.error_after),
  rework_time: metricInputValue(idea?.rework_time),
  total_time_saved: metricInputValue(idea?.total_time_saved),
  tat_before: metricInputValue(idea?.tat_before),
  tat_after: metricInputValue(idea?.tat_after),
  monthly_transaction_volume: metricInputValue(idea?.monthly_transaction_volume),
  revenue_generated_usd: metricInputValue(idea?.revenue_generated_usd),
});

const hasConfiguredFteInputs = (category: string, inputs: ReviewImpactInputs) => {
  if (category === "Productivity") return hasMetricValue(inputs.impacted_volume) && hasMetricValue(inputs.time_saved);
  if (category === "Quality") return hasMetricValue(inputs.error_before) && hasMetricValue(inputs.error_after) && hasMetricValue(inputs.rework_time);
  if (category === "Other") return hasMetricValue(inputs.total_time_saved);
  if (category === "TAT") return hasMetricValue(inputs.tat_before) && hasMetricValue(inputs.tat_after);
  return false;
};

const calculatedReworkReduced = (category: string, inputs: ReviewImpactInputs) => {
  if (category !== "Quality" || !hasMetricValue(inputs.error_before) || !hasMetricValue(inputs.error_after)) return null;
  const errorBefore = toNumber(inputs.error_before);
  if (errorBefore <= 0) return null;
  return ((errorBefore - toNumber(inputs.error_after)) / errorBefore) * 100;
};

const calculatedHoursSaved = (category: string, inputs: ReviewImpactInputs) => {
  if (category === "Productivity" && hasMetricValue(inputs.impacted_volume) && hasMetricValue(inputs.time_saved)) {
    return (toNumber(inputs.impacted_volume) * toNumber(inputs.time_saved)) / 60;
  }
  if (category === "Quality" && hasMetricValue(inputs.error_before) && hasMetricValue(inputs.error_after) && hasMetricValue(inputs.rework_time)) {
    return ((toNumber(inputs.error_before) - toNumber(inputs.error_after)) * toNumber(inputs.rework_time)) / 60;
  }
  if (category === "Other" && hasMetricValue(inputs.total_time_saved)) {
    return toNumber(inputs.total_time_saved) / 60;
  }
  if (category === "TAT") return 0;
  return null;
};

const derivedHoursSaved = (idea: KaizenIdea) => {
  if (hasMetricValue(idea.hours_saved)) return reviewMetricValue(idea.hours_saved);

  const category = normalizeKaizenCategory(idea.category);
  if (category === "Productivity" && hasMetricValue(idea.impacted_volume) && hasMetricValue(idea.time_saved)) {
    return reviewMetricValue((toNumber(idea.impacted_volume) * toNumber(idea.time_saved)) / 60);
  }
  if (
    category === "Quality" &&
    hasMetricValue(idea.error_before) &&
    hasMetricValue(idea.error_after) &&
    hasMetricValue(idea.rework_time)
  ) {
    return reviewMetricValue(((toNumber(idea.error_before) - toNumber(idea.error_after)) * toNumber(idea.rework_time)) / 60);
  }
  if (category === "Other" && hasMetricValue(idea.total_time_saved)) {
    return reviewMetricValue(toNumber(idea.total_time_saved) / 60);
  }
  if (category === "TAT" && hasMetricValue(idea.tat_before) && hasMetricValue(idea.tat_after)) return "0";
  return "";
};

const derivedReworkReduced = (idea: KaizenIdea) => {
  if (hasMetricValue(idea.rework_reduced_percent)) return reviewMetricValue(idea.rework_reduced_percent);

  if (normalizeKaizenCategory(idea.category) !== "Quality") return "";
  const errorBefore = toNumber(idea.error_before);
  const errorAfter = toNumber(idea.error_after);
  if (!hasMetricValue(idea.error_before) || !hasMetricValue(idea.error_after) || errorBefore <= 0) return "";

  return reviewMetricValue(((errorBefore - errorAfter) / errorBefore) * 100);
};

const attachmentFileName = (attachment: AttachmentRow) =>
  attachment.file_name || attachment.path?.split("/").pop() || "Attachment";

const attachmentDownloadUrl = (attachment: AttachmentRow) =>
  getStorageUrl(attachment.bucket || REVIEW_ATTACHMENT_BUCKET, attachment.path);

export const ReviewsPage = () => {
  const navigate = useNavigate();
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Submitted");
  const [departmentName, setDepartmentName] = useState("");
  const [employee, setEmployee] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<KaizenIdea | null>(null);
  const [decision, setDecision] = useState("Approved");
  const [dependency, setDependency] = useState("");
  const [rejectionCategory, setRejectionCategory] = useState("");
  const [comments, setComments] = useState("");
  const commentsRef = useRef("");
  const commentsInputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const [hoursSaved, setHoursSaved] = useState("");
  const [reworkReduced, setReworkReduced] = useState("");
  const [impactInputs, setImpactInputs] = useState<ReviewImpactInputs>(EMPTY_REVIEW_IMPACT_INPUTS);
  const [fteCostUsd, setFteCostUsd] = useState("");
  const [highImpactNominate, setHighImpactNominate] = useState(false);
  const [highImpactReason, setHighImpactReason] = useState("");
  const [highImpactDecision, setHighImpactDecision] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<AttachmentRow | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const fteCostConfigFilters = useMemo<CrudFilters>(
    () => [{ field: "config_key", operator: "eq", value: COST_SAVED_PER_FTE_CONFIG_KEY }],
    [],
  );
  const { result: fteCostConfigResult } = useList<AppConfig>({
    resource: "kaizen_app_configs",
    filters: fteCostConfigFilters,
    pagination: { currentPage: 1, pageSize: 1 },
  });
  const defaultFteCostUsd = toNumber(fteCostConfigResult.data?.[0]?.number_value) > 0
    ? toNumber(fteCostConfigResult.data?.[0]?.number_value)
    : DEFAULT_COST_SAVED_PER_FTE;
  const debouncedSearch = useDebouncedValue(search);
  const debouncedEmployee = useDebouncedValue(employee);
  const leadManagerOnly = isLeadManagerOnly(roles);
  const omSomOnly = isOmSomOnly(roles);
  const peQaOnly = roles.isPeQa && !roles.isAdmin;
  const statusOptions = peQaOnly ? PE_QA_REVIEW_STATUS_OPTIONS : REVIEW_STATUS_OPTIONS;
  const visibleStatus = status && (statusOptions as readonly string[]).includes(status) ? status : "";
  const canManageReviewAttachments = leadManagerOnly || omSomOnly;
  const attachmentFilters = useMemo<CrudFilters>(
    () => selected?.id ? [{ field: "idea_id", operator: "eq", value: selected.id }] : [{ field: "id", operator: "eq", value: "__no_idea__" }],
    [selected?.id],
  );
  const attachmentQueryOptions = useMemo(
    () => ({ enabled: canManageReviewAttachments && Boolean(selected?.id) }),
    [canManageReviewAttachments, selected?.id],
  );
  const { result: attachmentsResult, query: attachmentsQuery } = useList<AttachmentRow>({
    resource: "kaizen_attachments",
    filters: attachmentFilters,
    sorters: [{ field: "uploaded_at", order: "desc" }],
    pagination: { currentPage: 1, pageSize: 100 },
    queryOptions: attachmentQueryOptions,
  });
  const reviewAttachments = attachmentsResult.data ?? [];

  useEffect(() => {
    if (status && !(statusOptions as readonly string[]).includes(status)) {
      setStatus(peQaOnly ? "" : statusOptions[0] ?? "");
      setPage(0);
    }
  }, [peQaOnly, status, statusOptions]);

  useEffect(() => {
    if (omSomOnly && status === "Submitted") {
      setStatus("In Review");
      setPage(0);
    }
  }, [omSomOnly, status]);

  const { result: departmentsResult } = useList<Department>({
    resource: "departments",
    filters: ACTIVE_DEPARTMENT_FILTERS,
    sorters: [{ field: "name", order: "asc" }],
    pagination: DEPARTMENT_PAGINATION,
  });
  const { result: employeesResult, query: employeesQuery } = useList<PeopleEmployee>({
    resource: "employees",
    filters: ACTIVE_PEOPLE_EMPLOYEE_FILTERS,
    sorters: EMPLOYEE_NAME_ASC_SORTERS,
    pagination: EMPLOYEE_PAGINATION,
  });
  const assignmentFilters = useMemo<CrudFilters>(
    () =>
      leadManagerOnly && roles.identity?.username
        ? [
            { field: "manager_username", operator: "eq", value: roles.identity.username },
            { field: "status", operator: "eq", value: "Active" },
          ]
        : [{ field: "id", operator: "eq", value: "__no_manager__" }],
    [leadManagerOnly, roles.identity?.username],
  );
  const assignmentOptions = useMemo(
    () => ({ enabled: leadManagerOnly && Boolean(roles.identity?.username) }),
    [leadManagerOnly, roles.identity?.username],
  );
  const { result: assignmentsResult } = useList<HierarchyAssignment>({
    resource: "kaizen_hierarchy_assignments",
    filters: assignmentFilters,
    pagination: { currentPage: 1, pageSize: 500 },
    queryOptions: assignmentOptions,
  });
  const assignedUsernames = useMemo(
    () => hierarchyEmployeeUsernames(assignmentsResult.data ?? [], roles.identity?.username),
    [assignmentsResult.data, roles.identity?.username],
  );

  const filters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    const leadManagerNodes: BackendFilterNode[] = [];
    pushReviewFilter(next, leadManagerNodes, "status", "nin", HIDDEN_REVIEW_KAIZEN_STATUSES);
    if (debouncedSearch.trim()) pushReviewFilter(next, leadManagerNodes, "search", "eq", debouncedSearch.trim());
    if (visibleStatus) {
      if (leadManagerOnly && visibleStatus === "Submitted") {
        pushReviewFilter(next, leadManagerNodes, "current_stage", "eq", "Lead/Manager Review");
        pushReviewFilter(next, leadManagerNodes, "status", "in", ["Submitted", "Resubmitted"]);
      } else if (leadManagerOnly && visibleStatus === "Approved") {
        pushReviewFilter(next, leadManagerNodes, "approved_at", "nnull", true);
      } else if (omSomOnly && visibleStatus === "In Review") {
        pushReviewFilter(next, leadManagerNodes, "current_stage", "eq", "OM/SOM Review");
      } else if (omSomOnly && visibleStatus === "Approved") {
        pushReviewFilter(next, leadManagerNodes, "status", "eq", "Approved");
        pushReviewFilter(next, leadManagerNodes, "om_som_comments", "nnull", true);
      } else if (omSomOnly && visibleStatus === "Rejected") {
        pushReviewFilter(next, leadManagerNodes, "status", "eq", "Rejected");
        pushReviewFilter(next, leadManagerNodes, "om_som_comments", "nnull", true);
      } else {
        pushReviewFilter(next, leadManagerNodes, "status", "eq", visibleStatus);
      }
    } else if (omSomOnly) {
      pushReviewFilter(next, leadManagerNodes, "current_stage", "eq", "OM/SOM Review");
    } else if (peQaOnly) {
      pushReviewFilter(next, leadManagerNodes, "current_stage", "eq", PE_QA_REVIEW_STAGE);
    }
    if (departmentName) pushReviewFilter(next, leadManagerNodes, "department_name", "eq", departmentName);
    if (debouncedEmployee.trim()) pushReviewFilter(next, leadManagerNodes, "submitted_by_email", "contains", debouncedEmployee.trim());
    if (dateFrom) pushReviewFilter(next, leadManagerNodes, "submitted_at", "gte", dateFrom);
    if (dateTo) pushReviewFilter(next, leadManagerNodes, "submitted_at", "lte", `${dateTo}T23:59:59`);
    if (leadManagerOnly && roles.identity?.username) {
      const scopeNodes = leadManagerIdeaFilterNodes(roles.identity.username, assignedUsernames);
      return scopeNodes ? backendFilterTree([...leadManagerNodes, ...scopeNodes]) : [{ field: "id", operator: "eq", value: "__no_manager__" }];
    }
    return next;
  }, [assignedUsernames, dateFrom, dateTo, debouncedEmployee, debouncedSearch, departmentName, leadManagerOnly, omSomOnly, peQaOnly, roles.identity?.username, visibleStatus]);

  const { result, query } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters,
    sorters: [{ field: "submitted_at", order: "asc" }],
    pagination: { currentPage: page + 1, pageSize },
  });

  const selectedBenefitType = selected ? normalizeKaizenCategory(selected.category) : "";
  const reviewerRole = roles.isAdmin ? "Executive View" : omSomOnly ? "OM/SOM" : leadManagerOnly ? "Lead/Manager" : roles.isOmSom ? "OM/SOM" : roles.isManager ? "Lead/Manager" : roles.isPeQa ? "PE/QA" : "Executive View";
  const calculatedFteSaving = useMemo(() => {
    if (selectedBenefitType === "Revenue Generation") {
      const revenueGenerated = Number(impactInputs.revenue_generated_usd);
      const fteCost = Number(fteCostUsd);
      return reviewerRole === "OM/SOM" && Number.isFinite(revenueGenerated) && revenueGenerated > 0 && Number.isFinite(fteCost) && fteCost > 0
        ? revenueGenerated / fteCost
        : null;
    }
    return selectedBenefitType && hasConfiguredFteInputs(selectedBenefitType, impactInputs)
      ? calculateConfiguredFteSaving({ ...impactInputs, category: selectedBenefitType }, benefitCalculationConfigs)
      : null;
  }, [benefitCalculationConfigs, fteCostUsd, impactInputs, reviewerRole, selectedBenefitType]);
  const calculatedReviewReworkReduced = useMemo(
    () => calculatedReworkReduced(selectedBenefitType, impactInputs),
    [impactInputs, selectedBenefitType],
  );
  const calculatedReviewHoursSaved = useMemo(
    () => calculatedHoursSaved(selectedBenefitType, impactInputs),
    [impactInputs, selectedBenefitType],
  );
  const calculatedCostSaved = useMemo(() => {
    const cost = Number(fteCostUsd);
    return calculatedFteSaving !== null && Number.isFinite(cost) && cost > 0
      ? calculatedFteSaving * cost
      : null;
  }, [calculatedFteSaving, fteCostUsd]);

  if (!roles.canReview) return <AccessDenied title="Review access required" />;

  const rows = result.data ?? [];
  const total = result.total ?? 0;
  const departments = useMemo(
    () => Array.from(
      new Map(
        (departmentsResult.data ?? [])
          .filter((department) => department.name?.trim())
          .map((department) => [department.name.trim().toLowerCase(), { ...department, name: department.name.trim() }]),
      ).values(),
    ),
    [departmentsResult.data],
  );
  const employees = employeesResult.data ?? [];
  const selectedEmployee = employees.find((row) => row.email === employee || row.id === employee || row.employee_number === employee);
  const activeFilters = [
    visibleStatus ? { key: "status", label: `Status: ${visibleStatus}` } : null,
    departmentName ? { key: "departmentName", label: `Department: ${departmentName}` } : null,
    employee ? { key: "employee", label: `Employee: ${employeeDisplayLabel(selectedEmployee) || employee}` } : null,
    dateFrom ? { key: "dateFrom", label: `From: ${formatDate(dateFrom)}` } : null,
    dateTo ? { key: "dateTo", label: `To: ${formatDate(dateTo)}` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const isPeQaReviewer = reviewerRole === "PE/QA";
  const usesCalculatedImpactInputs = reviewerRole === "Lead/Manager" || reviewerRole === "OM/SOM";
  const decisionOptions = isPeQaReviewer ? PE_QA_REVIEW_DECISION_OPTIONS : REVIEW_DECISION_OPTIONS;
  const canNominateHighImpact = reviewerRole === "Lead/Manager";
  const hasPendingHighImpactNomination = selected?.high_impact_nomination_status === "Nominated";
  const canDecideHighImpact = reviewerRole === "OM/SOM" && hasPendingHighImpactNomination;
  const pageContent = (() => {
    if (leadManagerOnly) {
      return {
        title: "Team Review Queue",
        subtitle: "Review newly submitted Kaizens from your team and move approved ideas to OM/SOM review.",
        searchPlaceholder: "Search team Kaizens",
        impactColumn: "Hours Saved",
        emptyTitle: "No team reviews pending",
        emptyBody: "Submitted team Kaizens that need your decision will appear here.",
        dialogTitle: "Review Team Kaizen",
      };
    }
    if (omSomOnly) {
      return {
        title: "OM/SOM Review Queue",
        subtitle: "Review Kaizens approved by leads, decide OM/SOM approval, and resolve High Impact nominations.",
        searchPlaceholder: "Search OM/SOM reviews",
        impactColumn: "Hours Saved",
        emptyTitle: "No OM/SOM reviews pending",
        emptyBody: "Lead-approved Kaizens that need OM/SOM review will appear here.",
        dialogTitle: "Review Kaizen",
      };
    }
    if (isPeQaReviewer) {
      return {
        title: "PE/QA Audit Queue",
        subtitle: "Audit approved Kaizen benefits, return corrections when needed, and generate certificates.",
        searchPlaceholder: "Search audit Kaizens",
        impactColumn: "Audited Hours",
        emptyTitle: "No audits pending",
        emptyBody: "Approved Kaizens that need PE/QA audit will appear here.",
        dialogTitle: "Audit Kaizen Benefit",
      };
    }
    return {
      title: "Review Queue",
      subtitle: "Monitor Kaizens moving through lead, OM/SOM, and PE/QA review.",
      searchPlaceholder: "Search review queue",
      impactColumn: "Hours Saved",
      emptyTitle: "No reviews pending",
      emptyBody: "Kaizens that require review action will appear here.",
      dialogTitle: "Review Kaizen",
    };
  })();

  const savedCommentsForRole = (idea: KaizenIdea) => {
    if (reviewerRole === "Lead/Manager") return idea.manager_review_comments ?? "";
    if (reviewerRole === "OM/SOM") return idea.om_som_comments ?? "";
    if (reviewerRole === "PE/QA") return idea.pe_qa_comments ?? "";
    return idea.manager_review_comments ?? idea.om_som_comments ?? idea.pe_qa_comments ?? idea.rejection_reason ?? "";
  };

  const reviewAvailability = (idea: KaizenIdea) => {
    const stage = idea.current_stage ?? "";
    const rowStatus = idea.status ?? "";

    if (leadManagerOnly) {
      const enabled = stage === "Lead/Manager Review" && ["Submitted", "Resubmitted"].includes(rowStatus);
      return {
        enabled,
        reason: enabled ? "Review this Kaizen" : "Lead/Manager review is locked after the Kaizen moves to the next stage.",
      };
    }

    if (omSomOnly) {
      const enabled = stage === "OM/SOM Review" && rowStatus === "In Review";
      return {
        enabled,
        reason: enabled ? "Review this Kaizen" : "OM/SOM review is available only while the Kaizen is in OM/SOM Review.",
      };
    }

    if (roles.isPeQa && !roles.isAdmin) {
      const enabled = stage === "PE/QA Audit" || rowStatus === "Approved";
      return {
        enabled,
        reason: enabled ? "Review this Kaizen" : "PE/QA review is available only after OM/SOM approval.",
      };
    }

    const enabled = !["Closed", "Rejected", "Certificate Generated", "Withdrawn"].includes(rowStatus);
    return {
      enabled,
      reason: enabled ? "Review this Kaizen" : "This Kaizen workflow is closed.",
    };
  };

  const openReview = (idea: KaizenIdea) => {
    const initialComments = String(savedCommentsForRole(idea));
    setSelected(idea);
    setDecision(isPeQaReviewer ? "Certificate Generated" : "Approved");
    setDependency(String(idea.dependency ?? ""));
    setRejectionCategory("");
    commentsRef.current = initialComments;
    setComments(initialComments);
    setHoursSaved(derivedHoursSaved(idea));
    setReworkReduced(derivedReworkReduced(idea));
    setImpactInputs(reviewImpactInputsFromIdea(idea));
    setFteCostUsd(String(toNumber(idea.fte_cost_usd) > 0 ? toNumber(idea.fte_cost_usd) : defaultFteCostUsd));
    setHighImpactNominate(idea.high_impact_nomination_status === "Nominated");
    setHighImpactReason(String(idea.high_impact_nomination_reason ?? ""));
    setHighImpactDecision("");
    setAttachmentFiles([]);
  };

  const closeReview = () => {
    setSelected(null);
    setDependency("");
    setFteCostUsd("");
    setAttachmentFiles([]);
    setAttachmentToDelete(null);
  };

  const uploadReviewAttachments = async () => {
    if (!selected || attachmentFiles.length === 0 || !canManageReviewAttachments) return;
    if (attachmentFiles.length > MAX_REVIEW_ATTACHMENT_FILES) {
      open?.({ type: "error", message: "Too many files", description: `Select up to ${MAX_REVIEW_ATTACHMENT_FILES} files at a time.` });
      return;
    }
    const oversized = attachmentFiles.filter((file) => file.size > MAX_REVIEW_ATTACHMENT_SIZE);
    if (oversized.length > 0) {
      open?.({ type: "error", message: "File too large", description: `${oversized.map((file) => file.name).join(", ")} exceed the 10 MB limit.` });
      return;
    }

    setIsUploadingAttachments(true);
    const failed: string[] = [];
    let uploadedCount = 0;
    for (const [index, file] of attachmentFiles.entries()) {
      const path = `ideas/${selected.id}/reviews/${Date.now()}-${index}-${file.name}`;
      try {
        await taruviStorageProvider.create({
          resource: REVIEW_ATTACHMENT_BUCKET,
          variables: { files: [file], paths: [path], metadatas: [{ idea_id: selected.id, file_name: file.name, uploaded_during_review: true }] },
          meta: {},
        });
        try {
          await taruviDataProvider.create({
            resource: "kaizen_attachments",
            variables: {
              idea_id: selected.id,
              bucket: REVIEW_ATTACHMENT_BUCKET,
              path,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type || "application/octet-stream",
              attachment_type: file.type.startsWith("image/") ? "Before Screenshot" : "Document",
              uploaded_by_username: roles.identity?.username,
              uploaded_at: new Date().toISOString(),
            },
            meta: {},
          });
        } catch (metadataError) {
          await taruviStorageProvider.deleteOne({ resource: REVIEW_ATTACHMENT_BUCKET, id: path, meta: {} }).catch(() => undefined);
          throw metadataError;
        }
        uploadedCount += 1;
      } catch {
        failed.push(file.name);
      }
    }
    if (uploadedCount > 0) {
      open?.({ type: "success", message: `${uploadedCount} ${uploadedCount === 1 ? "attachment" : "attachments"} uploaded`, description: "The review attachment list has been updated." });
      setAttachmentFiles([]);
      await attachmentsQuery.refetch();
    }
    if (failed.length > 0) {
      open?.({ type: "error", message: `${failed.length} ${failed.length === 1 ? "upload" : "uploads"} failed`, description: failed.join(", ") });
    }
    setIsUploadingAttachments(false);
  };

  const deleteReviewAttachment = async () => {
    if (!attachmentToDelete || !canManageReviewAttachments) return;
    setIsDeletingAttachment(true);
    const fileName = attachmentFileName(attachmentToDelete);
    try {
      await taruviDataProvider.deleteOne({ resource: "kaizen_attachments", id: attachmentToDelete.id, meta: {} });
      if (attachmentToDelete.path) {
        await taruviStorageProvider.deleteOne({
          resource: attachmentToDelete.bucket || REVIEW_ATTACHMENT_BUCKET,
          id: attachmentToDelete.path,
          meta: {},
        });
      }
      open?.({ type: "success", message: "Attachment deleted", description: `${fileName} was permanently deleted.` });
      setAttachmentToDelete(null);
      await attachmentsQuery.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to delete attachment", description: reviewErrorDescription(error) });
    } finally {
      setIsDeletingAttachment(false);
    }
  };

  const updateComments = (value: string) => {
    commentsRef.current = value;
    setComments(value);
  };

  const updateImpactInput = (field: keyof ReviewImpactInputs, value: string) => {
    setImpactInputs((current) => ({ ...current, [field]: value }));
  };

  const calculatedImpactMetrics = () => {
    const metrics: Record<string, unknown> = {
      category: selectedBenefitType || selected?.category || null,
      hours_saved: calculatedReviewHoursSaved,
      fte_saving: calculatedFteSaving,
      rework_reduced_percent: selectedBenefitType === "Quality" ? calculatedReviewReworkReduced : null,
      fte_cost_usd: reviewerRole === "OM/SOM" ? Number(fteCostUsd) : selected?.fte_cost_usd ?? null,
      cost_saved: reviewerRole === "OM/SOM" ? calculatedCostSaved : selected?.cost_saved ?? null,
    };

    if (selectedBenefitType === "Productivity") {
      metrics.impacted_volume = nullableMetric(impactInputs.impacted_volume);
      metrics.time_saved = nullableMetric(impactInputs.time_saved);
      metrics.error_before = null;
      metrics.error_after = null;
      metrics.rework_time = null;
      metrics.total_time_saved = null;
    } else if (selectedBenefitType === "Quality") {
      metrics.impacted_volume = null;
      metrics.time_saved = null;
      metrics.error_before = nullableMetric(impactInputs.error_before);
      metrics.error_after = nullableMetric(impactInputs.error_after);
      metrics.rework_time = nullableMetric(impactInputs.rework_time);
      metrics.total_time_saved = null;
    } else if (selectedBenefitType === "Other") {
      metrics.impacted_volume = null;
      metrics.time_saved = null;
      metrics.error_before = null;
      metrics.error_after = null;
      metrics.rework_time = null;
      metrics.total_time_saved = nullableMetric(impactInputs.total_time_saved);
    } else if (selectedBenefitType === "TAT") {
      const tatImpact = calculateTatImpact(impactInputs);
      metrics.impacted_volume = null;
      metrics.time_saved = null;
      metrics.error_before = null;
      metrics.error_after = null;
      metrics.rework_time = null;
      metrics.total_time_saved = null;
      metrics.tat_before = nullableMetric(impactInputs.tat_before);
      metrics.tat_after = nullableMetric(impactInputs.tat_after);
      metrics.monthly_transaction_volume = null;
      metrics.monthly_time_saved = null;
      metrics.tat_improvement_percent = tatImpact.improvementPercent;
    } else if (selectedBenefitType === "Revenue Generation") {
      metrics.revenue_generated_usd = nullableMetric(impactInputs.revenue_generated_usd);
    }

    return metrics;
  };

  const submitReview = async () => {
    if (!selected) return;
    const currentComments = commentsInputRef.current?.value ?? (commentsRef.current || comments);
    const commentsText = currentComments.trim();
    if (!commentsText) {
      open?.({ type: "error", message: "Comments required", description: "Add review comments before saving this decision." });
      return;
    }
    if (decision === "Rejected" && !rejectionCategory) {
      open?.({
        type: "error",
        message: `${isPeQaReviewer ? "Correction" : "Rejection"} category required`,
        description: `Choose a ${isPeQaReviewer ? "correction" : "rejection"} category before saving this decision.`,
      });
      return;
    }
    if (usesCalculatedImpactInputs && !(DEPENDENCY_OPTIONS as readonly string[]).includes(dependency)) {
      open?.({ type: "error", message: "Dependency required", description: "Select a dependency before saving this review." });
      return;
    }
    if (selectedBenefitType === "TAT") {
      if (!hasConfiguredFteInputs("TAT", impactInputs)) {
        open?.({ type: "error", message: "TAT inputs required", description: "Enter TAT Before and TAT After." });
        return;
      }
      if (toNumber(impactInputs.tat_before) <= 0) {
        open?.({ type: "error", message: "Invalid TAT Before", description: "TAT Before must be greater than zero." });
        return;
      }
      if (toNumber(impactInputs.tat_after) > toNumber(impactInputs.tat_before)) {
        open?.({ type: "error", message: "Invalid TAT values", description: "TAT After cannot be greater than TAT Before." });
        return;
      }
    }
    if (selectedBenefitType === "Revenue Generation" && toNumber(impactInputs.revenue_generated_usd) <= 0) {
      open?.({ type: "error", message: "Revenue amount required", description: "Enter a Revenue Generated (USD) amount greater than zero." });
      return;
    }
    if (reviewerRole === "OM/SOM" && (!Number.isFinite(Number(fteCostUsd)) || Number(fteCostUsd) <= 0)) {
      open?.({ type: "error", message: "FTE Cost required", description: "Enter an FTE Cost (USD) greater than 0 before saving the OM review." });
      return;
    }
    if (decision === "Rejected" && hasReviewReasonLimitError(currentComments)) {
      open?.({
        type: "error",
        message: "Character limit not met",
        description: reviewReasonLimitMessage(isPeQaReviewer ? "Correction reason" : "Rejection reason"),
      });
      return;
    }
    if (canNominateHighImpact && highImpactNominate && !highImpactReason.trim()) {
      open?.({ type: "error", message: "High Impact reason required", description: "Add the nomination reason before saving this review." });
      return;
    }
    if (canDecideHighImpact && decision === "Approved" && !highImpactDecision) {
      open?.({
        type: "error",
        message: "High Impact nomination pending",
        description: "Approve or reject the High Impact nomination before approving this Kaizen.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const impactMetrics = usesCalculatedImpactInputs
        ? calculatedImpactMetrics()
        : {
            hours_saved: hoursSaved,
            rework_reduced_percent: reworkReduced,
          };
      const reviewFunctionSlug = usesCalculatedImpactInputs ? "kaizen-review-benefits" : "kaizen-review-idea";
      const response = await executeFunction<ReviewResponse>(reviewFunctionSlug, {
        idea_id: selected.id,
        decision,
        reviewer_role: reviewerRole,
        dependency: usesCalculatedImpactInputs ? dependency : undefined,
        fte_cost_usd: reviewerRole === "OM/SOM" ? Number(fteCostUsd) : undefined,
        rejection_category: rejectionCategory || undefined,
        comments: commentsText,
        correction_reason: isPeQaReviewer && decision === "Rejected" ? commentsText : undefined,
        rejection_reason: !isPeQaReviewer && decision === "Rejected" ? commentsText : undefined,
        reason: decision === "Rejected" ? commentsText : undefined,
        impact_metrics: impactMetrics,
        high_impact: {
          nominate: canNominateHighImpact ? highImpactNominate : undefined,
          nomination_reason: canNominateHighImpact && highImpactNominate ? highImpactReason : undefined,
          decision: canDecideHighImpact && highImpactDecision ? highImpactDecision : undefined,
          decision_comments: canDecideHighImpact && highImpactDecision ? commentsText : undefined,
        },
        portal_base_url: window.location.origin,
      });
      if (!response.success) throw new Error(response.error || "Review failed");
      if (isPeQaReviewer && decision === "Certificate Generated") {
        const certificateResponse = await executeFunction<CertificateRenderResponse>("kaizen-cert-template-lite", {
          action: "regenerate",
          idea_id: response.idea?.id || selected.id,
        });
        if (certificateResponse.success === false) {
          throw new Error(certificateResponse.error || certificateResponse.message || "Certificate rendering failed");
        }
      }
      const kaizenLabel = selected.kaizen_id || selected.title || "Kaizen";
      const highImpactAction = response.high_impact?.action;
      const nextNotificationCount = (response.next_notifications ?? []).filter(
        (notification) => notification && notification.status !== "Skipped",
      ).length;
      const nextNotificationText =
        nextNotificationCount > 0
          ? ` ${nextNotificationCount === 1 ? "The next reviewer was" : "Next reviewers were"} notified.`
          : "";
      let successMessage = "Review saved";
      let successDescription = `${kaizenLabel} is now ${response.idea?.status ?? "updated"}.${nextNotificationText}`;
      if (isPeQaReviewer && decision === "Audit Closed") {
        successMessage = "Kaizen closed";
        successDescription = `${kaizenLabel} benefits were audited and the Kaizen is now closed.${nextNotificationText}`;
      } else if (isPeQaReviewer && decision === "Certificate Generated") {
        successMessage = "Certificate generated";
        successDescription = `${kaizenLabel} benefits were audited, the Kaizen was closed, and the certificate was generated.${nextNotificationText}`;
      } else if (isPeQaReviewer && decision === "Rejected") {
        successMessage = "Returned for correction";
        successDescription = `${kaizenLabel} was returned to the Lead/Manager queue for correction.${nextNotificationText}`;
      } else if (canNominateHighImpact && highImpactNominate && highImpactAction === "Nominated") {
        successMessage = "High Impact nomination submitted";
        successDescription = `${kaizenLabel} was approved and nominated for High Impact review.${nextNotificationText}`;
      } else if (canDecideHighImpact && highImpactDecision) {
        successMessage = `High Impact nomination ${highImpactDecision.toLowerCase()}`;
        successDescription = `${kaizenLabel} review saved and the High Impact nomination was ${highImpactDecision.toLowerCase()}.${nextNotificationText}`;
      }

      open?.({ type: "success", message: successMessage, description: successDescription });
      setSelected(null);
      query.refetch();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save review", description: reviewErrorDescription(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilter = (key: string) => {
    if (key === "status") setStatus("");
    if (key === "departmentName") setDepartmentName("");
    if (key === "employee") setEmployee("");
    if (key === "dateFrom") setDateFrom("");
    if (key === "dateTo") setDateTo("");
    setPage(0);
  };

  const clearAllFilters = () => {
    setStatus("");
    setDepartmentName("");
    setEmployee("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const showReasonLimitPopup = (value = commentsRef.current) => {
    if (decision !== "Rejected" || !hasReviewReasonLimitError(value)) return;
    open?.({
      type: "error",
      message: "Character limit not met",
      description: reviewReasonLimitMessage(isPeQaReviewer ? "Correction reason" : "Rejection reason"),
    });
  };

  const isReviewDisabled =
    isSubmitting ||
    !comments.trim() ||
    (decision === "Rejected" && (!rejectionCategory || comments.trim().length < REVIEW_REASON_MIN_LENGTH)) ||
    (canNominateHighImpact && highImpactNominate && !highImpactReason.trim());
  const submitLabel = isPeQaReviewer
    ? decision === "Certificate Generated"
      ? "Generate Certificate"
      : decision === "Rejected"
        ? "Return for Correction"
      : "Save Audit"
    : "Save Review";
  const reviewColumnWidths = {
    kaizen: "38%",
    status: "12%",
    department: "14%",
    submitted: "10%",
    impact: "12%",
    actions: "14%",
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h2">{pageContent.title}</Typography>
          <Typography variant="body2" color="text.secondary">{pageContent.subtitle}</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, "&:last-child": { pb: { xs: 2, md: 2.5 } } }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  size="small"
                  placeholder={pageContent.searchPlaceholder}
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment>,
                    endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch("")}><CloseRoundedIcon fontSize="small" /></IconButton></InputAdornment> : undefined,
                  }}
                  sx={{ width: { xs: "100%", md: 320 } }}
                />
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel shrink>Status</InputLabel>
                  <Select
                    label="Status"
                    value={visibleStatus}
                    displayEmpty
                    renderValue={(selected) => String(selected || "All statuses")}
                    onChange={(event) => { setStatus(event.target.value); setPage(0); }}
                  >
                    <MenuItem value="">All statuses</MenuItem>
                    {statusOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel shrink>Department</InputLabel>
                  <Select
                    label="Department"
                    value={departmentName}
                    displayEmpty
                    renderValue={(selected) => String(selected || "All departments")}
                    onChange={(event) => { setDepartmentName(event.target.value); setPage(0); }}
                  >
                    <MenuItem value="">All departments</MenuItem>
                    {departments.map((department) => <MenuItem key={department.name.toLowerCase()} value={department.name}>{department.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Autocomplete
                  size="small"
                  options={employees}
                  value={selectedEmployee ?? null}
                  loading={employeesQuery.isLoading}
                  getOptionLabel={(option) => employeeDisplayLabel(option)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, nextEmployee) => {
                    setEmployee(nextEmployee?.email ?? "");
                    setPage(0);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Employee"
                      helperText={employeesQuery.isError ? "Unable to load People employees." : undefined}
                    />
                  )}
                  sx={{ width: { xs: "100%", md: 260 } }}
                />
                <TextField
                  size="small"
                  label="Submitted from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => { setDateFrom(event.target.value); setPage(0); }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  label="Submitted to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => { setDateTo(event.target.value); setPage(0); }}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              <ActiveFilterChips filters={activeFilters} onDelete={clearFilter} onClear={clearAllFilters} />

              <Box sx={{ width: "100%", overflowX: "hidden" }}>
                <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: reviewColumnWidths.kaizen }}>Kaizen</TableCell>
                      <TableCell sx={{ width: reviewColumnWidths.status }}>Status</TableCell>
                      <TableCell sx={{ width: reviewColumnWidths.department }}>Department</TableCell>
                      <TableCell sx={{ width: reviewColumnWidths.submitted, whiteSpace: "nowrap" }}>Submitted</TableCell>
                      <TableCell align="right" sx={{ width: reviewColumnWidths.impact, whiteSpace: "nowrap" }}>{pageContent.impactColumn}</TableCell>
                      <TableCell align="right" sx={{ width: reviewColumnWidths.actions, whiteSpace: "nowrap" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {query.isLoading ? Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>{Array.from({ length: 6 }).map((__, cell) => <TableCell key={cell}><Skeleton /></TableCell>)}</TableRow>
                    )) : rows.map((row) => {
                      const availability = reviewAvailability(row);
                      const canEditCorrection =
                        leadManagerOnly &&
                        canLeadEditKaizenCorrection(row, roles.identity?.username);
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ minWidth: 0 }}>
                            <KaizenTitleText title={row.title} />
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                              {emptyValue(row.kaizen_id)} - {emptyValue(row.submitted_by_name || row.submitted_by_username)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 0 }}>
                            <Stack spacing={0.5} alignItems="flex-start">
                              <StatusChip status={row.status} />
                              {row.current_stage ? (
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                                  {row.current_stage}
                                </Typography>
                              ) : null}
                              {row.high_impact_nomination_status && row.high_impact_nomination_status !== "Not Nominated" ? (
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                                  High Impact: {row.high_impact_nomination_status}
                                </Typography>
                              ) : null}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{emptyValue(row.department_name)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(row.submitted_at)}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{emptyValue(derivedHoursSaved(row))}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            <Stack direction="row" spacing={0.75} justifyContent="flex-end" sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
                              <Tooltip title="Open details">
                                <Button size="small" variant="text" sx={{ minWidth: 0, px: 1 }} onClick={() => navigate(`/kaizens/show/${row.id}`)}>View</Button>
                              </Tooltip>
                              {canEditCorrection ? (
                                <Tooltip title="Edit returned Kaizen and resubmit it">
                                  <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} sx={{ minWidth: 0, px: 1 }} onClick={() => navigate(`/kaizens/edit/${row.id}`)}>
                                    Edit
                                  </Button>
                                </Tooltip>
                              ) : null}
                              <Tooltip title={availability.reason}>
                                <span>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<RateReviewRoundedIcon />}
                                    disabled={!availability.enabled}
                                    onClick={() => openReview(row)}
                                    sx={{ minWidth: 0, px: 1.25 }}
                                  >
                                    {availability.enabled ? (isPeQaReviewer ? "Audit" : "Review") : "Locked"}
                                  </Button>
                                </span>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!query.isLoading && rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          {query.isError ? (
                            <EmptyState kind="error" title="Unable to load data" body="There was a problem loading the review queue" action={<Button variant="contained" onClick={() => query.refetch()}>Try again</Button>} />
                          ) : debouncedSearch ? (
                            <EmptyState kind="no-results" title="No results found" body="Try adjusting your search or filter" action={<Button variant="outlined" onClick={() => setSearch("")}>Clear search</Button>} />
                          ) : activeFilters.length > 0 ? (
                            <EmptyState kind="no-matches" title="No matching items" body="No ideas match the current filters" action={<Button variant="outlined" onClick={clearAllFilters}>Clear all filters</Button>} />
                          ) : (
                            <EmptyState kind="no-data" title={pageContent.emptyTitle} body={pageContent.emptyBody} />
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
              <TablePagination
                component="div"
                count={total}
                page={page}
                rowsPerPage={pageSize}
                rowsPerPageOptions={[10, 20, 50, 100]}
                onPageChange={(_, next) => setPage(next)}
                onRowsPerPageChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}
              />
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Dialog open={Boolean(selected)} onClose={closeReview} maxWidth="md" fullWidth>
        <DialogTitle>{pageContent.dialogTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">{selected?.kaizen_id} · {selected?.title}</Typography>
            {canManageReviewAttachments ? (
              <Box>
                <Typography variant="h3" sx={{ mb: 1 }}>Attachments ({reviewAttachments.length})</Typography>
                <Stack spacing={1.25}>
                  {attachmentsQuery.isLoading ? (
                    <Skeleton variant="rounded" height={72} />
                  ) : reviewAttachments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No attachments added.</Typography>
                  ) : reviewAttachments.map((attachment) => (
                    <Stack key={attachment.id} direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{attachmentFileName(attachment)}</Typography>
                        <Typography variant="caption" color="text.secondary">{attachment.attachment_type || "Document"} · {formatDate(attachment.uploaded_at)}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" startIcon={<DownloadRoundedIcon />} href={attachmentDownloadUrl(attachment)} target="_blank">Download</Button>
                        <Button size="small" color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} onClick={() => setAttachmentToDelete(attachment)}>Delete</Button>
                      </Stack>
                    </Stack>
                  ))}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                    <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />} disabled={isUploadingAttachments}>
                      Select files
                      <input hidden type="file" multiple onChange={(event) => setAttachmentFiles(Array.from(event.target.files ?? []))} />
                    </Button>
                    <Button variant="contained" onClick={uploadReviewAttachments} disabled={attachmentFiles.length === 0 || isUploadingAttachments} startIcon={isUploadingAttachments ? <CircularProgress size={16} color="inherit" /> : <UploadFileRoundedIcon />}>
                      Upload {attachmentFiles.length > 0 ? `(${attachmentFiles.length})` : ""}
                    </Button>
                    {attachmentFiles.length > 0 ? <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>{attachmentFiles.map((file) => file.name).join(", ")}</Typography> : null}
                  </Stack>
                </Stack>
              </Box>
            ) : null}
            <FormControl fullWidth>
              <InputLabel>Decision</InputLabel>
              <Select label="Decision" value={decision} onChange={(event) => setDecision(event.target.value)}>
                {decisionOptions.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
              </Select>
            </FormControl>
            {usesCalculatedImpactInputs ? (
              <FormControl fullWidth required>
                <InputLabel>Dependency</InputLabel>
                <Select label="Dependency" value={dependency} onChange={(event) => setDependency(event.target.value)}>
                  <MenuItem value="" disabled>
                    <em>Select dependency</em>
                  </MenuItem>
                  {DEPENDENCY_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            ) : null}
            {decision === "Rejected" && (
              <FormControl fullWidth required>
                <InputLabel>{isPeQaReviewer ? "Correction Category" : "Rejection Category"}</InputLabel>
                <Select label={isPeQaReviewer ? "Correction Category" : "Rejection Category"} value={rejectionCategory} onChange={(event) => setRejectionCategory(event.target.value)}>
                  {REJECTION_CATEGORIES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <TextField
              label={decision === "Rejected" ? (isPeQaReviewer ? "Correction Reason" : "Rejection Reason") : isPeQaReviewer ? "Audit Comments" : "Comments"}
              helperText={decision === "Rejected" ? `${comments.trim().length}/${REVIEW_REASON_MIN_LENGTH} minimum characters` : isPeQaReviewer ? "Required. Confirm audited benefits and closure notes" : "Required. Add context for the submitter and next approver"}
              value={comments}
              inputRef={commentsInputRef}
              onChange={(event) => updateComments(event.target.value)}
              onBlur={(event) => showReasonLimitPopup(event.target.value)}
              multiline
              rows={4}
              required
              fullWidth
            />
            {usesCalculatedImpactInputs ? (
              <Stack spacing={2}>
                <TextField
                  label="Benefit Type"
                  value={selectedBenefitType}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                {selectedBenefitType === "Productivity" ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <TextField
                      label="Impacted Volume"
                      type="text"
                      value={impactInputs.impacted_volume}
                      onChange={(event) => updateImpactInput("impacted_volume", wholeNumberInput(event.target.value))}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      fullWidth
                    />
                    <TextField
                      label="Time Saved (minutes)"
                      type="text"
                      value={impactInputs.time_saved}
                      onChange={(event) => updateImpactInput("time_saved", decimalInput(event.target.value))}
                      inputProps={{ inputMode: "decimal" }}
                      fullWidth
                    />
                    <TextField
                      label="FTE Saved"
                      value={calculatedFteSaving === null ? "" : formatFteSaving(calculatedFteSaving)}
                      InputProps={{ readOnly: true }}
                      helperText={benefitCalculationHelperText(selectedBenefitType, benefitCalculationConfigs)}
                      fullWidth
                    />
                  </Box>
                ) : null}
                {selectedBenefitType === "Quality" ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <TextField
                      label="Before Error Count"
                      type="text"
                      value={impactInputs.error_before}
                      onChange={(event) => updateImpactInput("error_before", wholeNumberInput(event.target.value))}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      fullWidth
                    />
                    <TextField
                      label="After Error Count"
                      type="text"
                      value={impactInputs.error_after}
                      onChange={(event) => updateImpactInput("error_after", wholeNumberInput(event.target.value))}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      fullWidth
                    />
                    <TextField
                      label="Rework Time (minutes)"
                      value={impactInputs.rework_time}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="Rework Reduction (%)"
                      value={calculatedReviewReworkReduced === null ? "" : formatFteSaving(calculatedReviewReworkReduced)}
                      InputProps={{ readOnly: true }}
                      fullWidth
                    />
                    <TextField
                      label="FTE Saved"
                      value={calculatedFteSaving === null ? "" : formatFteSaving(calculatedFteSaving)}
                      InputProps={{ readOnly: true }}
                      helperText={benefitCalculationHelperText(selectedBenefitType, benefitCalculationConfigs)}
                      fullWidth
                    />
                  </Box>
                ) : null}
                {selectedBenefitType === "Other" ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <TextField
                      label="Time Saved (minutes)"
                      type="text"
                      value={impactInputs.total_time_saved}
                      onChange={(event) => updateImpactInput("total_time_saved", decimalInput(event.target.value))}
                      inputProps={{ inputMode: "decimal" }}
                      fullWidth
                    />
                    <TextField
                      label="FTE Saved"
                      value={calculatedFteSaving === null ? "" : formatFteSaving(calculatedFteSaving)}
                      InputProps={{ readOnly: true }}
                      helperText={benefitCalculationHelperText(selectedBenefitType, benefitCalculationConfigs)}
                      fullWidth
                    />
                  </Box>
                ) : null}
                {selectedBenefitType === "TAT" ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                    <Tooltip title={<Box sx={{ whiteSpace: "pre-line" }}>{TAT_BEFORE_TOOLTIP}</Box>} arrow placement="top">
                      <TextField required label="TAT Before (minutes)" type="text" value={impactInputs.tat_before} onChange={(event) => updateImpactInput("tat_before", decimalInput(event.target.value))} inputProps={{ inputMode: "decimal" }} fullWidth />
                    </Tooltip>
                    <Tooltip title={<Box sx={{ whiteSpace: "pre-line" }}>{TAT_AFTER_TOOLTIP}</Box>} arrow placement="top">
                      <TextField required label="TAT After (minutes)" type="text" value={impactInputs.tat_after} onChange={(event) => updateImpactInput("tat_after", decimalInput(event.target.value))} inputProps={{ inputMode: "decimal" }} error={toNumber(impactInputs.tat_after) > toNumber(impactInputs.tat_before)} helperText={toNumber(impactInputs.tat_after) > toNumber(impactInputs.tat_before) ? "TAT After cannot exceed TAT Before." : undefined} fullWidth />
                    </Tooltip>
                    <TextField label="TAT Improvement (%)" value={formatFteSaving(calculateTatImpact(impactInputs).improvementPercent)} InputProps={{ readOnly: true }} helperText="((TAT Before - TAT After) / TAT Before) x 100" fullWidth />
                  </Box>
                ) : null}
                {selectedBenefitType === "Revenue Generation" ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: reviewerRole === "OM/SOM" ? "1fr 1fr" : "1fr" }, gap: 2 }}>
                    <TextField required label="Revenue Generated (USD)" type="text" value={impactInputs.revenue_generated_usd} onChange={(event) => updateImpactInput("revenue_generated_usd", decimalInput(event.target.value))} inputProps={{ inputMode: "decimal" }} helperText="Lead/Manager and OM/SOM may update this amount." fullWidth />
                    {reviewerRole === "OM/SOM" ? (
                      <TextField
                        label="FTE Saved"
                        value={calculatedFteSaving === null ? "" : formatFteSaving(calculatedFteSaving)}
                        InputProps={{ readOnly: true }}
                        helperText="Revenue Generated / FTE Cost"
                        fullWidth
                      />
                    ) : null}
                  </Box>
                ) : null}
                {reviewerRole === "OM/SOM" ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                    <TextField
                      label="FTE Cost (USD)"
                      type="number"
                      value={fteCostUsd}
                      onChange={(event) => setFteCostUsd(decimalInput(event.target.value))}
                      inputProps={{ min: 0.01, step: "0.01", inputMode: "decimal" }}
                      helperText={`Default configured by Super Admin: ${formatCurrency(defaultFteCostUsd)}`}
                      required
                      fullWidth
                    />
                    <TextField
                      label="Cost Saved"
                      value={calculatedCostSaved === null ? "" : formatCurrency(calculatedCostSaved)}
                      InputProps={{ readOnly: true }}
                      helperText="Calculated as FTE Saved x FTE Cost"
                      fullWidth
                    />
                  </Box>
                ) : null}
              </Stack>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Hours Saved"
                  type="number"
                  value={hoursSaved}
                  InputProps={{ readOnly: true }}
                  helperText="Read-only for QA audit"
                  fullWidth
                />
                <TextField
                  label="Rework Reduced %"
                  type="number"
                  value={reworkReduced}
                  InputProps={{ readOnly: true }}
                  helperText="Read-only for QA audit"
                  fullWidth
                />
              </Stack>
            )}
            {canNominateHighImpact ? (
              <Stack spacing={1}>
                <FormControlLabel
                  control={<Checkbox checked={highImpactNominate} onChange={(event) => setHighImpactNominate(event.target.checked)} />}
                  label="Nominate for High Impact Kaizen"
                />
                {highImpactNominate ? (
                  <TextField
                    label="High Impact Nomination Reason"
                    helperText="Required for Lead/Manager nomination"
                    value={highImpactReason}
                    onChange={(event) => setHighImpactReason(event.target.value)}
                    multiline
                    rows={3}
                    required
                    fullWidth
                  />
                ) : null}
              </Stack>
            ) : null}
            {canDecideHighImpact ? (
              <FormControl fullWidth>
                <InputLabel>High Impact Nomination</InputLabel>
                <Select label="High Impact Nomination" value={highImpactDecision} onChange={(event) => setHighImpactDecision(event.target.value)}>
                  <MenuItem value="">No decision</MenuItem>
                  {HIGH_IMPACT_REVIEW_OPTIONS.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                </Select>
              </FormControl>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeReview}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : <RateReviewRoundedIcon />}
            disabled={isReviewDisabled}
            onClick={submitReview}
          >
            {submitLabel}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(attachmentToDelete)} onClose={() => !isDeletingAttachment && setAttachmentToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this attachment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete “{attachmentToDelete ? attachmentFileName(attachmentToDelete) : "this attachment"}”? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setAttachmentToDelete(null)} disabled={isDeletingAttachment}>Cancel</Button>
          <Button color="error" variant="contained" onClick={deleteReviewAttachment} disabled={isDeletingAttachment} startIcon={isDeletingAttachment ? <CircularProgress size={16} color="inherit" /> : <DeleteRoundedIcon />}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
