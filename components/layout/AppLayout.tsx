import AppSidebar from "./AppSideBar"
import Topbar from "./Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <AppSidebar />

      <div className="flex-1">
        <Topbar />

        <main className="p-6 bg-slate-100 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}