import { Navigate } from "react-router-dom";

import StartPage from "../pages/onboarding/StartPage";
import HomePage from "../pages/home/HomePage";

export function RootPage() {
  const onboardingCompleted =
    localStorage.getItem(
      "somni-onboarding-completed",
    ) === "true";

  if (!onboardingCompleted) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    );
  }

  return <HomePage />;
}

export function OnboardingStartPage() {
  const onboardingCompleted =
    localStorage.getItem(
      "somni-onboarding-completed",
    ) === "true";

  if (onboardingCompleted) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <StartPage />;
}