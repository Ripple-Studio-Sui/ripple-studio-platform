'use client';

import { AuthGuard } from '@/components/auth-guard';
import { CreateWizard } from '@/components/create/create-wizard';

export default function CreatePage() {
  return (
    <AuthGuard>
      <CreateWizard />
    </AuthGuard>
  );
}