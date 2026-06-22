'use client';

import { CoachSidebar } from '@/components/ai/coach-sidebar';
import { CoachProvider } from '@/lib/ai/coach-context';
import { AuthProvider } from '@/lib/auth/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CoachProvider>
        {children}
        <CoachSidebar />
      </CoachProvider>
    </AuthProvider>
  );
}