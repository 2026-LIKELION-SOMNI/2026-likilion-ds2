import { createBrowserRouter, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import OnboardingLayout from "../layouts/OnboardingLayout";

import StartPage from "../pages/onboarding/StartPage";
import HomePage from "../pages/home/HomePage";
import CheckInPage from "../pages/check-in/CheckInPage";
import FrequencyPage from "../pages/frequency/FrequencyPage";
import NatureSoundPage from "../pages/nature-sound/NatureSoundPage";
import SoundSetupPage from "../pages/sound-setup/SoundSetupPage";
import RecoverySessionPage from "../pages/recovery-session/RecoverySessionPage";
import SoundPage from "../pages/sound/SoundPage";
import MySoundPage from "../pages/sound/MySoundPage";
import ChangeNatureSoundPage from "../pages/sound/ChangeNatureSoundPage";


const router = createBrowserRouter([
  {
    element: <OnboardingLayout />,
    children: [
      {
        path: "/onboarding",
        element: <StartPage />,
      },
    ],
  },

  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/check-in",
        element: <CheckInPage />,
      },
      {
        path: "/frequency",
        element: <FrequencyPage />,
      },
      {
        path: "/nature-sound",
        element: <NatureSoundPage />,
      },
      {
        path: "/sound-setup",
        element: <SoundSetupPage />,
      },
      {
        path: "/recovery-session",
        element: <RecoverySessionPage />,
      },
      {
        path: "/sound",
        element: <SoundPage />,
      },
      {
        path: "/sound/my-sound",
        element: <MySoundPage />,
      },
      {
        path: "/sound/change-nature",
        element: <ChangeNatureSoundPage />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;