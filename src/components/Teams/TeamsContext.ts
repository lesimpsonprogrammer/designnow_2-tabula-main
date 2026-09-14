import { createContext, useContext } from 'react';
import type { OrganizationSetup, TeamMember, TeamsRole } from './teamsTypes';

export type TabulaLicenseType = 'individual' | 'teams' | null;

export type TeamsContextValue = {
  licenseType: TabulaLicenseType;
  isTeamsEdition: boolean;
  loading: boolean;
  role: TeamsRole | null;
  setup: OrganizationSetup | null;
  members: TeamMember[];
  builderOpen: boolean;
  settingsOpen: boolean;
  canOpenBuilder: boolean;
  canOpenSettings: boolean;
  settingsReadOnly: boolean;
  openBuilder: () => void;
  openSettings: () => void;
  closeBuilder: () => void;
  closeSettings: () => void;
  refresh: () => Promise<void>;
};

export const TeamsContext = createContext<TeamsContextValue | null>(null);

export function useTeams() {
  const value = useContext(TeamsContext);
  if (!value) throw new Error('useTeams must be used inside TeamsProvider');
  return value;
}
