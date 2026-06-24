import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocale } from "../../hooks/useLocale";
import ServantDashboard from "../../screens/servant/DashboardScreen";
import AttendanceScreen from "../../screens/servant/AttendanceScreen";
import PreparationScreen from "../../screens/servant/PreparationScreen";
import TasksScreen from "../../screens/servant/TasksScreen";
import TaioAwardScreen from "../../screens/servant/TaioAwardScreen";
import ContextSwitcherScreen from "../../screens/auth/ContextSwitcherScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import FollowUpStack from "./FollowUpStack";
import LessonLibraryScreen from "../../screens/lesson-library/LessonLibraryScreen";
import AchievementsScreen from "../../screens/achievements/AchievementsScreen";
import CustomTabBar from "../CustomTabBar";

const Tab = createBottomTabNavigator();

export default function ServantStack() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBar: (props) => <CustomTabBar {...props} />,
      }}
    >
      <Tab.Screen name="Dashboard" component={ServantDashboard} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} />
      <Tab.Screen name="Preparations" component={PreparationScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Taiao" component={TaioAwardScreen} />
      <Tab.Screen
        name="FollowUp"
        component={FollowUpStack}
        options={{ title: t("followUp.title") }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: t("achievements.title") }}
      />
      <Tab.Screen
        name="Library"
        component={LessonLibraryScreen}
        options={{ title: t("tabs.library") }}
      />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="SwitchContext" component={ContextSwitcherScreen} />
    </Tab.Navigator>
  );
}
