import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocale } from "../../hooks/useLocale";
import ServedMemberDashboard from "../../screens/served-member/DashboardScreen";
import TasksScreen from "../../screens/served-member/TasksScreen";
import TaioBalanceScreen from "../../screens/served-member/TaioBalanceScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import StoreScreen from "../../screens/shared/StoreScreen";
import CustomTabBar from "../CustomTabBar";

const Tab = createBottomTabNavigator();

function EmptyScreen() { return <View />; }

export default function ServedMemberStack() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={ServedMemberDashboard} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Taiao" component={TaioBalanceScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
      <Tab.Screen name="SwitchContext" component={EmptyScreen} options={{ title: t('tabs.more') }} />

      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}
