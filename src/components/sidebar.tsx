"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mediaLab } from "@/lib/media-lab-service";
import { NavItem } from "./ui";

export function Sidebar() {
  const pathname = usePathname();
  const navItems = mediaLab.getNavigationItems();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-[var(--navy-blue)] p-5 text-white lg:flex">
      <Link
        href="/generate"
        className="mb-7 grid h-11 w-11 place-items-center border border-white text-sm font-extrabold transition hover:bg-white hover:text-[var(--navy-blue)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--flame)]"
      >
        ML
      </Link>
      <Link
        href="/generate"
        className="mb-6 flex h-11 items-center justify-center gap-2 border border-[var(--flame)] bg-[var(--flame)] px-4 text-sm font-bold uppercase tracking-wide !text-white transition hover:border-white hover:bg-[var(--navy-blue)] hover:!text-white active:bg-[var(--navy-blue)] active:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--flame)]"
        style={{ color: "#ffffff" }}
      >
        <span className="text-lg text-white" aria-hidden="true">
          +
        </span>
        New Graphic
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              count={item.count}
            />
          );
        })}
      </nav>
      <div className="border border-white/25 p-4 text-xs font-bold uppercase tracking-wide text-white/70">
        <p className="mb-1 text-white">Media Lab Lite.</p>
        <p>Generate graphics fast.</p>
      </div>
    </aside>
  );
}
