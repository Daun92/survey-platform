export const metadata = {
  title: 'Survey Platform',
};

export default function PublicSurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl">{children}</div>
    </div>
  );
}
