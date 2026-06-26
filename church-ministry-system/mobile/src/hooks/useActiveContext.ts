import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const useActiveContext = () => {
  const activeContext = useSelector((state: RootState) => state.auth.activeContext);

  return useMemo(() => {
    const role = activeContext?.role || 'served_member';
    const isServant = role === 'servant';
    const isClassLeader = role === 'class_leader';
    const isAsstServiceLeader = role === 'assistant_service_leader';
    const isServiceLeader = role === 'service_leader';
    const isSectorLeader = role === 'sector_leader';
    const isPriest = role === 'priest';
    const isParent = role === 'parent';
    const isServedMember = role === 'served_member';
    const isLeader = isPriest || isSectorLeader || isServiceLeader || isAsstServiceLeader || isClassLeader;

    return {
      role,
      serviceId: activeContext?.serviceId,
      classId: activeContext?.classId,
      isServant,
      isClassLeader,
      isAsstServiceLeader,
      isServiceLeader,
      isSectorLeader,
      isLeader,
      isPriest,
      isParent,
      isServedMember,
    };
  }, [activeContext]);
};
