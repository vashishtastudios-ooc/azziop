export function MarketingPageBackdrop() {
  return (
    <>
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none marketing-dot-grid"
        aria-hidden
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[radial-gradient(ellipse,rgba(250,212,0,0.14)_0%,transparent_70%)] pointer-events-none"
        aria-hidden
      />
    </>
  );
}
