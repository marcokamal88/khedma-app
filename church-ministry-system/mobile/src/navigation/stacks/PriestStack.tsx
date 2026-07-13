import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocale } from "../../hooks/useLocale";
import PriestDashboard from "../../screens/priest/DashboardScreen";
import ReportsScreen from "../../screens/leader/ReportsScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import CustomTabBar from "../CustomTabBar";

const Tab = createBottomTabNavigator();

function EmptyScreen() { return <View />; }

export default function PriestStack() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={PriestDashboard} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: t('tabs.reports') }} />
      <Tab.Screen name="SwitchContext" component={EmptyScreen} options={{ title: t('tabs.more') }} />

      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}
