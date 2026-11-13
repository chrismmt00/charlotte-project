// Admin sign-in screens: one centred brand card, no admin shell (AdminShell skips /admin/signin*).
// Auth.js replaces the logic behind these screens; the layout and cards stay.
export default function SignInLayout({ children }) {
  return (
    <main id="main" className="min-h-screen bg-bg-deep text-fg flex items-center justify-center px-4 py-10 box-border">
      {children}
    </main>
  );
}
