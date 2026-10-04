import React, { useEffect } from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import AuthStack from "./AuthStack";
import AppNavigator from "./AppNavigator";
import GlobalDrawer from "../components/GlobalDrawer";
import { usePushNotifications } from "../hooks/usePushNotifications";

function PushNotificationsSetup() {
  usePushNotifications();
  return null;
}

function InnerNavigator({ token, needsContextSelection }: { token: string | null; needsContextSelection: boolean }) {
  const navigationRef = createNavigationContainerRef();

  const renderNavigator = () => {
    if (!token) {
      return <AuthStack key="auth-stack" initialRoute="Login" />;
    }

    if (needsContextSelection) {
      return <AuthStack key="context-switcher" initialRoute="ContextSwitcher" />;
    }

    return (
      <GlobalDrawer navigationRef={navigationRef}>
        <AppNavigator />
      </GlobalDrawer>
    );
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <PushNotificationsSetup />
      {renderNavigator()}
    </NavigationContainer>
  );
}

export default function RootNavigator() {
  const { token, needsContextSelection } = useSelector((state: RootState) => state.auth);

  return <InnerNavigator token={token} needsContextSelection={needsContextSelection} />;
}