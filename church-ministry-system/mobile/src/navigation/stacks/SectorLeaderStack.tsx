import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocale } from "../../hooks/useLocale";
import SectorLeaderDashboard from "../../screens/sector-leader/DashboardScreen";
import ReportsScreen from "../../screens/leader/ReportsScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import FollowUpStack from "./FollowUpStack";
import AchievementsScreen from "../../screens/achievements/AchievementsScreen";
import CustomTabBar from "../CustomTabBar";

const Tab = createBottomTabNavigator();

function EmptyScreen() { return <View />; }

export default function SectorLeaderStack() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={SectorLeaderDashboard} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: t('tabs.reports') }} />
      <Tab.Screen name="FollowUp" component={FollowUpStack} options={{ title: t("followUp.title") }} />
      <Tab.Screen name="SwitchContext" component={EmptyScreen} options={{ title: t('tabs.more') }} />

      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="Achievements" component={AchievementsScreen} options={{ title: t("achievements.title"), tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}
