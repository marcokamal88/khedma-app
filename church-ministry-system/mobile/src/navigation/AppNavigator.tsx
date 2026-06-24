import React from 'react';
import { useActiveContext } from '../hooks/useActiveContext';
import ServantStack from './stacks/ServantStack';
import ServedMemberStack from './stacks/ServedMemberStack';
import ParentStack from './stacks/ParentStack';
import LeaderStack from './stacks/LeaderStack';

export default function AppNavigator() {
  const { role, isServant, isLeader, isPriest, isParent } = useActiveContext();

  if (isLeader) {
    return <LeaderStack />;
  }

  if (isServant) {
    return <ServantStack />;
  }

  if (isParent) {
    return <ParentStack />;
  }

  return <ServedMemberStack />;
}
