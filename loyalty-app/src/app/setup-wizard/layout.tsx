// Force dynamic rendering for the setup wizard (uses searchParams)
export const dynamic = 'force-dynamic';

export default function SetupWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

