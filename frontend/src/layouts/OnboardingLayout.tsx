import { Outlet } from "react-router-dom";

function OnboardingLayout() {
  return (
    <div
      className="
        app-container
        h-dvh
        w-full
        max-w-[480px]

        md:h-[calc(100dvh-2rem)]
      "
    >
      <main
        className="
          safe-area-top
          safe-area-bottom
          hide-scrollbar
          row-start-2
          h-full
          overflow-y-auto
          overscroll-y-contain
        "
      >
        <Outlet />
      </main>
    </div>
  );
}

export default OnboardingLayout;
