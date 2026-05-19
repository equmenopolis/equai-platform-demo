"use client";

import { Box } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const Header = () => {
  const pathname = usePathname();

  const title = useMemo(() => {
    return pathname
      .replace(/^\//, "")
      .replace(/(^|-)([a-z])/g, (_, __, c) => ` ${c.toUpperCase()}`)
      .trim();
  }, [pathname]);

  return (
    <>
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex w-[95%] items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <Box className="h-7 w-7 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              SkillBoost Academy
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Equ AI Platform
            </Link>
          </nav>
        </div>
      </header>
      {title && (
        <div className="mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
      )}
    </>
  );
};

export default Header;
