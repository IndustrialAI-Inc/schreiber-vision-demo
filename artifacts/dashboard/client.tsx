import { Artifact } from '@/components/create-artifact';
import Dashboard from '@/components/dashboard';

export const dashboardArtifact = new Artifact<'dashboard', {isInline?: boolean}>({
  kind: 'dashboard',
  description: 'Dashboard',
  initialize: () => {},
  onStreamPart: () => {},
  content: () => {
    return (
      <Dashboard />
    );
  },
  actions: [],
  toolbar: [],
}); 