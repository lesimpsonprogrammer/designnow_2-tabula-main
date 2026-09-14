export type TeamsRole =
  | 'org_admin'
  | 'site_admin'
  | 'section_leader'
  | 'site_designer'
  | 'logo_designer';

export type PermissionKey =
  | 'organization_builder'
  | 'delete_project'
  | 'approve_final_file'
  | 'create_users'
  | 'financials'
  | 'asset_design';

export type PermissionSet = Record<PermissionKey, boolean>;

export const ROLE_LABELS: Record<TeamsRole, string> = {
  org_admin: 'Org Admin',
  site_admin: 'Site Admin',
  section_leader: 'Section Leader',
  site_designer: 'Site Designer',
  logo_designer: 'Logo Designer',
};

export const ROLE_DESCRIPTIONS: Record<TeamsRole, string> = {
  org_admin: 'Full organization authority, including the Organization Builder and financial access.',
  site_admin: 'Broad administrative access without project deletion, final-file approval, financials, or Organization Builder access.',
  section_leader: 'Leads designers within one assigned section and its direction, theme, code, look, and feel.',
  site_designer: 'Design role that may work across any section. Asset Design Module access requires Org Admin approval.',
  logo_designer: 'Marketing and logo design role for the forthcoming Asset Design Module.',
};

export const BASE_PERMISSIONS: Record<TeamsRole, PermissionSet> = {
  org_admin: {
    organization_builder: true,
    delete_project: true,
    approve_final_file: true,
    create_users: true,
    financials: true,
    asset_design: true,
  },
  site_admin: {
    organization_builder: false,
    delete_project: false,
    approve_final_file: false,
    create_users: true,
    financials: false,
    asset_design: true,
  },
  section_leader: {
    organization_builder: false,
    delete_project: false,
    approve_final_file: false,
    create_users: false,
    financials: false,
    asset_design: false,
  },
  site_designer: {
    organization_builder: false,
    delete_project: false,
    approve_final_file: false,
    create_users: false,
    financials: false,
    asset_design: false,
  },
  logo_designer: {
    organization_builder: false,
    delete_project: false,
    approve_final_file: false,
    create_users: false,
    financials: false,
    asset_design: true,
  },
};

export const APPOINTABLE_ROLES: TeamsRole[] = [
  'site_admin',
  'section_leader',
  'site_designer',
  'logo_designer',
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  organization_builder: 'Organization Builder / Setup Wizard',
  delete_project: 'Delete project',
  approve_final_file: 'Approve final file',
  create_users: 'Create users',
  financials: 'Access financials',
  asset_design: 'Asset Design Module',
};

export type OrganizationSetup = {
  org_id: string;
  workspace_name: string;
  website: string;
  industry: string;
  company_size: string;
  operating_region: string;
  primary_use: string;
  project_stage: string;
  template_key: string;
  environment_type: string;
  environment_name: string;
  separate_environments: string[];
  technologies: string[];
  setup_completed_at: string | null;
};

export type TeamMember = {
  id: string;
  org_id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: TeamsRole;
  section_name: string | null;
  asset_design_approved: boolean;
  status: 'active' | 'pending' | 'inactive';
};

export type AccessRequest = {
  id: string;
  org_id: string;
  requested_by: string;
  name: string;
  email: string;
  requested_role: TeamsRole;
  section_name: string | null;
  asset_design_requested: boolean;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};
