import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../Auth/AuthGate';
import { TeamsContext, type TabulaLicenseType, type TeamsContextValue } from './TeamsContext';
import type { OrganizationSetup, TeamMember, TeamsRole } from './teamsTypes';
import './teams.css';

export { useTeams } from './TeamsContext';

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { client, org, user, isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [licenseType, setLicenseType] = useState<TabulaLicenseType>(null);
  const [isTeamsEdition, setIsTeamsEdition] = useState(false);
  const [role, setRole] = useState<TeamsRole | null>(null);
  const [setup, setSetup] = useState<OrganizationSetup | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoOpenedForOrg, setAutoOpenedForOrg] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);

    const { data: license } = await client
      .from('tabula_licenses')
      .select('license_type,status,expires_at')
      .eq('org_id', org.id)
      .maybeSingle();

    const licenseActive = Boolean(
      license
      && license.status === 'active'
      && (!license.expires_at || new Date(license.expires_at).getTime() > Date.now()),
    );
    const activeLicenseType: TabulaLicenseType = licenseActive
      && (license?.license_type === 'individual' || license?.license_type === 'teams')
      ? license.license_type
      : null;
    const teamsActive = activeLicenseType === 'teams';

    setLicenseType(activeLicenseType);
    setIsTeamsEdition(teamsActive);

    if (!teamsActive && !isPlatformAdmin) {
      setRole(null);
      setSetup(null);
      setMembers([]);
      setBuilderOpen(false);
      setSettingsOpen(false);
      setLoading(false);
      return;
    }

    let resolvedRole: TeamsRole | null = null;
    if (isPlatformAdmin || org.role === 'owner') resolvedRole = 'org_admin';
    else if (org.role === 'admin') resolvedRole = 'site_admin';
    else {
      const { data: memberRoles } = await client
        .from('tabula_team_members')
        .select('role')
        .eq('org_id', org.id)
        .eq('user_id', user.id)
        .eq('status', 'active');

      const roles = ((memberRoles ?? []) as { role: TeamsRole }[]).map((item) => item.role);
      const priority: TeamsRole[] = ['section_leader', 'site_designer', 'logo_designer'];
      resolvedRole = priority.find((candidate) => roles.includes(candidate)) ?? null;
    }
    setRole(resolvedRole);

    const [{ data: setupRecord }, { data: memberRecords }] = await Promise.all([
      client
        .from('tabula_org_setups')
        .select('*')
        .eq('org_id', org.id)
        .maybeSingle(),
      client
        .from('tabula_team_members')
        .select('*')
        .eq('org_id', org.id)
        .order('created_at', { ascending: true }),
    ]);

    setSetup((setupRecord as OrganizationSetup | null) ?? null);
    setMembers((memberRecords as TeamMember[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id, user.id, isPlatformAdmin]);

  useEffect(() => {
    if (
      !loading
      && (isTeamsEdition || isPlatformAdmin)
      && role === 'org_admin'
      && !setup?.setup_completed_at
      && autoOpenedForOrg !== org.id
    ) {
      setBuilderOpen(true);
      setAutoOpenedForOrg(org.id);
    }
  }, [loading, isTeamsEdition, isPlatformAdmin, role, setup?.setup_completed_at, autoOpenedForOrg, org.id]);

  const canOpenBuilder = isPlatformAdmin || (isTeamsEdition && role === 'org_admin');
  const canOpenSettings = isPlatformAdmin || (isTeamsEdition && (role === 'org_admin' || role === 'site_admin'));
  const settingsReadOnly = !isPlatformAdmin && role === 'site_admin';

  const value = useMemo<TeamsContextValue>(() => ({
    licenseType,
    isTeamsEdition,
    loading,
    role,
    setup,
    members,
    builderOpen,
    settingsOpen,
    canOpenBuilder,
    canOpenSettings,
    settingsReadOnly,
    openBuilder: () => {
      if (canOpenBuilder) setBuilderOpen(true);
    },
    openSettings: () => {
      if (canOpenSettings) setSettingsOpen(true);
    },
    closeBuilder: () => setBuilderOpen(false),
    closeSettings: () => setSettingsOpen(false),
    refresh,
  }), [licenseType, isTeamsEdition, loading, role, setup, members, builderOpen, settingsOpen, canOpenBuilder, canOpenSettings, settingsReadOnly]);

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}
