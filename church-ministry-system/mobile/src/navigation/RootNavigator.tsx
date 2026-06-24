import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import AuthStack from "./AuthStack";
import AppNavigator from "./AppNavigator";

export default function RootNavigator() {
  const token = useSelector((state: RootState) => state.auth.token);

  return (
    <NavigationContainer>
      {token ? <AppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
