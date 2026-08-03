import { useEffect, useMemo, useState } from "react";
import { useList, useNotification, useOne, type CrudFilters } from "@refinedev/core";
import { useNavigate, useParams } from "react-router";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { taruviDataProvider, taruviStorageProvider } from "../../providers/refineProviders";
import { executeFunction } from "../../utils/functionHelpers";
import { getStorageUrl } from "../../utils/storageHelpers";
import {
  AccessDenied,
  CategoryChip,
  EMPLOYEE_EDIT_RESUBMIT_STATUSES,
  KAIZEN_TITLE_LIMIT_MESSAGE,
  KAIZEN_TITLE_MAX_LENGTH,
  KaizenTitleText,
  StatusChip,
  canLeadEditKaizenCorrection,
  calculateTatImpact,
  employeeDepartment,
  employeeDisplayLabel,
  employeeFullName,
  formatFteSaving,
  getDepartmentLead,
  isKaizenTitleTooLong,
  kaizenReferenceLabel,
  normalizeKaizenTitle,
  normalizeKaizenCategory,
  relatedRecordId,
  useDebouncedValue,
  useKaizenRoles,
  type Client,
  type Department,
  type KaizenIdea,
  type PeopleEmployee,
} from "./shared";
import {
  CORE_KAIZEN_FORM_FIELDS,
  benefitCalculationHelperText,
  calculateConfiguredFteSaving,
  useDropdownOptions,
  useBenefitCalculationConfigs,
  useFormFieldConfigs,
  type CustomFieldValue,
  type FormFieldConfig,
} from "../settings/shared";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENT_BATCH_SIZE = 10;
const MASTER_DATA_PAGINATION = { currentPage: 1, pageSize: 100 };
const CLIENT_PROCESS_PAGINATION = { currentPage: 1, pageSize: 1000 };
const RELATED_IDEAS_PAGINATION = { currentPage: 1, pageSize: 3 };
const SUBMITTED_DUPLICATE_PAGINATION = { currentPage: 1, pageSize: 1000 };
const NAME_ASC_SORTERS = [{ field: "name", order: "asc" as const }];
const PROCESS_NAME_ASC_SORTERS = [{ field: "display_name", order: "asc" as const }];
const CREATED_DESC_SORTERS = [{ field: "created_at", order: "desc" as const }];
const ACTIVE_CLIENT_FILTERS: CrudFilters = [{ field: "status", operator: "eq", value: "Active" }];
const ACTIVE_PEOPLE_DEPARTMENT_FILTERS: CrudFilters = [{ field: "is_active", operator: "eq", value: true }];
const ACTIVE_PEOPLE_EMPLOYEE_FILTERS: CrudFilters = [{ field: "employment_status", operator: "eq", value: "active" }];
const DEFAULT_DEPARTMENT_NAME = "Managed Services";
const KAIZEN_LIST_ROUTE = "/kaizens";
const EXACT_DUPLICATE_IDEA_MESSAGE =
  "An idea with the same Title, Client, and Process has already been submitted.";
const EMPLOYEE_PAGINATION = { currentPage: 1, pageSize: 1000 };
const EMPLOYEE_NAME_ASC_SORTERS = [
  { field: "first_name", order: "asc" as const },
  { field: "last_name", order: "asc" as const },
];
const TAT_BEFORE_TOOLTIP = "Before Minutes = (Before Days × Working Hours Per Day × 60)\n+ (Before Hours × 60)\n+ Before Minutes";
const TAT_AFTER_TOOLTIP = "After Minutes = (After Days × Working Hours Per Day × 60)\n+ (After Hours × 60)\n+ After Minutes";
const PEOPLE_DEPARTMENT_META = { populate: ["lead_id"] };
const CURRENT_EMPLOYEE_META = { populate: ["department_id"] };
const MANAGER_EDGE_META = { populate: ["to_id"] };

type SubmitResponse = {
  success: boolean;
  error?: string;
  missing_fields?: string[];
  idea?: KaizenIdea;
};

type DuplicateMatch = {
  candidate_idea_id?: string | null;
  candidate_kaizen_id?: string | null;
  title?: string | null;
  status?: string | null;
  submitter?: string | null;
  similarity_percent?: number | string | null;
  classification?: string | null;
  matched_meaning?: string | null;
  scoring_method?: string | null;
  similarity_breakdown?: Record<string, number | string | null> | null;
  matched_fields?: string[] | null;
  requires_justification?: boolean | null;
  requires_reviewer_resolution?: boolean | null;
};

type DuplicateDetectionResponse = {
  success: boolean;
  error?: string;
  matches?: DuplicateMatch[];
  created_count?: number;
  embedding_enabled?: boolean;
  scoring_method?: string;
};

type SubmittedDuplicateCriteria = {
  title: string;
  clientId: string;
  processName: string;
  excludeId?: string | null;
};

type AuditAppendResponse = {
  success: boolean;
  error?: string;
};

type TeamContributionInput = {
  member_username?: string;
  member_email?: string;
  member_name?: string;
  contribution_role?: string;
  contribution_percent?: number;
  description?: string;
};

type ProjectMemberOption = {
  key: string;
  label: string;
  line: string;
};

type ProcessRow = {
  id: string;
  name?: string | null;
  display_name?: string | null;
  process_name?: string | null;
  department_id?: string | null;
  client_id?: string | null;
  status?: string | null;
};

type AttachmentRow = {
  id: string;
  bucket?: string | null;
  path?: string | null;
  file_name?: string | null;
  file_size?: number | string | null;
  attachment_type?: string | null;
  uploaded_at?: string | null;
};

type EmployeeManagerEdge = {
  id: string;
  from_id?: string | PeopleEmployee | null;
  to_id?: string | PeopleEmployee | null;
  type?: string | null;
  metadata?: Record<string, unknown> | null;
};

const getProcessLabel = (process?: ProcessRow | null) => {
  const label = process?.display_name ?? process?.name ?? process?.process_name;
  return typeof label === "string" ? label.trim() : label ? String(label).trim() : "";
};

const duplicateComparableText = (value?: string | null) =>
  normalizeKaizenTitle(value).replace(/\s+/g, " ").toLowerCase();

const normalizeDuplicateField = (value: unknown) => String(value ?? "").trim();

const buildSubmittedDuplicateCriteria = (
  payload: Partial<KaizenIdea>,
  excludeId?: string | null,
): SubmittedDuplicateCriteria | null => {
  const title = normalizeKaizenTitle(payload.title);
  const clientId = normalizeDuplicateField(payload.client_id);
  const processName = normalizeDuplicateField(payload.process_name);

  if (!title || !clientId || !processName) return null;

  return { title, clientId, processName, excludeId };
};

const submittedDuplicateFilters = (criteria: SubmittedDuplicateCriteria): CrudFilters => {
  const filters: CrudFilters = [
    { field: "client_id", operator: "eq", value: criteria.clientId } as unknown as CrudFilters[number],
  ];

  if (criteria.excludeId) {
    filters.push({ field: "id", operator: "ne", value: criteria.excludeId });
  }

  return filters;
};

const isSubmittedIdeaRecord = (idea: KaizenIdea) => {
  const status = String(idea.status ?? "").trim();
  const normalizedStatus = status.toLowerCase();
  if (normalizedStatus === "draft" || normalizedStatus === "withdrawn") return false;

  return Boolean(
    String(idea.kaizen_id ?? "").trim() ||
      String(idea.submitted_at ?? "").trim() ||
      status,
  );
};

const findSubmittedDuplicateIdea = (ideas: KaizenIdea[], criteria: SubmittedDuplicateCriteria | null) => {
  if (!criteria) return null;
  const targetTitle = duplicateComparableText(criteria.title);
  const targetProcess = duplicateComparableText(criteria.processName);
  return (
    ideas.find((idea) => {
      const hasSameClient = Boolean(criteria.clientId && normalizeDuplicateField(idea.client_id) === criteria.clientId);
      const hasSameProcess = Boolean(targetProcess && duplicateComparableText(idea.process_name) === targetProcess);
      return (
        idea.id !== criteria.excludeId &&
        isSubmittedIdeaRecord(idea) &&
        duplicateComparableText(idea.title) === targetTitle &&
        hasSameClient &&
        hasSameProcess
      );
    }) ?? null
  );
};

const firstRecord = <T,>(data: T | T[] | undefined | null) => (Array.isArray(data) ? data[0] : data);

const nullableNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const WHOLE_NUMBER_INPUT_PROPS = {
  inputMode: "numeric",
  pattern: "[0-9]*",
} as const;

const fileSelectionKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const attachmentFileName = (attachment: AttachmentRow) =>
  attachment.file_name || attachment.path?.split("/").pop() || "Attachment";

const attachmentDownloadUrl = (attachment: AttachmentRow) =>
  getStorageUrl(attachment.bucket || "kaizen-attachments", attachment.path);

const SUBMIT_REQUIRED_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  problem_statement: "Problem Statement",
  proposed_solution: "Proposed Solution",
  expected_benefit: "Expected Benefit",
  category: "Category",
  effort_type: "Effort Type",
  dependency: "Dependency",
  department_id: "Department",
  client_id: "Client",
  process_name: "Process",
};

const SUBMIT_REQUIRED_FIELDS = Object.keys(SUBMIT_REQUIRED_FIELD_LABELS);

