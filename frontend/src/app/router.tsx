import { createBrowserRouter, Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import OnboardingLayout from "../layouts/OnboardingLayout";

import StartPage from "../pages/onboarding/StartPage";
import SafetyGuidePage from "../pages/onboarding/SafetyGuidePage";
import HomePage from "../pages/home/HomePage";
import CheckInPage from "../pages/check-in/CheckInPage";
import FrequencyPage from "../pages/frequency/FrequencyPage";
import NatureSoundPage from "../pages/nature-sound/NatureSoundPage";
import SoundSetupPage from "../pages/sound-setup/SoundSetupPage";
import RecoverySessionPage from "../pages/recovery-session/RecoverySessionPage";
import SoundPage from "../pages/sound/SoundPage";
import MySoundPage from "../pages/sound/MySoundPage";
import ChangeNatureSoundPage from "../pages/sound/ChangeNatureSoundPage";
import MyPage from "../pages/my/MyPage";
import NotificationSettingsPage from "../pages/my/NotificationSettingsPage";
import SoundProfilePage from "../pages/my/SoundProfilePage";
import ConnectedDataPage from "../pages/my/ConnectedDataPage";
import DataDeleteCompletePage from "../pages/my/DataDeleteCompletePage";
import AISoundFitPage from "../pages/sound-fit/AISoundFitPage";
import NatureChangedSoundFitPage from "../pages/sound-fit/NatureChangedSoundFitPage";
import RoutineReadyPage from "../pages/routine/RoutineReadyPage";
import MixingPointPage from "../pages/sound-setup/MixingPointPage";
import MySoundsPage from "../pages/my/MySoundsPage";


const router = createBrowserRouter([
  {
    element: <OnboardingLayout />,
    children: [
      {
        path: "/onboarding",
        element: <StartPage />,
      },
      {
        path: "/onboarding/safety",
        element: <SafetyGuidePage />,
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
      {
        path: "/my",
        element: <MyPage />,
      },
      {
        path: "/my/notifications",
        element: <NotificationSettingsPage />,
      },
      {
        path: "/my/sound-profile",
        element: <SoundProfilePage />,
      },
      {
        path: "/my/connected-data",
        element: <ConnectedDataPage />,
      },
      {
        path: "/my/delete-complete",
        element: <DataDeleteCompletePage />,
      },
      {
        path: "/my/sounds",
        element: <MySoundsPage />,
      },
      {
        path: "/sound-fit",
        element: <AISoundFitPage />,
      },
      {
        path: "/sound-fit/nature-changed",
        element: <NatureChangedSoundFitPage />,
      },{
        path: "/routine-ready",
        element: <RoutineReadyPage />,
      },
      {
        path: "/mixing-point",
        element: <MixingPointPage />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;