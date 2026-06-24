import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const useActiveContext = () => {
  const activeContext = useSelector((state: RootState) => state.auth.activeContext);
  const roles = useSelector((state: RootState) => state.auth.roles);

  return useMemo(() => {
    const role = activeContext?.role || 'served_member';
    const isServant = role === 'servant' || roles.includes('servant');
    const isClassLeader = role === 'class_leader' || roles.includes('class_leader');
    const isAsstServiceLeader = role === 'assistant_service_leader' || roles.includes('assistant_service_leader');
    const isServiceLeader = role === 'service_leader' || roles.includes('service_leader');
    const isSectorLeader = role === 'sector_leader' || roles.includes('sector_leader');
    const isPriest = role === 'priest' || roles.includes('priest');
    const isParent = role === 'parent' || roles.includes('parent');
    const isServedMember = role === 'served_member' || roles.includes('served_member');
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
  }, [activeContext, roles]);
};
