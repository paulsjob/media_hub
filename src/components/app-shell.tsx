import Link from "next/link";
import { mediaLab } from "@/lib/media-lab-service";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const topNav = mediaLab.getTopNavigationItems();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-8">
            <div className="flex items-center gap-10">
              <Link href="/" className="text-2xl font-semibold tracking-tight text-[#06153a]">
                MEDIA LAB
              </Link>
              <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 lg:flex">
                {topNav.map((item) => (
                  <Link key={item.label} href={item.href} className="hover:text-[#06153a]">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden h-10 w-72 items-center gap-3 rounded-md border border-slate-300 bg-white px-4 text-sm text-slate-500 md:flex">
                <span aria-hidden="true">Search</span>
                <span>Search Media Lab...</span>
              </div>
              <div className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-sm text-[#06153a]">
                !
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#e64a19] px-1 text-[11px] font-semibold text-white">
                  3
                </span>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#06153a] text-sm font-semibold text-white">
                AS
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-slate-50 px-8 py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}
