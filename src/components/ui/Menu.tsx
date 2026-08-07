"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type MenuItem = {
  href: string;
  label: string;
};

export function Menu({
  items,
  label,
  className,
}: {
  items: MenuItem[];
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const hashItems = items.filter((item) => item.href.startsWith("#"));
    if (hashItems.length === 0) return;

    const handleScroll = () => {
      // Поріг перевірки — 150px від верху екрана (враховує sticky хедер)
      const scrollPosition = window.scrollY + 150;

      let currentActiveHash = hashItems[0].href;

      for (const item of hashItems) {
        const id = item.href.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top) {
            currentActiveHash = item.href;
          }
        }
      }

      setHash(currentActiveHash);
    };

    // Запускаємо перевірку одразу при завантаженні та додаємо слухач скролу
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [items]);

  return (
    <nav aria-label={label} className={cn("flex gap-2 overflow-x-auto", className)}>
      {items.map((item, index) => {
        const active = item.href.startsWith("#")
          ? hash
            ? hash === item.href
            : index === 0
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={() => {
              if (item.href.startsWith("#")) {
                setHash(item.href);
                const targetId = item.href.replace("#", "");
                const element = document.getElementById(targetId);
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }
            }}
            className={cn(
              "shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                : "text-muted-foreground hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default Menu;
