import Link from "next/link";
import { mediaLab } from "@/lib/media-lab-service";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const topNav = mediaLab.getTopNavigationItems();

  return (
    <div className="min-h-screen bg-[var(--light-gray)] text-[var(--black)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden bg-[var(--light-gray)]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[72px] items-center justify-between border-b border-[var(--navy-blue)] bg-[var(--white)] px-8">
            <div className="flex items-center gap-10">
              <Link href="/" className="brand-heading text-3xl font-extrabold tracking-tight text-[var(--navy-blue)]">
                MEDIA LAB
              </Link>
              <nav className="hidden items-center gap-6 text-sm font-bold uppercase tracking-wide text-[var(--slate-blue)] lg:flex">
                {topNav.map((item) => (
                  <Link key={item.label} href={item.href} className="hover:text-[var(--flame)]">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden h-10 w-72 items-center gap-3 border border-[var(--silver)] bg-[var(--white)] px-4 text-sm font-bold uppercase tracking-wide text-[var(--slate-blue)] md:flex">
                <span aria-hidden="true">Search</span>
                <span>Find assets...</span>
              </div>
              <div className="relative grid h-10 w-10 place-items-center border border-[var(--navy-blue)] text-sm font-bold text-[var(--navy-blue)]">
                !
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center bg-[var(--flame)] px-1 text-[11px] font-bold text-white">
                  3
                </span>
              </div>
              <div className="grid h-10 w-10 place-items-center bg-[var(--navy-blue)] text-sm font-bold text-white">
                AS
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-[var(--light-gray)] px-8 py-7">
            <div className="mx-auto max-w-[1024px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
