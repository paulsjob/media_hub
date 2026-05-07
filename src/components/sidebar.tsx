"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mediaLab } from "@/lib/media-lab-service";
import { NavItem } from "./ui";

export function Sidebar() {
  const pathname = usePathname();
  const navItems = mediaLab.getNavigationItems();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-[#06153a] p-5 text-white lg:flex">
      <Link
        href="/"
        className="mb-7 grid h-11 w-11 place-items-center rounded-md border border-white/40 text-sm font-semibold transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        ML
      </Link>
      <Link
        href="/intake"
        className="mb-6 flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold !text-white shadow-sm transition hover:bg-blue-700 hover:!text-white active:bg-blue-800 active:!text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
        style={{ color: "#ffffff" }}
      >
        <span className="text-lg text-white" aria-hidden="true">
          +
        </span>
        New Intake
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
      <div className="rounded-md border border-white/15 p-4 text-xs text-white/70">
        <p className="mb-1 font-semibold text-white">Need help?</p>
        <p>Visit the operator guide</p>
      </div>
    </aside>
  );
}
