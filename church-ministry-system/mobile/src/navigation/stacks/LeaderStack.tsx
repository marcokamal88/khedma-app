import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useLocale } from "../../hooks/useLocale";
import PreparationsReviewScreen from "../../screens/leader/PreparationsReviewScreen";
import ReportsScreen from "../../screens/leader/ReportsScreen";
import ContextSwitcherScreen from "../../screens/auth/ContextSwitcherScreen";
import NotificationsScreen from "../../screens/shared/NotificationsScreen";
import FollowUpStack from "./FollowUpStack";
import AchievementsScreen from "../../screens/achievements/AchievementsScreen";
import CustomTabBar from "../CustomTabBar";

const Tab = createBottomTabNavigator();

export default function LeaderStack() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBar: (props) => <CustomTabBar {...props} />,
      }}
    >
      <Tab.Screen name="Reviews" component={PreparationsReviewScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
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
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="SwitchContext" component={ContextSwitcherScreen} />
    </Tab.Navigator>
  );
}
