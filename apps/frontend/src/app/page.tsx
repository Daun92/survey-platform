export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Survey Platform
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          사내 설문조사 생성-수집-분석 플랫폼
        </p>
        <div className="flex gap-4 justify-center text-sm text-muted-foreground">
          <span>Next.js 15</span>
          <span>|</span>
          <span>Tailwind CSS v4</span>
          <span>|</span>
          <span>shadcn/ui</span>
        </div>
      </div>
    </main>
  );
}
