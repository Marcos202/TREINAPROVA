import PublicHeader from './_components/PublicHeader';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
