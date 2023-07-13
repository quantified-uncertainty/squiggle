export default function NotFound() {
  // Note: Next.js (13.4.9) in dev mode doesn't reload this page correctly.
  // Restart `next dev` process if you edit this component.
  return (
    <div className="flex-1 grid place-items-center">
      <div className="flex gap-4 items-center h-10">
        <h1 className="text-2xl font-medium">404</h1>
        <div className="self-stretch bg-slate-400 w-px" />
        <h2 className="text-sm">This page could not be found.</h2>
      </div>
    </div>
  );
}
