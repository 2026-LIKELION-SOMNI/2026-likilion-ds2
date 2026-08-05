function AppHeader() {
  return (
    <header
      className="
        safe-area-top
        flex
        min-h-14
        items-end
        justify-between
        border-b
        border-border
        bg-surface
        px-5
        pb-3
      "
    >
      <h1 className="text-xl font-bold text-text-primary">Somni</h1>

      <button
        type="button"
        aria-label="알림 열기"
        className="
          flex
          size-10
          items-center
          justify-center
          rounded-full
          hover:bg-background
        "
      >
        알림
      </button>
    </header>
  );
}

export default AppHeader;
