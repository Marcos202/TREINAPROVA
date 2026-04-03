// ── Focus Mode Layout ────────────────────────────────────────────────────────
//
// The parent [tenant]/layout.tsx always renders the Sidebar (z-50) and the
// main content wrapper (lg:ml-80). To achieve "focus mode" (full-screen player)
// without touching the parent layout, this nested layout renders a fixed overlay
// at z-[60] that covers the entire viewport, including the sidebar.
//
// On exit, router.back() / href restores the normal layout automatically.
// ────────────────────────────────────────────────────────────────────────────

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{ background: '#F4F7FE' }}
    >
      {children}
    </div>
  );
}
