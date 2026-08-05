export default function MainLayout() {
  return <div>MainLayout</div>;
}
import { Outlet } from "react-router-dom";

import AppHeader from "../components/navigation/AppHeader";
import BottomNavigation from "../components/navigation/BottomNavigation";

function MainLayout() {
  return (
    <div
      className="
        mx-auto
        grid
        h-dvh
        w-full
        max-w-[480px]
        grid-rows-[auto_minmax(0,1fr)_auto]
        overflow-hidden
        bg-surface
        md:border-x
        md:border-border
      "
    >
      <AppHeader />

      <main className="min-h-0 overflow-y-auto overscroll-y-contain px-5 py-6">
        <Outlet />
      </main>

      <BottomNavigation />
    </div>
  );
}

export default MainLayout;
