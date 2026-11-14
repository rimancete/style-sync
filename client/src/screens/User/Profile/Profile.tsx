import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

function UserProfileScreen() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">Profile</CardTitle>
        <CardDescription>Manage your personal account.</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default UserProfileScreen;
