export default function NotFound() {
  // Note: Next.js (13.4.9) in dev mode doesn't reload this page correctly.
  // Restart `next dev` process if you edit this component.
  return (
    <div className="grid flex-1 place-items-center">
      <div className="flex h-10 items-center gap-4">
        <h1 className="text-2xl font-medium">404</h1>
        <div className="w-px self-stretch bg-slate-400" />
        <h2 className="text-sm">This page could not be found.</h2>
      </div>
    </div>
  );
}
