import { NavLink } from "react-router-dom";

const navigationItems = [
  {
    label: "홈",
    path: "/",
  },
  {
    label: "기록",
    path: "/records",
  },
  {
    label: "인사이트",
    path: "/insights",
  },
  {
    label: "설정",
    path: "/settings",
  },
] as const;

function BottomNavigation() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="
        safe-area-bottom
        grid
        grid-cols-4
        border-t
        border-border
        bg-white/95
        px-2
        pt-2
        backdrop-blur-md
      "
    >
      {navigationItems.map(({ label, path }) => (
        <NavLink
          key={path}
          to={path}
          end={path === "/"}
          className={({ isActive }) =>
            `
              flex
              min-h-12
              flex-col
              items-center
              justify-center
              gap-1
              rounded-xl
              text-xs
              font-medium
              transition-colors
              ${
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-text-secondary"
              }
            `
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNavigation;
