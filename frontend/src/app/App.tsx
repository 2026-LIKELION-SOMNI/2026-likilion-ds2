import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";

import router from "./router";
import { ensureAnonymousUser } from "../services/accountService";

function App() {
  useEffect(() => {
    const initializeUser = async () => {
      try {
        await ensureAnonymousUser();
      } catch (error) {
        console.error(
          "익명 사용자 초기화 실패",
          error,
        );
      }
    };

    initializeUser();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;