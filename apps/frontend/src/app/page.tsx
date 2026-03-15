import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Survey Platform
            </h1>
            <p className="text-muted-foreground">
              사내 설문조사 생성 · 수집 · 분석 플랫폼
            </p>
          </div>
          <Link href="/login">
            <Button size="lg" className="w-full">
              로그인
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
