import React from 'react';
import { useActiveContext } from '../hooks/useActiveContext';
import ServantStack from './stacks/ServantStack';
import ServiceLeaderStack from './stacks/ServiceLeaderStack';
import SectorLeaderStack from './stacks/SectorLeaderStack';
import PriestStack from './stacks/PriestStack';
import ServedMemberStack from './stacks/ServedMemberStack';
import ParentStack from './stacks/ParentStack';

export default function AppNavigator() {
  const { role, isServant, isClassLeader, isServiceLeader, isAsstServiceLeader, isSectorLeader, isPriest, isParent } = useActiveContext();

  if (isServant || isClassLeader) {
    return <ServantStack />;
  }

  if (isServiceLeader || isAsstServiceLeader) {
    return <ServiceLeaderStack />;
  }

  if (isSectorLeader) {
    return <SectorLeaderStack />;
  }

  if (isPriest) {
    return <PriestStack />;
  }

  if (isParent) {
    return <ParentStack />;
  }

  return <ServedMemberStack />;
}
