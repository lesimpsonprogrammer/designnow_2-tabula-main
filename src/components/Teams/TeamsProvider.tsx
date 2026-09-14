import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '../Auth/AuthGate';
import { TeamsContext, type TeamsContextValue } from './TeamsContext';
import type { OrganizationSetup, TeamMember, TeamsRole } from './teamsTypes';
import './teams.css';

export { useTeams } from './TeamsContext';

export function TeamsProvider({ children }: { children: ReactNode }) {
  const { client, org, user } = useAuth();
  const [loading, setLoading] = useState(true);
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
      && license.license_type === 'teams'
      && license.status === 'active'
      && (!license.expires_at || new Date(license.expires_at).getTime() > Date.now()),
    );

    setIsTeamsEdition(licenseActive);

    if (!licenseActive) {
      setRole(null);
      setSetup(null);
      setMembers([]);
      setBuilderOpen(false);
      setSettingsOpen(false);
      setLoading(false);
      return;
    }

    let resolvedRole: TeamsRole | null = null;
    if (org.role === 'owner') resolvedRole = 'org_admin';
    else if (org.role === 'admin') resolvedRole = 'site_admin';
    else {
      const { data: memberRole } = await client
        .from('tabula_team_members')
        .select('role')
        .eq('org_id', org.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      resolvedRole = (memberRole?.role as TeamsRole | undefined) ?? null;
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
  }, [org.id, user.id]);

  useEffect(() => {
    if (
      !loading
      && isTeamsEdition
      && role === 'org_admin'
      && !setup?.setup_completed_at
      && autoOpenedForOrg !== org.id
    ) {
      setBuilderOpen(true);
      setAutoOpenedForOrg(org.id);
    }
  }, [loading, isTeamsEdition, role, setup?.setup_completed_at, autoOpenedForOrg, org.id]);

  const canOpenBuilder = isTeamsEdition && role === 'org_admin';
  const canOpenSettings = isTeamsEdition && (role === 'org_admin' || role === 'site_admin');
  const settingsReadOnly = role === 'site_admin';

  const value = useMemo<TeamsContextValue>(() => ({
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
  }), [isTeamsEdition, loading, role, setup, members, builderOpen, settingsOpen, canOpenBuilder, canOpenSettings, settingsReadOnly]);

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
}
