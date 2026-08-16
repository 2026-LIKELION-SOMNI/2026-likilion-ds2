import { useLocation, useNavigate } from "react-router-dom";

import homeIcon from "../../assets/icons/home-house.svg";
import homeActiveIcon from "../../assets/icons/home-house-active.svg";

import soundIcon from "../../assets/icons/home-sound.svg";
import soundActiveIcon from "../../assets/icons/home-sound-active.svg";

import statsIcon from "../../assets/icons/home-graph.svg";
import statsActiveIcon from "../../assets/icons/home-graph-active.svg";

import myIcon from "../../assets/icons/home-moon.svg";
import myActiveIcon from "../../assets/icons/home-moon-active.svg";

const NAV_ITEMS = [
  {
    label: "홈",
    path: "/",
    icon: homeIcon,
    activeIcon: homeActiveIcon,
  },
  {
    label: "사운드",
    path: "/sound",
    icon: soundIcon,
    activeIcon: soundActiveIcon,
  },
  {
    label: "통계",
    path: "/statistics",
    icon: statsIcon,
    activeIcon: statsActiveIcon,
  },
  {
    label: "마이",
    path: "/my",
    icon: myIcon,
    activeIcon: myActiveIcon,
  },
];

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

return (
  <nav
    className="
      fixed
      bottom-0
      left-1/2
      z-50
      flex
      w-full
      max-w-[480px]
      -translate-x-1/2
      items-center
      justify-center
      gap-[48px]
      border-t border-[#24464E]
      bg-[#071114]
      px-[24px]
      py-[8px]
    "
  >
    {NAV_ITEMS.map((item) => {
      const isActive =
        item.path === "/"
          ? location.pathname === "/"
          : location.pathname === item.path ||
            location.pathname.startsWith(
              `${item.path}/`,
            );

      return (
        <button
          key={item.path}
          type="button"
          onClick={() => navigate(item.path)}
          className="
            flex
            w-[52px]
            shrink-0
            flex-col
            items-center
            gap-[6px]
          "
        >
          <img
            src={isActive ? item.activeIcon : item.icon}
            alt=""
            aria-hidden="true"
            className="h-[24px] w-[24px]"
          />

          <span
            className={`
              whitespace-nowrap
              text-[11px]
              font-medium
              leading-normal
              ${
                isActive
                  ? "text-[#61DBB8]"
                  : "text-[#809EA8]"
              }
            `}
          >
            {item.label}
          </span>
        </button>
      );
    })}
  </nav>
);
}

export default BottomNav;