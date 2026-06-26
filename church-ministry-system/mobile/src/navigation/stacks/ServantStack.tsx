import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocale } from "../../hooks/useLocale";
import ServantDashboard from "../../screens/servant/DashboardScreen";
import AttendanceScreen from "../../screens/servant/AttendanceScreen";
import PreparationScreen from "../../screens/servant/PreparationScreen";
import TasksScreen from "../../screens/servant/TasksScreen";
import TaioAwardScreen from "../../screens/servant/TaioAwardScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import FollowUpStack from "./FollowUpStack";
import LessonLibraryScreen from "../../screens/lesson-library/LessonLibraryScreen";
import AchievementsScreen from "../../screens/achievements/AchievementsScreen";
import CustomTabBar from "../CustomTabBar";

const Tab = createBottomTabNavigator();

function EmptyScreen() { return <View />; }

export default function ServantStack() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Visible tabs */}
      <Tab.Screen name="Dashboard" component={ServantDashboard} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Taiao" component={TaioAwardScreen} options={{ title: t('tabs.taio') }} />
      <Tab.Screen name="SwitchContext" component={EmptyScreen} options={{ title: t('tabs.more') }} />

      {/* Hidden tabs — navigable from the drawer */}
      <Tab.Screen name="Preparations" component={PreparationScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="FollowUp" component={FollowUpStack} options={{ title: t("followUp.title"), tabBarButton: () => null }} />
      <Tab.Screen name="Achievements" component={AchievementsScreen} options={{ title: t("achievements.title"), tabBarButton: () => null }} />
      <Tab.Screen name="Library" component={LessonLibraryScreen} options={{ title: t("tabs.library"), tabBarButton: () => null }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}
