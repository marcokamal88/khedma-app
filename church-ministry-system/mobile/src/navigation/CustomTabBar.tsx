import React from 'react';
import { AppTabBar } from '../components/ui';

const ROUTE_ICON_NAME: Record<string, string> = {
  Dashboard: 'dashboard',
  Attendance: 'calendar',
  Preparations: 'check-square',
  Tasks: 'tasks',
  Taiao: 'taio',
  FollowUp: 'followUp',
  Achievements: 'achievements',
  Library: 'library',
  Store: 'store',
  Notifications: 'notifications',
  SwitchContext: 'switchContext',
  Reviews: 'reviews',
  Reports: 'reports',
};

export default function CustomTabBar(props: any) {
  const tabs = props.state.routes.map((route: any) => {
    const options = props.descriptors[route.key].options;
    const label =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : (options.title as string) || route.name;

    return {
      key: route.name,
      label,
      icon: ROUTE_ICON_NAME[route.name] || 'default',
    };
  });

  const activeTab = props.state.routeNames[props.state.index];

  const handleTabChange = (routeName: string) => {
    const route = props.state.routes.find((item: any) => item.name === routeName);
    const event = props.navigation.emit({
      type: 'tabPress',
      target: route?.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented && route) {
      props.navigation.navigate(routeName);
    }
  };

  return <AppTabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />;
}
