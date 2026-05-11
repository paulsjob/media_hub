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
              <Link href="/generate" className="brand-heading text-2xl font-extrabold tracking-tight text-[var(--navy-blue)]">
                Media Lab Lite
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
              <Link
                href="/generate"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-[var(--flame)] bg-[var(--flame)] px-4 text-sm font-bold !text-white transition hover:border-[var(--navy-blue)] hover:bg-[var(--navy-blue)]"
              >
                Generate Graphics
              </Link>
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
