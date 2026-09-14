import { OrganizationBuilder } from './OrganizationBuilder';
import { TeamsSettings } from './TeamsSettings';
import { useTeams } from './TeamsProvider';

export function TeamsOverlays() {
  const { builderOpen, settingsOpen, canOpenBuilder, canOpenSettings } = useTeams();

  return (
    <>
      {builderOpen && canOpenBuilder ? <OrganizationBuilder /> : null}
      {settingsOpen && canOpenSettings ? <TeamsSettings /> : null}
    </>
  );
}
