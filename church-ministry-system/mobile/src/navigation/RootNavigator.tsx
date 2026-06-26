import React from "react";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import AuthStack from "./AuthStack";
import AppNavigator from "./AppNavigator";
import GlobalDrawer from "../components/GlobalDrawer";

export default function RootNavigator() {
  const { token, needsContextSelection } = useSelector((state: RootState) => state.auth);
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
      {renderNavigator()}
    </NavigationContainer>
  );
}
