// Layout for the login and signup screens: centered, with the Snug heart on top.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-3xl text-accent-foreground">
          ♥
        </div>
        <h1 className="text-3xl font-semibold">Snug</h1>
        <p className="mt-1 text-muted">One cozy space for the two of you.</p>
      </div>
      {children}
    </main>
  );
}
