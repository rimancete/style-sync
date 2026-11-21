import { Panel, PanelDescription, PanelHeader, PanelTitle } from '~/components/ui/panel';

function UserProfileScreen() {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle as="h1">Profile</PanelTitle>
        <PanelDescription>Manage your personal account.</PanelDescription>
      </PanelHeader>
    </Panel>
  );
}

export default UserProfileScreen;
