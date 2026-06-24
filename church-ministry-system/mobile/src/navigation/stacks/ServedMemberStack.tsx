import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocale } from "../../hooks/useLocale";
import ServedMemberDashboard from "../../screens/served-member/DashboardScreen";
import TasksScreen from "../../screens/served-member/TasksScreen";
import TaioBalanceScreen from "../../screens/served-member/TaioBalanceScreen";
import ContextSwitcherScreen from "../../screens/auth/ContextSwitcherScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import StoreScreen from "../../screens/shared/StoreScreen";
import CustomTabBar from "../CustomTabBar";

const Tab = createBottomTabNavigator();

export default function ServedMemberStack() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBar: (props) => <CustomTabBar {...props} />,
      }}
    >
      <Tab.Screen name="Dashboard" component={ServedMemberDashboard} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Taiao" component={TaioBalanceScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="SwitchContext" component={ContextSwitcherScreen} />
    </Tab.Navigator>
  );
}
