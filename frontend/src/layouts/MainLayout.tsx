import { Outlet } from "react-router-dom";

import Header from "../components/navigation/Header";

function MainLayout() {
  return (
    <div
      className="
        app-container
        grid
        h-dvh
        w-full
        max-w-[480px]
        grid-rows-[auto_minmax(0,1fr)]

        md:h-[calc(100dvh-2rem)]
      "
    >
      <Header />

      <main className="min-h-0 overflow-y-auto overscroll-y-contain">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
