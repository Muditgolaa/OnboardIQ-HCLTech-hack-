import type { Role } from '@/lib/roles';

// Matches backend/src/cli/seed-users.ts. Shown only by `npm run dev`, never in a production build.
export const DEMO_ACCOUNTS: { email: string; role: Role }[] = [
  { email: 'applicant1@onboardiq.test', role: 'APPLICANT' },
  { email: 'officer1@onboardiq.test', role: 'KYC_OFFICER' },
  { email: 'checker1@onboardiq.test', role: 'COMPLIANCE_OFFICER' },
];
