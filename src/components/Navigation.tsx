import {
  IconArchive,
  IconMenu2,
  IconMoon,
  IconSearch,
  IconSun,
} from "@tabler/icons-react";
import LinkButton from "./LinkButton";
import { useState, type ReactNode } from "react";

interface NavigationProps {
  active?: string;
}

export default function Navigation({ active }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="flex grow items-center justify-end">
      <button className="sm:hidden" onClick={() => setIsOpen(!isOpen)}>
        <IconMenu2 />
      </button>
      <ul className={`${isOpen ? "active" : "inactive"} menu absolute z-50 flex flex-col sm:flex-row sm:static items-center gap-6 font-mono py-6 sm:py-0 top-24  bg-theme-fill left-0 right-0 transition-all overflow-hidden`}>
        <NavigationItem href="posts" active={active}>
          Posts
        </NavigationItem>
        <NavigationItem href="projects" active={active}>
          Projects
        </NavigationItem>
        <NavigationItem href="tags" active={active}>
          Tags
        </NavigationItem>
        <NavigationItem href="about" active={active}>
          About
        </NavigationItem>
        <NavigationItem href="archives" active={active} className="gap-1">
          <IconArchive />
          <span className="sm:hidden">Archive</span>
        </NavigationItem>
        <li>
          <LinkButton
            href="/search/"
            className={`focus-outline p-3 sm:p-1 ${active === "search" ? "active" : ""
              } flex`}
            title="Search"
          >
            <IconSearch fill="red" fillOpacity={0} />
            <span className="sm:hidden">Search</span>
          </LinkButton>
        </li>
        <li>
          <button
            id="theme-btn"
            className="focus-outline inline-flex items-center"
            title="Toggles light & dark"
            aria-label="auto"
            aria-live="polite"
          >
            <IconMoon id="moon-svg" />
            <IconSun id="sun-svg" />
            <span className="sm:hidden">Theme</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

interface NavigationItemProps {
  active?: string;
  href: string;
  children: ReactNode;
  className?: string;
}

function NavigationItem({
  active,
  href,
  children,
  className,
}: NavigationItemProps) {
  return (
    <li className={`inline-flex items-center ${active === href ? "active" : ""}`}>
      <a
        href={`/${href}/`}
        className={`inline-flex items-center ${className}`}
      >
        {children}
      </a>
    </li>
  );
}