const fieldLabelFromKey = (field: string) =>
  SUBMIT_REQUIRED_FIELD_LABELS[field] ??
  field
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const requiredFieldSummary = (fields: string[]) => Array.from(new Set(fields)).join(", ");

const missingSubmitFieldLabels = (payload: Record<string, unknown>) =>
  SUBMIT_REQUIRED_FIELDS
    .filter((field) => !String(payload[field] ?? "").trim())
    .map(fieldLabelFromKey);

const responseMissingFieldLabels = (fields?: string[]) =>
  (fields ?? []).map(fieldLabelFromKey).filter(Boolean);

const stringAttr = (attributes: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = attributes[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

const normalizeDepartmentName = (value: unknown) => String(value ?? "").trim().toLowerCase();

const relatedEmployee = (value: unknown) =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? (value as PeopleEmployee) : null;

const employeeUsername = (employee?: PeopleEmployee | null) => {
  const username = stringAttr(employee?.metadata ?? {}, "username", "user_username", "account_username");
  if (username) return username;
  const email = String(employee?.email ?? "").trim();
  return email.endsWith("@eoxvantage.com") ? email.slice(0, -("@eoxvantage.com".length)) : "";
};

const projectMemberLinesFromText = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const projectMemberLineKey = (line: string) => String(line.split("|")[0] ?? "").trim().toLowerCase();

const projectMemberEmployeeKey = (employee?: PeopleEmployee | null) =>
  String(employee?.email || employee?.employee_number || employee?.id || "").trim().toLowerCase();

const projectMemberLabelFromLine = (line: string) => {
  const [identityValue = "", nameOrEmail = "", role = ""] = line.split("|").map((part) => part.trim());
  const primary = nameOrEmail || identityValue;
  return role ? `${primary} - ${role}` : primary;
};

const projectMemberOptionFromLine = (line: string): ProjectMemberOption => ({
  key: projectMemberLineKey(line),
  label: projectMemberLabelFromLine(line),
  line,
});

const projectMemberOptionFromEmployee = (employee: PeopleEmployee, effortType?: string | null): ProjectMemberOption => {
  const identityValue = String(employee.email || employee.employee_number || employee.id).trim();
  const memberName = employeeFullName(employee) || employee.email || employee.employee_number || employee.id;
  const contributionRole = effortType === "Team" ? "Project Member" : "Project Lead";
  return {
    key: projectMemberEmployeeKey(employee),
    label: employeeDisplayLabel(employee),
    line: `${identityValue} | ${memberName} | ${contributionRole}`,
  };
};

const initialValues: Partial<KaizenIdea> = {
  title: "",
  problem_statement: "",
  proposed_solution: "",
  expected_benefit: "",
  category: "",
  effort_type: "",
  dependency: "",
  process_name: "",
  project_members: [],
  similar_warning_acknowledged: false,
};

const DEPENDENCY_OPTIONS = ["No", "Client", "Other Department"] as const;

export const KaizenCreate = () => <KaizenForm mode="create" />;
export const KaizenEdit = () => <KaizenForm mode="edit" />;

const KaizenForm = ({ mode }: { mode: "create" | "edit" }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { open } = useNotification();
  const roles = useKaizenRoles();
  const { identity } = roles;
  const redirectToList = () => navigate(KAIZEN_LIST_ROUTE, { replace: true });
  const [values, setValues] = useState<Partial<KaizenIdea>>(initialValues);
  const [teamMembersText, setTeamMembersText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [duplicateScoringMethod, setDuplicateScoringMethod] = useState("");
  const [duplicateJustification, setDuplicateJustification] = useState("");
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  const { result: existing, query: existingQuery } = useOne<KaizenIdea>({
    resource: "kaizen_ideas",
    id: id ?? "",
    queryOptions: { enabled: mode === "edit" && Boolean(id) },
  });

  const { result: peopleDepartmentsResult, query: departmentsQuery } = useList<Department>({
    resource: "departments",
    filters: ACTIVE_PEOPLE_DEPARTMENT_FILTERS,
    sorters: NAME_ASC_SORTERS,
    pagination: MASTER_DATA_PAGINATION,
    meta: PEOPLE_DEPARTMENT_META,
  });
  const { result: kaizenDepartmentsResult } = useList<Department>({
    resource: "kaizen_departments",
    sorters: NAME_ASC_SORTERS,
    pagination: MASTER_DATA_PAGINATION,
  });
  const { result: employeesResult, query: employeesQuery } = useList<PeopleEmployee>({
    resource: "employees",
    filters: ACTIVE_PEOPLE_EMPLOYEE_FILTERS,
    sorters: EMPLOYEE_NAME_ASC_SORTERS,
    pagination: EMPLOYEE_PAGINATION,
  });
  const { result: clientsResult, query: clientsQuery } = useList<Client>({
    resource: "kaizen_clients",
    filters: ACTIVE_CLIENT_FILTERS,
    sorters: NAME_ASC_SORTERS,
    pagination: CLIENT_PROCESS_PAGINATION,
  });
  const departments = peopleDepartmentsResult.data ?? [];
  const kaizenDepartments = kaizenDepartmentsResult.data ?? [];
  const defaultPeopleDepartment = departments.find(
    (department) => normalizeDepartmentName(department.name) === normalizeDepartmentName(DEFAULT_DEPARTMENT_NAME),
  );
  const defaultKaizenDepartment = kaizenDepartments.find(
    (department) => normalizeDepartmentName(department.name) === normalizeDepartmentName(DEFAULT_DEPARTMENT_NAME),
  );
  const selectedDepartmentValue = String(values.department_id ?? "");
  const selectedDepartment =
    departments.find((department) => department.id === selectedDepartmentValue) ||
    departments.find((department) => normalizeDepartmentName(department.name) === normalizeDepartmentName(values.department_name));
  const selectedDepartmentName = selectedDepartment?.name || String(values.department_name ?? "");
  const selectedKaizenDepartment =
    kaizenDepartments.find((department) => department.id === selectedDepartmentValue) ||
    (selectedDepartmentName
      ? kaizenDepartments.find((department) => normalizeDepartmentName(department.name) === normalizeDepartmentName(selectedDepartmentName))
      : undefined);
  const selectedKaizenDepartmentId = selectedKaizenDepartment?.id ?? "";

  const processFilters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [{ field: "status", operator: "eq", value: "Active" }];
    if (values.client_id) next.push({ field: "client_id", operator: "eq", value: values.client_id });
    return next;
  }, [values.client_id]);

  const processQueryOptions = useMemo(
    () => ({ enabled: Boolean(values.client_id) }),
    [values.client_id],
  );

  const { result: processesResult, query: processesQuery } = useList<ProcessRow>({
    resource: "kaizen_processes",
    filters: processFilters,
    sorters: PROCESS_NAME_ASC_SORTERS,
    pagination: CLIENT_PROCESS_PAGINATION,
    queryOptions: processQueryOptions,
  });
  const { options: categoryOptions } = useDropdownOptions("category");
  const { options: effortTypeOptions } = useDropdownOptions("effort_type");
  const { configs: benefitCalculationConfigs } = useBenefitCalculationConfigs();
  const { customFields } = useFormFieldConfigs();
  const customValueFilters = useMemo<CrudFilters>(
    () => (id ? [{ field: "idea_id", operator: "eq", value: id }] : []),
    [id],
  );
  const customValueQueryOptions = useMemo(
    () => ({ enabled: mode === "edit" && Boolean(id) }),
    [id, mode],
  );
  const { result: customValuesResult, query: customValuesQuery } = useList<CustomFieldValue>({
    resource: "kaizen_custom_field_values",
    filters: customValueFilters,
    sorters: [{ field: "field_key", order: "asc" }],
    pagination: MASTER_DATA_PAGINATION,
    queryOptions: customValueQueryOptions,
  });
  const { result: existingAttachmentsResult } = useList<AttachmentRow>({
    resource: "kaizen_attachments",
    filters: customValueFilters,
    sorters: [{ field: "uploaded_at", order: "desc" }],
    pagination: { currentPage: 1, pageSize: 50 },
    queryOptions: customValueQueryOptions,
  });
  const currentEmployeeFilters = useMemo<CrudFilters>(() => {
    const identityId = String(identity?.id ?? "").trim();
    const identityEmail = String(identity?.email ?? "").trim();
    if (identityId && identityEmail) {
      return [
        {
          field: "filters",
          operator: "eq",
          value: JSON.stringify({ or: [{ user_id__eq: identityId }, { email__eq: identityEmail }] }),
        },
      ];
    }
    if (identityId) return [{ field: "user_id", operator: "eq", value: identityId }];
    if (identityEmail) return [{ field: "email", operator: "eq", value: identityEmail }];
    return [];
  }, [identity?.email, identity?.id]);
  const currentEmployeeQueryOptions = useMemo(
    () => ({ enabled: mode === "create" && currentEmployeeFilters.length > 0 }),
    [currentEmployeeFilters.length, mode],
  );
  const { result: currentEmployeeResult } = useList<PeopleEmployee>({
    resource: "employees",
    filters: currentEmployeeFilters,
    pagination: { currentPage: 1, pageSize: 1 },
    meta: CURRENT_EMPLOYEE_META,
    queryOptions: currentEmployeeQueryOptions,
  });
  const currentEmployee = currentEmployeeResult.data?.[0] ?? null;
  const currentEmployeeDepartment = employeeDepartment(currentEmployee);
  const currentEmployeeName = employeeFullName(currentEmployee);
  const currentEmployeeManagerFilters = useMemo<CrudFilters>(
    () =>
      currentEmployee?.id
        ? [
            { field: "from_id", operator: "eq", value: currentEmployee.id },
            { field: "type", operator: "eq", value: "manager" },
          ]
        : [{ field: "id", operator: "eq", value: "__no_manager__" }],
    [currentEmployee?.id],
  );
  const currentEmployeeManagerQueryOptions = useMemo(
    () => ({ enabled: mode === "create" && Boolean(currentEmployee?.id) }),
    [currentEmployee?.id, mode],
  );
  const { result: currentEmployeeManagerEdgesResult } = useList<EmployeeManagerEdge>({
    resource: "employees_edges",
    filters: currentEmployeeManagerFilters,
    pagination: { currentPage: 1, pageSize: 1 },
    meta: MANAGER_EDGE_META,
    queryOptions: currentEmployeeManagerQueryOptions,
  });
  const currentEmployeeManager = relatedEmployee(currentEmployeeManagerEdgesResult.data?.[0]?.to_id);
  const currentEmployeeManagerUsername = employeeUsername(currentEmployeeManager);
  const currentEmployeeManagerEmail = currentEmployeeManager?.email ?? "";
  const currentEmployeeManagerName = employeeFullName(currentEmployeeManager) || currentEmployeeManagerUsername;
  const identityAttributes = identity?.attributes ?? {};
  const submitterManagerUsername = stringAttr(identityAttributes, "manager_username", "reporting_manager_username");
  const submitterManagerEmail = stringAttr(identityAttributes, "manager_email", "reporting_manager_email");
  const resolvedManagerUsername = submitterManagerUsername || currentEmployeeManagerUsername;
  const resolvedManagerEmail = submitterManagerEmail || currentEmployeeManagerEmail;
  const resolvedManagerName =
    stringAttr(identityAttributes, "manager_name", "reporting_manager_name") ||
    currentEmployeeManagerName ||
    resolvedManagerUsername;
  const isLeadCorrectionEditor =
    mode === "edit" &&
    roles.isManager &&
    !roles.isAdmin &&
    !roles.isOmSomRole &&
    !roles.isPeQaRole &&
    canLeadEditKaizenCorrection(existing, identity?.username);
  const isEmployeeOwnedEdit =
    mode === "edit" &&
    roles.canSubmitKaizen &&
    Boolean(existing?.submitted_by_username && existing.submitted_by_username === identity?.username);
  const canEmployeeEditExisting =
    isEmployeeOwnedEdit &&
    Boolean(existing?.is_draft || EMPLOYEE_EDIT_RESUBMIT_STATUSES.includes(existing?.status as (typeof EMPLOYEE_EDIT_RESUBMIT_STATUSES)[number]));
  const canUseForm = mode === "create" ? roles.canSubmitKaizen : canEmployeeEditExisting || isLeadCorrectionEditor;
  const canSaveDraft = roles.canSubmitKaizen;
  const isEmployeeResubmission = canEmployeeEditExisting && !existing?.is_draft;

  useEffect(() => {
    if (mode === "edit" && existing) {
      setValues({
        ...existing,
        category: existing.category ?? "",
        effort_type: existing.effort_type ?? "",
      });
      setTeamMembersText((existing.project_members ?? []).join("\n"));
    }
  }, [existing, mode]);

  useEffect(() => {
    if (mode !== "edit") return;
    const next: Record<string, string> = {};
    (customValuesResult.data ?? []).forEach((row) => {
      const key = String(row.field_key ?? "").trim();
      if (key) next[key] = String(row.value ?? "");
    });
    setCustomFieldValues(next);
  }, [customValuesResult.data, mode]);

  useEffect(() => {
    if (mode === "create" && identity) {
      const attrs = identity.attributes ?? {};
      const defaultDepartmentName = currentEmployeeDepartment?.name || String(attrs.department_name ?? "");
      const defaultDepartmentCode = currentEmployeeDepartment?.code || String(attrs.department_code ?? "");
      setValues((current) => ({
        ...current,
        submitted_by_username: current.submitted_by_username || identity.username,
        submitted_by_email: current.submitted_by_email || currentEmployee?.email || identity.email,
        submitted_by_name:
          current.submitted_by_name ||
          currentEmployeeName ||
          `${identity.first_name ?? ""} ${identity.last_name ?? ""}`.trim() ||
          identity.username,
        department_code: current.department_code || defaultDepartmentCode || undefined,
        department_name: current.department_name || defaultDepartmentName || undefined,
        reporting_manager_username: current.reporting_manager_username || resolvedManagerUsername,
        reporting_manager_email: current.reporting_manager_email || resolvedManagerEmail,
        team_lead_username: current.team_lead_username || resolvedManagerUsername,
        team_lead_email: current.team_lead_email || resolvedManagerEmail,
        team_lead_name: current.team_lead_name || resolvedManagerName,
        process_name: current.process_name || String(attrs.process_name ?? ""),
      }));
    }
  }, [
    currentEmployee?.email,
    currentEmployeeDepartment?.code,
    currentEmployeeDepartment?.name,
    currentEmployeeName,
    identity,
    mode,
    resolvedManagerEmail,
    resolvedManagerName,
    resolvedManagerUsername,
  ]);

  const relatedQueryText = useDebouncedValue(
    [values.title, values.problem_statement].filter(Boolean).join(" ").trim(),
    450,
  );
  const canSearchRelatedIdeas = relatedQueryText.trim().length > 8;

  const relatedFilters = useMemo<CrudFilters>(() => {
    const next: CrudFilters = [];
    if (!canSearchRelatedIdeas) return next;
    next.push({ field: "search", operator: "eq" as const, value: relatedQueryText.trim() });
    if (selectedKaizenDepartmentId) next.push({ field: "department_id", operator: "eq" as const, value: selectedKaizenDepartmentId });
    if (values.process_name) next.push({ field: "process_name", operator: "contains" as const, value: values.process_name });
    if (id) next.push({ field: "id", operator: "ne" as const, value: id });
    return next;
  }, [canSearchRelatedIdeas, id, relatedQueryText, selectedKaizenDepartmentId, values.process_name]);

  const relatedQueryOptions = useMemo(
    () => ({ enabled: canSearchRelatedIdeas }),
    [canSearchRelatedIdeas],
  );

  const { result: relatedResult } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: relatedFilters,
    sorters: CREATED_DESC_SORTERS,
    pagination: RELATED_IDEAS_PAGINATION,
    queryOptions: relatedQueryOptions,
  });

  const relatedIdeas = canSearchRelatedIdeas ? relatedResult.data ?? [] : [];
  const employees = employeesResult.data ?? [];
  const clients = clientsResult.data ?? [];
  const processes = processesResult.data ?? [];
  const existingAttachments = existingAttachmentsResult.data ?? [];
  const projectMemberLines = useMemo(() => projectMemberLinesFromText(teamMembersText), [teamMembersText]);
  const employeeProjectMemberOptions = useMemo(
    () =>
      employees
        .map((employee) => projectMemberOptionFromEmployee(employee, values.effort_type))
        .filter((option) => option.key),
    [employees, values.effort_type],
  );
  const employeeProjectMemberKeys = useMemo(
    () => new Set(employeeProjectMemberOptions.map((option) => option.key)),
    [employeeProjectMemberOptions],
  );
  const existingProjectMemberOptions = useMemo(
    () =>
      projectMemberLines
        .filter((line) => {
          const key = projectMemberLineKey(line);
          return key && !employeeProjectMemberKeys.has(key);
        })
        .map(projectMemberOptionFromLine),
    [employeeProjectMemberKeys, projectMemberLines],
  );
  const projectMemberOptions = useMemo(
    () => [...existingProjectMemberOptions, ...employeeProjectMemberOptions],
    [employeeProjectMemberOptions, existingProjectMemberOptions],
  );
  const projectMemberOptionByKey = useMemo(
    () => new Map(projectMemberOptions.map((option) => [option.key, option])),
    [projectMemberOptions],
  );
  const selectedProjectMemberOptions = useMemo(
    () =>
      projectMemberLines
        .map((line) => {
          const key = projectMemberLineKey(line);
          const option = projectMemberOptionByKey.get(key);
          return option ? { ...option, line } : projectMemberOptionFromLine(line);
        })
        .filter((option) => option.key),
    [projectMemberLines, projectMemberOptionByKey],
  );
  const selectedDepartmentLead = getDepartmentLead(selectedDepartment);
  const selectedDepartmentManagerUsername = employeeUsername(selectedDepartmentLead) || selectedDepartment?.manager_username || "";
  const selectedDepartmentManagerEmail = selectedDepartmentLead?.email || selectedDepartment?.manager_email || "";
  const selectedDepartmentManagerName = employeeFullName(selectedDepartmentLead) || selectedDepartmentManagerUsername;
  const currentEmployeeDepartmentId = relatedRecordId(currentEmployee?.department_id);
  const currentEmployeeDepartmentName = String(currentEmployeeDepartment?.name ?? "").trim().toLowerCase();
  const currentEmployeePeopleDepartment =
    (currentEmployeeDepartmentId ? departments.find((department) => department.id === currentEmployeeDepartmentId) : undefined) ||
    (currentEmployeeDepartmentName
      ? departments.find((department) => normalizeDepartmentName(department.name) === currentEmployeeDepartmentName)
      : undefined) ||
    currentEmployeeDepartment;
  const createDefaultDepartment = defaultPeopleDepartment ?? currentEmployeePeopleDepartment;
  const createDefaultKaizenDepartment =
    defaultKaizenDepartment ||
    (createDefaultDepartment
      ? kaizenDepartments.find(
          (department) => normalizeDepartmentName(department.name) === normalizeDepartmentName(createDefaultDepartment.name),
        )
      : undefined);
  const selectedClient = clients.find((client) => client.id === values.client_id);
  const selectedProcess = processes.find((process) => process.id === values.process_id);
  const selectedProcessLabel = getProcessLabel(selectedProcess) || String(values.process_name ?? "");
  const exactDuplicateTitle = useDebouncedValue(normalizeKaizenTitle(values.title), 350);
  const exactDuplicateCriteria = useMemo(
    () =>
      buildSubmittedDuplicateCriteria(
        {
          title: exactDuplicateTitle,
          client_id: values.client_id,
          process_name: selectedProcessLabel,
        },
        id,
      ),
    [exactDuplicateTitle, id, selectedProcessLabel, values.client_id],
  );
  const exactDuplicateFilters = useMemo<CrudFilters>(
    () => (exactDuplicateCriteria ? submittedDuplicateFilters(exactDuplicateCriteria) : []),
    [exactDuplicateCriteria],
  );
  const exactDuplicateQueryOptions = useMemo(
    () => ({ enabled: Boolean(exactDuplicateCriteria) }),
    [exactDuplicateCriteria],
  );
  const { result: exactDuplicateResult } = useList<KaizenIdea>({
    resource: "kaizen_ideas",
    filters: exactDuplicateFilters,
    sorters: CREATED_DESC_SORTERS,
    pagination: SUBMITTED_DUPLICATE_PAGINATION,
    queryOptions: exactDuplicateQueryOptions,
  });
  const exactSubmittedDuplicate = useMemo(
    () => findSubmittedDuplicateIdea(exactDuplicateResult.data ?? [], exactDuplicateCriteria),
    [exactDuplicateCriteria, exactDuplicateResult.data],
  );
  const actionableDuplicateMatches = useMemo(
    () => duplicateMatches.filter((match) => Boolean(match.requires_justification) || Number(match.similarity_percent ?? 0) >= 70),
    [duplicateMatches],
  );
  const visibleRelatedIdeas = useMemo(() => {
    const semanticCandidateIds = new Set(duplicateMatches.map((match) => match.candidate_idea_id).filter(Boolean));
    return relatedIdeas.filter((idea) => !semanticCandidateIds.has(idea.id));
  }, [duplicateMatches, relatedIdeas]);
  const categoryValues = categoryOptions.map((option) => option.value);
  const hasSelectedCategory = categoryValues.includes(values.category ?? "");
  const selectedCategory = hasSelectedCategory ? normalizeKaizenCategory(values.category) : undefined;
  const isProductivityCategory = selectedCategory === "Productivity";
  const isQualityCategory = selectedCategory === "Quality";
  const isOtherCategory = selectedCategory === "Other";
  const isTatCategory = selectedCategory === "TAT";
  const isRevenueCategory = selectedCategory === "Revenue Generation";
  const calculatedTatImpact = useMemo(
    () => calculateTatImpact(values),
    [values.monthly_transaction_volume, values.tat_after, values.tat_before],
  );
  const calculatedFteSaving = useMemo(
    () => (selectedCategory ? calculateConfiguredFteSaving({ ...values, category: selectedCategory }, benefitCalculationConfigs) : 0),
    [
      benefitCalculationConfigs,
      selectedCategory,
      values.error_after,
      values.error_before,
      values.impacted_volume,
      values.rework_time,
      values.time_saved,
      values.total_time_saved,
      values.monthly_transaction_volume,
      values.tat_after,
      values.tat_before,
    ],
  );

  useEffect(() => {
    if (mode !== "create" || !createDefaultDepartment) return;
    setValues((current) => {
      if (current.department_id) return current;
      return {
        ...current,
        department_id: createDefaultDepartment.id,
        department_code: createDefaultKaizenDepartment?.code ?? createDefaultDepartment.code ?? current.department_code,
        department_name: createDefaultDepartment.name,
      };
    });
  }, [
    createDefaultDepartment?.code,
    createDefaultDepartment?.id,
    createDefaultDepartment?.name,
    createDefaultKaizenDepartment?.code,
    mode,
  ]);

  useEffect(() => {
    if (mode !== "create" || !selectedDepartment) return;
    setValues((current) => {
      const next = {
        reporting_manager_username:
          current.reporting_manager_username || resolvedManagerUsername || selectedDepartmentManagerUsername,
        reporting_manager_email:
          current.reporting_manager_email || resolvedManagerEmail || selectedDepartmentManagerEmail,
        team_lead_username:
          current.team_lead_username || resolvedManagerUsername || selectedDepartmentManagerUsername,
        team_lead_email:
          current.team_lead_email || resolvedManagerEmail || selectedDepartmentManagerEmail,
        team_lead_name:
          current.team_lead_name || resolvedManagerName || selectedDepartmentManagerName,
      };

      if (
        current.reporting_manager_username === next.reporting_manager_username &&
        current.reporting_manager_email === next.reporting_manager_email &&
        current.team_lead_username === next.team_lead_username &&
        current.team_lead_email === next.team_lead_email &&
        current.team_lead_name === next.team_lead_name
      ) {
        return current;
      }

      return { ...current, ...next };
    });
  }, [
    mode,
    resolvedManagerEmail,
    resolvedManagerName,
    resolvedManagerUsername,
    selectedDepartment,
    selectedDepartmentManagerEmail,
    selectedDepartmentManagerName,
    selectedDepartmentManagerUsername,
  ]);

  useEffect(() => {
    const shouldCheck = canSearchRelatedIdeas;
    if (!shouldCheck) {
      setDuplicateMatches([]);
      setDuplicateScoringMethod("");
      setIsCheckingDuplicates(false);
      return;
    }

    let cancelled = false;
    setIsCheckingDuplicates(true);
    executeFunction<DuplicateDetectionResponse>("kaizen-duplicate-detection", {
      action: "detect",
      persist: false,
      idea_id: id,
      display_threshold: 40,
      values: {
        id,
        title: values.title,
        problem_statement: values.problem_statement,
        proposed_solution: values.proposed_solution,
        expected_benefit: values.expected_benefit,
        department_id: selectedKaizenDepartmentId,
        client_id: values.client_id,
        process_name: values.process_name,
        category: values.category,
      },
    })
      .then((response) => {
        if (!cancelled) {
          setDuplicateMatches(response.matches ?? []);
          setDuplicateScoringMethod(response.scoring_method ?? "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateMatches([]);
          setDuplicateScoringMethod("");
        }
      })
      .finally(() => {
        if (!cancelled) setIsCheckingDuplicates(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canSearchRelatedIdeas, id, relatedQueryText, selectedKaizenDepartmentId, values.category, values.client_id, values.expected_benefit, values.problem_statement, values.process_name, values.proposed_solution, values.title]);

  const updateValue = (field: keyof KaizenIdea, value: unknown) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const updateCustomValue = (fieldKey: string, value: string) => {
    setCustomFieldValues((current) => ({ ...current, [fieldKey]: value }));
  };

  const addSelectedFiles = (selectedFiles: FileList | null) => {
    const nextFiles = Array.from(selectedFiles ?? []);
    if (nextFiles.length === 0) return;

    setFiles((current) => {
      const seen = new Set(current.map(fileSelectionKey));
      const merged = [...current];
      nextFiles.forEach((file) => {
        const key = fileSelectionKey(file);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(file);
        }
      });
      return merged;
    });
  };

  const validateSelections = () => {
    const missingFields = [
      values.category ? null : "Category",
      values.effort_type ? null : "Effort Type",
    ].filter((field): field is string => Boolean(field));

    if (missingFields.length === 0) return true;

    const fieldSummary = requiredFieldSummary(missingFields);
    open?.({
      type: "error",
      message: `Missing required ${missingFields.length === 1 ? "field" : "fields"}: ${fieldSummary}`,
      description: `${fieldSummary} ${missingFields.length === 1 ? "is" : "are"} required before saving.`,
    });
    return false;
  };

  const validateCustomFields = () => {
    const missingFields = customFields
      .filter((field) => field.is_required)
      .map((field) => ({
        key: String(field.field_key ?? "").trim(),
        label: String(field.label || field.field_key || "Custom field"),
      }))
      .filter((field) => field.key && !String(customFieldValues[field.key] ?? "").trim());

    if (missingFields.length === 0) return true;

    const fieldSummary = requiredFieldSummary(missingFields.map((field) => field.label));
    open?.({
      type: "error",
      message: `Missing custom ${missingFields.length === 1 ? "field" : "fields"}: ${fieldSummary}`,
      description: `${fieldSummary} ${missingFields.length === 1 ? "is" : "are"} required before saving.`,
    });
    return false;
  };

  const notifyMissingSubmitFields = (fieldLabels: string[]) => {
    const fieldSummary = requiredFieldSummary(fieldLabels);
    open?.({
      type: "error",
      message: `Missing mandatory ${fieldLabels.length === 1 ? "field" : "fields"}`,
      description: `Missing: ${fieldSummary}`,
    });
  };

  const validateSubmitPayload = (payload: Partial<KaizenIdea>) => {
    const missingFields = missingSubmitFieldLabels(payload as Record<string, unknown>);
    if (payload.category === "TAT") {
      if (payload.tat_before === null || payload.tat_before === undefined || payload.tat_before === "") missingFields.push("TAT Before");
      if (payload.tat_after === null || payload.tat_after === undefined || payload.tat_after === "") missingFields.push("TAT After");
      if (Number(payload.tat_before) <= 0) {
        open?.({ type: "error", message: "Invalid TAT Before", description: "TAT Before must be greater than zero." });
        return false;
      }
      if (Number(payload.tat_after) > Number(payload.tat_before)) {
        open?.({ type: "error", message: "Invalid TAT values", description: "TAT After cannot be greater than TAT Before." });
        return false;
      }
    }
    if (payload.category === "Revenue Generation" && Number(payload.revenue_generated_usd) <= 0) {
      open?.({ type: "error", message: "Revenue amount required", description: "Enter a Revenue Generated (USD) amount greater than zero." });
      return false;
    }
    if (missingFields.length === 0) return true;

    notifyMissingSubmitFields(missingFields);
    return false;
  };

  const notifySubmittedDuplicate = (duplicate?: KaizenIdea | null) => {
    const reference = duplicate ? ` Existing idea: ${kaizenReferenceLabel(duplicate)}.` : "";
    open?.({
      type: "error",
      message: "Duplicate idea detected",
      description: `${EXACT_DUPLICATE_IDEA_MESSAGE}${reference}`,
    });
  };

  const findSubmittedDuplicateFromServer = async (payload: Partial<KaizenIdea>) => {
    const criteria = buildSubmittedDuplicateCriteria(payload, id);
    if (!criteria) return null;

    const response = await taruviDataProvider.getList({
      resource: "kaizen_ideas",
      filters: submittedDuplicateFilters(criteria),
      sorters: CREATED_DESC_SORTERS,
      pagination: SUBMITTED_DUPLICATE_PAGINATION,
      meta: { select: ["id", "kaizen_id", "title", "client_id", "process_name", "status", "submitted_at"] },
    });

    return findSubmittedDuplicateIdea((response.data ?? []) as KaizenIdea[], criteria);
  };

  const validateNoSubmittedDuplicate = async (payload: Partial<KaizenIdea>) => {
    try {
      const duplicate = await findSubmittedDuplicateFromServer(payload);
      if (!duplicate) return true;

      notifySubmittedDuplicate(duplicate);
      return false;
    } catch (error) {
      open?.({
        type: "error",
        message: "Unable to verify duplicate idea",
        description: error instanceof Error ? error.message : "Please try again.",
      });
      return false;
    }
  };

  const validateTitleLimit = () => {
    if (!isKaizenTitleTooLong(values.title)) return true;

    open?.({
      type: "error",
      message: "Title is too long",
      description: KAIZEN_TITLE_LIMIT_MESSAGE,
    });
    return false;
  };

  const normalizedValues = () => ({
    ...values,
    title: normalizeKaizenTitle(values.title),
    category: values.category || null,
    impacted_volume: isProductivityCategory ? nullableNumber(values.impacted_volume) : null,
    error_before: isQualityCategory ? nullableNumber(values.error_before) : null,
    error_after: isQualityCategory ? nullableNumber(values.error_after) : null,
    rework_time: isQualityCategory ? nullableNumber(values.rework_time) : null,
    total_time_saved: isOtherCategory ? nullableNumber(values.total_time_saved) : null,
    tat_before: isTatCategory ? nullableNumber(values.tat_before) : null,
    tat_after: isTatCategory ? nullableNumber(values.tat_after) : null,
    monthly_transaction_volume: null,
    monthly_time_saved: null,
    tat_improvement_percent: isTatCategory ? calculatedTatImpact.improvementPercent : null,
    revenue_generated_usd: isRevenueCategory ? nullableNumber(values.revenue_generated_usd) : null,
    time_saved: isProductivityCategory ? nullableNumber(values.time_saved) : null,
    hours_saved: isTatCategory ? 0 : values.hours_saved,
    fte_saving: isProductivityCategory || isQualityCategory || isOtherCategory ? calculatedFteSaving : 0,
    department_id: selectedKaizenDepartmentId || null,
    department_code: selectedKaizenDepartment?.code ?? selectedDepartment?.code ?? values.department_code,
    department_name: selectedDepartment?.name ?? values.department_name,
    client_name: selectedClient?.name ?? values.client_name,
    process_id: selectedProcess?.id ?? values.process_id,
    process_name: getProcessLabel(selectedProcess) || values.process_name,
    reporting_manager_username:
      resolvedManagerUsername ||
      values.reporting_manager_username ||
      selectedDepartmentManagerUsername,
    reporting_manager_email:
      resolvedManagerEmail ||
      values.reporting_manager_email ||
      selectedDepartmentManagerEmail,
    team_lead_username:
      resolvedManagerUsername ||
      values.team_lead_username ||
      values.reporting_manager_username ||
      selectedDepartmentManagerUsername,
    team_lead_email:
      resolvedManagerEmail ||
      values.team_lead_email ||
      values.reporting_manager_email ||
      selectedDepartmentManagerEmail,
    team_lead_name:
      resolvedManagerName ||
      values.team_lead_name ||
      values.reporting_manager_username ||
      selectedDepartmentManagerName,
    project_members: teamMembersText
      .split("\n")
      .map((member) => member.trim())
      .filter(Boolean),
    submitted_by_username: values.submitted_by_username || identity?.username,
    submitted_by_email: values.submitted_by_email || currentEmployee?.email || identity?.email,
    submitted_by_name:
      values.submitted_by_name ||
      currentEmployeeName ||
      `${identity?.first_name ?? ""} ${identity?.last_name ?? ""}`.trim() ||
      identity?.username,
  });

  const uploadAttachments = async (ideaId: string) => {
    if (files.length === 0) return;

    const oversized = files.filter((file) => file.size > MAX_ATTACHMENT_SIZE);
    if (oversized.length > 0) {
      throw new Error(
        `${oversized.map((file) => file.name).join(", ")} ${oversized.length === 1 ? "exceeds" : "exceed"} the 10 MB attachment limit`,
      );
    }

    const timestamp = Date.now();
    const paths = files.map((file, index) => `ideas/${ideaId}/${timestamp}-${index}-${file.name}`);

    for (let start = 0; start < files.length; start += MAX_ATTACHMENT_BATCH_SIZE) {
      const fileBatch = files.slice(start, start + MAX_ATTACHMENT_BATCH_SIZE);
      const pathBatch = paths.slice(start, start + MAX_ATTACHMENT_BATCH_SIZE);
      await taruviStorageProvider.create({
        resource: "kaizen-attachments",
        variables: {
          files: fileBatch,
          paths: pathBatch,
          metadatas: fileBatch.map((file) => ({ idea_id: ideaId, file_name: file.name })),
        },
        meta: {},
      });
    }

    await Promise.all(
      files.map((file, index) =>
        taruviDataProvider.create({
          resource: "kaizen_attachments",
          variables: {
            idea_id: ideaId,
            bucket: "kaizen-attachments",
            path: paths[index],
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || "application/octet-stream",
            attachment_type: file.type.startsWith("image/") ? "Before Screenshot" : "Document",
            uploaded_by_username: identity?.username,
            uploaded_at: new Date().toISOString(),
          },
          meta: {},
        }),
      ),
    );
    setFiles([]);
  };

  const updateProjectMembers = (_: unknown, selectedOptions: ProjectMemberOption[]) => {
    const seen = new Set<string>();
    const nextLines = selectedOptions
      .filter((option) => {
        if (!option.key || seen.has(option.key)) return false;
        seen.add(option.key);
        return true;
      })
      .map((option) => option.line);
    setTeamMembersText(nextLines.join("\n"));
  };

  const parseTeamContributions = (): TeamContributionInput[] =>
    teamMembersText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [identityValue = "", nameOrEmail = "", role = "", percent = "", description = ""] = line.split("|").map((part) => part.trim());
        const firstIsEmail = identityValue.includes("@");
        const secondIsEmail = nameOrEmail.includes("@");
        return {
          member_username: firstIsEmail ? undefined : identityValue,
          member_email: firstIsEmail ? identityValue : secondIsEmail ? nameOrEmail : undefined,
          member_name: secondIsEmail ? identityValue : nameOrEmail || identityValue,
          contribution_role: role || (values.effort_type === "Team" ? "Project Member" : "Project Lead"),
          contribution_percent: percent ? Number(percent) : undefined,
          description,
        };
      });

  const selectedAttachmentTotalSize = files.reduce((total, file) => total + file.size, 0);

  const syncTeamContributions = async (ideaId: string) => {
    const members = parseTeamContributions();
    if (members.length === 0) return;
    const response = await executeFunction<{ success: boolean; error?: string }>("kaizen-team-contributions", {
      action: "sync",
      idea_id: ideaId,
      members,
    });
    if (!response.success) throw new Error(response.error || "Team contributions could not be saved");
  };

  const syncCustomFieldValues = async (ideaId: string) => {
    const existingRows = customValuesResult.data ?? [];
    const timestamp = new Date().toISOString();
    const fieldsToSync = customFields
      .map((field) => ({
        key: String(field.field_key ?? "").trim(),
        label: String(field.label || field.field_key || "").trim(),
      }))
      .filter((field) => field.key && field.label && !CORE_KAIZEN_FORM_FIELDS.has(field.key));

    if (fieldsToSync.length === 0) return;

    await Promise.all(
      fieldsToSync.map((field) => {
        const value = String(customFieldValues[field.key] ?? "").trim();
        const existingRow = existingRows.find((row) => row.field_key === field.key);
        const variables = {
          idea_id: ideaId,
          field_key: field.key,
          field_label: field.label,
          value,
          updated_at: timestamp,
          created_at: existingRow?.created_at ?? timestamp,
        };
        return existingRow?.id
          ? taruviDataProvider.update({ resource: "kaizen_custom_field_values", id: existingRow.id, variables, meta: {} })
          : taruviDataProvider.create({ resource: "kaizen_custom_field_values", variables, meta: {} });
      }),
    );
    customValuesQuery.refetch();
  };

  const persistDuplicateChecks = async (idea: KaizenIdea, payload: Partial<KaizenIdea>) => {
    if (duplicateMatches.length === 0) return;
    await executeFunction<DuplicateDetectionResponse>("kaizen-duplicate-detection", {
      action: "detect",
      persist: true,
      idea_id: idea.id,
      display_threshold: 40,
      justification: duplicateJustification,
      values: {
        ...payload,
        id: idea.id,
        kaizen_id: idea.kaizen_id,
      },
    });
  };

  const auditRole = roles.isSuperAdmin
    ? "Super Admin"
    : roles.isAdmin
      ? "Admin"
      : roles.isPeQaRole
        ? "PE/QA"
        : roles.isOmSomRole
          ? "OM/SOM"
          : roles.isManager
            ? "Lead/Manager"
            : "Employee";
  const auditDisplayName = [identity?.first_name, identity?.last_name].filter(Boolean).join(" ") || identity?.username || "System";

  const appendKaizenAudit = async (idea: KaizenIdea, actionType: string, source: string, previous?: KaizenIdea | null) => {
    const response = await executeFunction<AuditAppendResponse>("kaizen-audit-log", {
      action: "append",
      action_type: actionType,
      entity_type: "Kaizen",
      entity_id: idea.id,
      kaizen_id: idea.kaizen_id,
      department_name: idea.department_name,
      user_username: identity?.username,
      user_display_name: auditDisplayName,
      user_role: auditRole,
      severity: "Info",
      source,
      old_value: previous ?? {},
      new_value: idea,
    });
    if (!response.success) {
      throw new Error(response.error || "Audit log entry could not be created.");
    }
  };

  const saveDraft = async () => {
    if (!validateSelections()) return;
    if (!validateCustomFields()) return;
    if (!validateTitleLimit()) return;

    const payload = normalizedValues();
    if (!(await validateNoSubmittedDuplicate(payload))) return;

    setIsSavingDraft(true);
    try {
      const draftValues = {
        ...payload,
        status: "Draft",
        current_stage: "Draft",
        is_draft: true,
        updated_at: new Date().toISOString(),
        created_at: values.created_at ?? new Date().toISOString(),
      };

      const response =
        mode === "edit" && id
          ? await taruviDataProvider.update({ resource: "kaizen_ideas", id, variables: draftValues, meta: {} })
          : await taruviDataProvider.create({ resource: "kaizen_ideas", variables: draftValues, meta: {} });

      const saved = firstRecord(response.data as KaizenIdea | KaizenIdea[]);
      if (!saved?.id) {
        throw new Error("Draft was saved but the response did not include an idea ID.");
      }

      await uploadAttachments(saved.id);
      await syncTeamContributions(saved.id);
      await syncCustomFieldValues(saved.id);
      const auditedDraft = { ...(existing ?? {}), ...draftValues, ...saved } as KaizenIdea;
      await appendKaizenAudit(auditedDraft, "Kaizen Draft Saved", "kaizen-draft-save", existing);
      open?.({ type: "success", message: "Draft saved", description: "Your Kaizen draft is available in My Kaizens." });
      redirectToList();
    } catch (error) {
      open?.({ type: "error", message: "Unable to save draft", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const submitIdea = async () => {
    if (!validateCustomFields()) return;
    if (!validateTitleLimit()) return;

    const payload = normalizedValues();
    if (!validateSubmitPayload(payload)) return;
    if (!(await validateNoSubmittedDuplicate(payload))) return;

    setIsSubmitting(true);
    try {
      if (actionableDuplicateMatches.length > 0 && !duplicateJustification.trim()) {
        throw new Error("Similar Kaizens were found. Add a duplicate justification before submitting.");
      }
      const response = await executeFunction<SubmitResponse>("kaizen-submit-idea", {
        idea_id: id,
        values: payload,
        lead_correction_resubmit: isLeadCorrectionEditor,
        portal_base_url: window.location.origin,
      });

      if (!response.success || !response.idea) {
        const missing = responseMissingFieldLabels(response.missing_fields);
        if (missing.length > 0) {
          notifyMissingSubmitFields(missing);
          return;
        }
        throw new Error(response.error || "Submit failed");
      }

      await uploadAttachments(response.idea.id);
      await syncTeamContributions(response.idea.id);
      await syncCustomFieldValues(response.idea.id);
      await persistDuplicateChecks(response.idea, payload);
      // The submit function intentionally returns a compact idea response. Build the
      // audit snapshot from the submitted payload so Impact values are not omitted.
      const auditedIdea = { ...(existing ?? {}), ...payload, ...response.idea } as KaizenIdea;
      await appendKaizenAudit(auditedIdea, "Kaizen Submitted", "kaizen-submit-idea", existing);
      open?.({
        type: "success",
        message: isLeadCorrectionEditor ? "Kaizen resubmitted" : "Kaizen submitted",
        description: isLeadCorrectionEditor
          ? `${response.idea.kaizen_id} was resubmitted for further approval.`
          : `${response.idea.kaizen_id} was sent for Lead/Manager review.`,
      });
      redirectToList();
    } catch (error) {
      open?.({ type: "error", message: "Unable to submit Kaizen", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingQuery.isLoading && mode === "edit") {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!canUseForm) {
    return <AccessDenied title={mode === "edit" ? "Kaizen correction access required" : "Kaizen submission access required"} />;
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h2">{isLeadCorrectionEditor ? "Edit Kaizen Correction" : isEmployeeResubmission ? "Resubmit Kaizen" : mode === "edit" ? "Edit Kaizen" : "Submit Kaizen"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isLeadCorrectionEditor
              ? "Update the returned Kaizen details and resubmit it for further approval."
              : isEmployeeResubmission
                ? "Update your withdrawn or returned Kaizen details and resubmit it for Lead/Manager review."
              : "Final submission generates a Kaizen ID and notifies the reporting manager."}
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography sx={{ fontFamily: "Quicksand", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.disabled", mb: 1.75 }}>
                  Idea Details
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    required
                    label="Title"
                    value={values.title ?? ""}
                    onChange={(event) => updateValue("title", event.target.value)}
                    error={isKaizenTitleTooLong(values.title)}
                    helperText={
                      isKaizenTitleTooLong(values.title)
                        ? KAIZEN_TITLE_LIMIT_MESSAGE
                        : `${normalizeKaizenTitle(values.title).length}/${KAIZEN_TITLE_MAX_LENGTH} characters`
                    }
                    inputProps={{ maxLength: KAIZEN_TITLE_MAX_LENGTH }}
                    fullWidth
                  />
                  <TextField required label="Problem Statement" value={values.problem_statement ?? ""} onChange={(event) => updateValue("problem_statement", event.target.value)} multiline rows={4} fullWidth />
                  <TextField required label="Proposed Solution" value={values.proposed_solution ?? ""} onChange={(event) => updateValue("proposed_solution", event.target.value)} multiline rows={4} fullWidth />
                  <TextField required label="Expected Benefit" value={values.expected_benefit ?? ""} onChange={(event) => updateValue("expected_benefit", event.target.value)} multiline rows={3} fullWidth />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select label="Category" value={values.category ?? ""} onChange={(event) => updateValue("category", event.target.value)}>
                        <MenuItem value="" disabled>
                          <em>Select category</em>
                        </MenuItem>
                        {categoryOptions.map((category) => (
                          <MenuItem key={category.value} value={category.value}>{category.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth required>
                      <InputLabel>Effort Type</InputLabel>
                      <Select label="Effort Type" value={values.effort_type ?? ""} onChange={(event) => updateValue("effort_type", event.target.value)}>
                        <MenuItem value="" disabled>
                          <em>Select effort type</em>
                        </MenuItem>
                        {effortTypeOptions.map((effort) => (
                          <MenuItem key={effort.value} value={effort.value}>{effort.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <FormControl fullWidth required>
                    <InputLabel>Dependency</InputLabel>
                    <Select label="Dependency" value={values.dependency ?? ""} onChange={(event) => updateValue("dependency", event.target.value)}>
                      <MenuItem value="" disabled>
                        <em>Select dependency</em>
                      </MenuItem>
                      {DEPENDENCY_OPTIONS.map((dependency) => (
                        <MenuItem key={dependency} value={dependency}>{dependency}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {isProductivityCategory ? (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Impacted Month Volume"
                        type="text"
                        value={values.impacted_volume ?? ""}
                        onChange={(event) => updateValue("impacted_volume", digitsOnly(event.target.value))}
                        inputProps={WHOLE_NUMBER_INPUT_PROPS}
                        fullWidth
                      />
                      <TextField
                        label="Time Saved (minutes)"
                        type="number"
                        value={values.time_saved ?? ""}
                        onChange={(event) => updateValue("time_saved", event.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        fullWidth
                      />
                      <TextField
                        label="FTE Saving"
                        value={formatFteSaving(calculatedFteSaving)}
                        InputProps={{ readOnly: true }}
                        helperText={benefitCalculationHelperText(selectedCategory, benefitCalculationConfigs)}
                        fullWidth
                      />
                    </Stack>
                  ) : null}
                  {isQualityCategory ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 2 }}>
                      <TextField
                        label="Error Before"
                        type="number"
                        value={values.error_before ?? ""}
                        onChange={(event) => updateValue("error_before", event.target.value)}
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="Error After"
                        type="number"
                        value={values.error_after ?? ""}
                        onChange={(event) => updateValue("error_after", event.target.value)}
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                      <TextField
                        label="Rework Time per Transaction (minutes)"
                        type="number"
                        value={values.rework_time ?? ""}
                        onChange={(event) => updateValue("rework_time", event.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        fullWidth
                      />
                      <TextField
                        label="FTE Saving"
                        value={formatFteSaving(calculatedFteSaving)}
                        InputProps={{ readOnly: true }}
                        helperText={benefitCalculationHelperText(selectedCategory, benefitCalculationConfigs)}
                        fullWidth
                      />
                    </Box>
                  ) : null}
                  {isOtherCategory ? (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="Total Time Saved (minutes)"
                        type="number"
                        value={values.total_time_saved ?? ""}
                        onChange={(event) => updateValue("total_time_saved", event.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                        fullWidth
                      />
                      <TextField
                        label="FTE Saving"
                        value={formatFteSaving(calculatedFteSaving)}
                        InputProps={{ readOnly: true }}
                        helperText={benefitCalculationHelperText(selectedCategory, benefitCalculationConfigs)}
                        fullWidth
                      />
                    </Stack>
                  ) : null}
                  {isTatCategory ? (
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                      <Tooltip title={<Box sx={{ whiteSpace: "pre-line" }}>{TAT_BEFORE_TOOLTIP}</Box>} arrow placement="top">
                        <TextField required label="TAT Before (minutes)" type="number" value={values.tat_before ?? ""} onChange={(event) => updateValue("tat_before", event.target.value)} inputProps={{ min: 0, step: 0.01 }} fullWidth />
                      </Tooltip>
                      <Tooltip title={<Box sx={{ whiteSpace: "pre-line" }}>{TAT_AFTER_TOOLTIP}</Box>} arrow placement="top">
                        <TextField required label="TAT After (minutes)" type="number" value={values.tat_after ?? ""} onChange={(event) => updateValue("tat_after", event.target.value)} inputProps={{ min: 0, step: 0.01 }} error={Number(values.tat_after) > Number(values.tat_before)} helperText={Number(values.tat_after) > Number(values.tat_before) ? "TAT After cannot exceed TAT Before." : undefined} fullWidth />
                      </Tooltip>
                      <TextField label="TAT Improvement (%)" value={formatFteSaving(calculatedTatImpact.improvementPercent)} InputProps={{ readOnly: true }} helperText="((TAT Before - TAT After) / TAT Before) x 100" fullWidth />
                    </Box>
                  ) : null}
                  {isRevenueCategory ? (
                    <TextField required label="Revenue Generated (USD)" type="number" value={values.revenue_generated_usd ?? ""} onChange={(event) => updateValue("revenue_generated_usd", event.target.value)} inputProps={{ min: 0.01, step: 0.01, inputMode: "decimal" }} helperText="Enter the expected or validated revenue amount in USD." fullWidth />
                  ) : null}
                </Stack>
              </Box>

              {customFields.length > 0 ? (
                <>
                  <Divider />
                  <Box>
                    <Typography sx={{ fontFamily: "Quicksand", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.disabled", mb: 1.75 }}>
                      Custom Fields
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                      {customFields.map((field) => {
                        const fieldKey = String(field.field_key ?? "").trim();
                        if (!fieldKey) return null;
                        return (
                          <CustomFieldInput
                            key={field.id}
                            field={field}
                            value={customFieldValues[fieldKey] ?? ""}
                            onChange={(nextValue) => updateCustomValue(fieldKey, nextValue)}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                </>
              ) : null}

              <Divider />

              <Box>
                <Typography sx={{ fontFamily: "Quicksand", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.disabled", mb: 1.75 }}>
                  Routing
                </Typography>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl fullWidth required>
                      <InputLabel shrink>Department</InputLabel>
                      <Select
                        label="Department"
                        value={selectedDepartment?.id ?? ""}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected) return selectedDepartment?.name || "Selected department";
                          if (departmentsQuery.isLoading) return "Loading departments...";
                          if (departmentsQuery.isError) return "Unable to load departments";
                          if (departments.length === 0) return "No departments available";
                          return "Choose department";
                        }}
                        onChange={(event) => {
                          const department = departments.find((item) => item.id === event.target.value);
                          const departmentLead = getDepartmentLead(department);
                          const mappedKaizenDepartment = kaizenDepartments.find(
                            (item) => item.name.trim().toLowerCase() === String(department?.name ?? "").trim().toLowerCase(),
                          );
                          const departmentManagerUsername = employeeUsername(departmentLead) || department?.manager_username || "";
                          const departmentManagerEmail = departmentLead?.email || department?.manager_email || "";
                          const departmentManagerName = employeeFullName(departmentLead) || departmentManagerUsername;
                          setValues((current) => ({
                            ...current,
                            department_id: event.target.value,
                            department_code: mappedKaizenDepartment?.code ?? department?.code,
                            department_name: department?.name,
                            reporting_manager_username:
                              mode === "create"
                                ? resolvedManagerUsername || departmentManagerUsername
                                : current.reporting_manager_username || resolvedManagerUsername || departmentManagerUsername,
                            reporting_manager_email:
                              mode === "create"
                                ? resolvedManagerEmail || departmentManagerEmail
                                : current.reporting_manager_email || resolvedManagerEmail || departmentManagerEmail,
                            team_lead_username:
                              mode === "create"
                                ? resolvedManagerUsername || departmentManagerUsername
                                : current.team_lead_username || resolvedManagerUsername || departmentManagerUsername,
                            team_lead_email:
                              mode === "create"
                                ? resolvedManagerEmail || departmentManagerEmail
                                : current.team_lead_email || resolvedManagerEmail || departmentManagerEmail,
                            team_lead_name:
                              mode === "create"
                                ? resolvedManagerName || departmentManagerName
                                : current.team_lead_name || resolvedManagerName || departmentManagerName,
                          }));
                        }}
                      >
                        {departmentsQuery.isLoading ? (
                          <MenuItem value="" disabled>Loading departments...</MenuItem>
                        ) : departmentsQuery.isError ? (
                          <MenuItem value="" disabled>Unable to load departments</MenuItem>
                        ) : departments.length === 0 ? (
                          <MenuItem value="" disabled>No departments available</MenuItem>
                        ) : (
                          <MenuItem value="" disabled>Choose department</MenuItem>
                        )}
                        {departments.map((department) => (
                          <MenuItem key={department.id} value={department.id}>{department.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth required>
                      <InputLabel shrink>Client</InputLabel>
                      <Select
                        label="Client"
                        value={values.client_id ?? ""}
                        displayEmpty
                        renderValue={(selected) => {
                          if (selected) return selectedClient?.name || "Selected client";
                          if (clientsQuery.isLoading) return "Loading clients...";
                          if (clientsQuery.isError) return "Unable to load clients";
                          if (clients.length === 0) return "No active clients available";
                          return "Choose client";
                        }}
                        onChange={(event) => {
                          const client = clients.find((item) => item.id === event.target.value);
                          setValues((current) => ({
                            ...current,
                            client_id: event.target.value,
                            client_name: client?.name,
                            process_id: undefined,
                            process_name: "",
                          }));
                        }}
                      >
                        {clientsQuery.isLoading ? (
                          <MenuItem value="" disabled>Loading clients...</MenuItem>
                        ) : clientsQuery.isError ? (
                          <MenuItem value="" disabled>Unable to load clients</MenuItem>
                        ) : clients.length === 0 ? (
                          <MenuItem value="" disabled>No active clients available</MenuItem>
                        ) : (
                          <MenuItem value="" disabled>Choose client</MenuItem>
                        )}
                        {clients.map((client) => (
                          <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                  <FormControl fullWidth required>
                    <InputLabel shrink>Process</InputLabel>
                    <Select
                      label="Process"
                      value={values.process_id ?? ""}
                      displayEmpty
                      renderValue={(selected) => {
                        if (selected) return selectedProcessLabel || "Selected process";
                        if (!values.client_id) return "Select client first";
                        if (processesQuery.isLoading) return "Loading processes...";
                        if (processes.length === 0) return "No active processes for this client";
                        return "Choose process";
                      }}
                      onChange={(event) => {
                        const process = processes.find((item) => item.id === event.target.value);
                        const processLabel = getProcessLabel(process);
                        setValues((current) => ({
                          ...current,
                          process_id: process?.id,
                          process_name: processLabel,
                        }));
                      }}
                    >
                      {!values.client_id ? (
                        <MenuItem value="" disabled>Select client first</MenuItem>
                      ) : processesQuery.isLoading ? (
                        <MenuItem value="" disabled>Loading processes...</MenuItem>
                      ) : processes.length === 0 ? (
                        <MenuItem value="" disabled>No active processes for this client</MenuItem>
                      ) : null}
                      {values.process_id && selectedProcessLabel && !selectedProcess ? (
                        <MenuItem value={values.process_id}>{selectedProcessLabel}</MenuItem>
                      ) : null}
                      {processes.map((process) => {
                        const processLabel = getProcessLabel(process) || "Unnamed process";
                        return (
                          <MenuItem key={process.id} value={process.id}>{processLabel}</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                  <Autocomplete
                    multiple
                    filterSelectedOptions
                    options={projectMemberOptions}
                    value={selectedProjectMemberOptions}
                    loading={employeesQuery.isLoading}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.key === value.key}
                    onChange={updateProjectMembers}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Project Members"
                        helperText={employeesQuery.isError ? "Unable to load People employees." : undefined}
                      />
                    )}
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontFamily: "Quicksand", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.disabled", mb: 1.75 }}>
                  Related Ideas
                </Typography>
                {exactSubmittedDuplicate ? (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Stack spacing={0.75}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        Duplicate idea detected
                      </Typography>
                      <Typography variant="body2">{EXACT_DUPLICATE_IDEA_MESSAGE}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
                        <Typography variant="caption" color="text.secondary">
                          Existing idea: {kaizenReferenceLabel(exactSubmittedDuplicate)}
                        </Typography>
                        <Button size="small" variant="text" onClick={() => navigate(`/kaizens/show/${exactSubmittedDuplicate.id}`)}>
                          View details
                        </Button>
                      </Stack>
                    </Stack>
                  </Alert>
                ) : null}
                {!exactSubmittedDuplicate && isCheckingDuplicates ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Checking for duplicate Kaizens...
                  </Alert>
                ) : null}
                {!exactSubmittedDuplicate && actionableDuplicateMatches.length > 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Semantic duplicate detection found {actionableDuplicateMatches.length} strong match{actionableDuplicateMatches.length === 1 ? "" : "es"}. Add a justification before submitting.
                  </Alert>
                ) : !exactSubmittedDuplicate && duplicateMatches.length > 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Semantic duplicate detection found {duplicateMatches.length} related idea{duplicateMatches.length === 1 ? "" : "s"}. Review them before submitting.
                  </Alert>
                ) : !exactSubmittedDuplicate && visibleRelatedIdeas.length > 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Similar ideas already exist. Review them before submitting to avoid duplicates.
                  </Alert>
                ) : null}
                <Stack spacing={1}>
                  {!exactSubmittedDuplicate && duplicateMatches.map((match) => (
                    <Box key={match.candidate_idea_id || match.candidate_kaizen_id || match.title} sx={{ border: 1, borderColor: "warning.main", borderRadius: 1, p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <KaizenTitleText title={match.title || match.candidate_kaizen_id} sx={{ flex: 1 }} />
                        <Chip
                          color={Number(match.similarity_percent ?? 0) >= 90 ? "error" : Number(match.similarity_percent ?? 0) >= 70 ? "warning" : "info"}
                          size="small"
                          label={`${Math.round(Number(match.similarity_percent ?? 0))}% ${match.classification || "match"}`}
                        />
                        {match.status ? <StatusChip status={match.status} /> : null}
                        {match.candidate_idea_id ? (
                          <Button size="small" variant="text" onClick={() => navigate(`/kaizens/show/${match.candidate_idea_id}`)}>
                            View details
                          </Button>
                        ) : null}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {match.candidate_kaizen_id || "Draft"} - {match.status || "Unknown status"} - {match.submitter || "unknown owner"}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {match.matched_meaning || `Matched ${(match.matched_fields ?? []).join(", ") || "content"}.`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Matched fields: {(match.matched_fields ?? []).join(", ") || "semantic content"}
                      </Typography>
                    </Box>
                  ))}
                  {!exactSubmittedDuplicate && visibleRelatedIdeas.map((idea) => (
                    <Box key={idea.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <KaizenTitleText title={idea.title} sx={{ flex: 1 }} />
                        <StatusChip status={idea.status} />
                        <Button size="small" variant="text" onClick={() => navigate(`/kaizens/show/${idea.id}`)}>
                          View details
                        </Button>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{idea.kaizen_id || "Draft"} · {idea.problem_statement}</Typography>
                    </Box>
                  ))}
                </Stack>
                {!exactSubmittedDuplicate && actionableDuplicateMatches.length > 0 ? (
                  <TextField
                    label="Duplicate Justification"
                    helperText="Required when duplicate detection finds a strong match."
                    value={duplicateJustification}
                    onChange={(event) => setDuplicateJustification(event.target.value)}
                    multiline
                    rows={3}
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                ) : null}
                {!exactSubmittedDuplicate && duplicateMatches.length > 0 ? (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Scoring: {duplicateScoringMethod === "openai-embedding" ? "AI semantic embeddings" : "meaning-aware fallback"} · Title 20% · Problem 40% · Solution 30% · Context 10%
                  </Typography>
                ) : null}
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                  {values.category ? <CategoryChip category={values.category} /> : null}
                  {values.status ? <StatusChip status={values.status} /> : null}
                  {values.process_name ? <Chip variant="outlined" label={values.process_name} /> : null}
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography sx={{ fontFamily: "Quicksand", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "text.disabled", mb: 1.75 }}>
                  Attachments
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
                  <Button component="label" variant="outlined" startIcon={<AttachFileRoundedIcon />}>
                    Add multiple files
                    <input
                      type="file"
                      hidden
                      multiple
                      onChange={(event) => {
                        addSelectedFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </Button>
                  {files.length > 0 ? (
                    <Button variant="text" onClick={() => setFiles([])}>
                      Clear selected files
                    </Button>
                  ) : null}
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                  Select one or more documents/screenshots. Each file can be up to {formatFileSize(MAX_ATTACHMENT_SIZE)}.
                </Typography>
                {existingAttachments.length > 0 ? (
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Saved files
                    </Typography>
                    {existingAttachments.map((attachment) => (
                      <Stack
                        key={attachment.id}
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {attachmentFileName(attachment)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {attachment.attachment_type || "Document"}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadRoundedIcon />}
                          href={attachmentDownloadUrl(attachment)}
                          target="_blank"
                        >
                          Download
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                ) : null}
                {files.length > 0 && (
                  <Stack spacing={1} sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      New files ({files.length}) - total {formatFileSize(selectedAttachmentTotalSize)}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                      {files.map((file) => (
                        <Chip key={fileSelectionKey(file)} label={`${file.name} (${formatFileSize(file.size)})`} onDelete={() => setFiles((current) => current.filter((item) => fileSelectionKey(item) !== fileSelectionKey(file)))} />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ justifyContent: "flex-end" }}>
                <Button variant="outlined" onClick={() => navigate("/kaizens")}>
                  Cancel
                </Button>
                {canSaveDraft ? (
                  <Button
                    variant="outlined"
                    startIcon={isSavingDraft ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
                    disabled={isSavingDraft || isSubmitting}
                    onClick={saveDraft}
                  >
                    {isSavingDraft ? "Saving..." : "Save as Draft"}
                  </Button>
                ) : null}
                <Button
                  variant="contained"
                  startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : mode === "edit" ? <SendRoundedIcon /> : <AddRoundedIcon />}
                  disabled={isSavingDraft || isSubmitting}
                  onClick={submitIdea}
                >
                  {isSubmitting ? "Submitting..." : isLeadCorrectionEditor || isEmployeeResubmission ? "Resubmit Kaizen" : "Submit Kaizen"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

const CustomFieldInput = ({
  field,
  value,
  onChange,
}: {
  field: FormFieldConfig;
  value: string;
  onChange: (value: string) => void;
}) => {
  const fieldKey = String(field.field_key ?? "").trim();
  const label = String(field.label || fieldKey);
  const fieldType = String(field.field_type ?? "text");
  const required = Boolean(field.is_required);
  const helperText = field.help_text || undefined;

  if (fieldType === "textarea") {
    return (
      <TextField
        label={label}
        value={value}
        required={required}
        helperText={helperText}
        multiline
        rows={3}
        fullWidth
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (fieldType === "select" && field.options_group_key) {
    return (
      <CustomSelectField
        groupKey={field.options_group_key}
        label={label}
        value={value}
        required={required}
        helperText={helperText}
        onChange={onChange}
      />
    );
  }

  return (
    <TextField
      label={label}
      type={fieldType === "number" || fieldType === "date" ? fieldType : "text"}
      value={value}
      required={required}
      helperText={helperText}
      fullWidth
      InputLabelProps={fieldType === "date" ? { shrink: true } : undefined}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

const CustomSelectField = ({
  groupKey,
  label,
  value,
  required,
  helperText,
  onChange,
}: {
  groupKey: string;
  label: string;
  value: string;
  required: boolean;
  helperText?: string;
  onChange: (value: string) => void;
}) => {
  const { options } = useDropdownOptions(groupKey, []);

  return (
    <FormControl fullWidth required={required}>
      <InputLabel>{label}</InputLabel>
      <Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <MenuItem value="">
          <em>Select {label.toLowerCase()}</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
        ))}
      </Select>
      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
          {helperText}
        </Typography>
      ) : null}
    </FormControl>
  );
};
