import { OrganizationBuilder } from './OrganizationBuilder';
import { TeamsSettings } from './TeamsSettings';
import { useTeams } from './TeamsProvider';

export function TeamsOverlays() {
  const { canOpenBuilder, canOpenSettings, closeBuilder, closeSettings } = useTeams();

  // Modal components own their own close controls. The close references below keep
  // the provider API explicit for future keyboard/backdrop dismissal work.
  void closeBuilder;
  void closeSettings;

  return (
    <>
      {canOpenBuilder ? <OrganizationBuilder /> : null}
      {canOpenSettings ? <TeamsSettings /> : null}
    </>
  );
}
