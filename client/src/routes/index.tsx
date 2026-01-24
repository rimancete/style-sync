import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary">Style Sync</h1>
        <p className="mt-4 text-xl text-muted-foreground">Barbershop Booking System</p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:opacity-90"
          >
            Login
          </a>
          <a
            href="/register"
            className="rounded-lg border border-primary px-6 py-3 text-primary hover:bg-primary/10"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
