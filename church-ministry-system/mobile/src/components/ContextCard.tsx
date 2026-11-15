import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
} from 'react-native';
import { useLocale } from '../hooks/useLocale';
import { useAuth } from '../hooks/useAuth';
import { typography, shadows } from '../theme';

const NAVY = '#192f5f';
const GOLD = '#d4a843';
const CREAM = '#f7f4ed';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';
const OFF_WHITE = '#fcfbf8';
const BORDER = '#eceae4';

const roleToLocaleKey = (role: string) =>
  role.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

interface ContextCardProps {
  defaultRole?: string;
}

export default function ContextCard({
  defaultRole = 'servant',
}: ContextCardProps) {
  const { t } = useLocale();
  const { activeContext, contexts, switchContext } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <View style={styles.body}>
          <View style={styles.info}>
            <Text style={styles.role}>
              {t(`roles.${roleToLocaleKey(activeContext?.role || defaultRole)}`)}
            </Text>
            {activeContext?.displayLabel ? (
              <Text style={styles.detail} numberOfLines={1}>
                {activeContext.displayLabel}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.switchBtn} activeOpacity={0.7} onPress={() => setShowModal(true)}>
            <Text style={styles.switchIcon}>{'\u21C4'}</Text>
            <Text style={styles.switchLabel}>{t('home.switch')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('home.switch')}</Text>
            {contexts.length === 0 ? (
              <Text style={styles.modalEmpty}>{t('app.noData')}</Text>
            ) : (
              contexts.map((ctx: any, i: number) => {
                const isActive = ctx.role === activeContext?.role &&
                  JSON.stringify(ctx.scope || {}) === JSON.stringify(activeContext?.scope || {});
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.option, isActive && styles.optionActive]}
                    activeOpacity={0.7}
                    onPress={async () => {
                      if (isActive) { setShowModal(false); return; }
                      try {
                        await switchContext({ role: ctx.role, scope: ctx.scope });
                        setShowModal(false);
                      } catch {}
                    }}
                  >
                    <Text style={[styles.optionRole, isActive && styles.optionTextActive]}>
                      {t(`roles.${roleToLocaleKey(ctx.role)}`) || ctx.role}
                    </Text>
                    {ctx.displayLabel ? (
                      <Text style={[styles.optionService, isActive && styles.optionTextActive]}>
                        {ctx.displayLabel}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', padding: 14,
  },
  body: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  info: { flex: 1, marginRight: 10 },
  role: { ...typography.cardTitle, color: '#ffffff', fontWeight: '700' },
  detail: { ...typography.caption, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: GOLD,
    borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7,
  },
  switchIcon: { fontSize: 13, color: CHARCOAL, marginRight: 4 },
  switchLabel: { ...typography.buttonSmall, color: CHARCOAL, fontWeight: '700' },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
    alignItems: 'center', padding: 24,
  },
  modalContent: {
    width: '100%', maxWidth: 400, maxHeight: '70%', backgroundColor: OFF_WHITE,
    borderRadius: 20, padding: 24, ...shadows.card,
  },
  modalTitle: { ...typography.sectionHeading, color: CHARCOAL, marginBottom: 16, textAlign: 'center' },
  modalEmpty: { ...typography.body, color: MUTED, textAlign: 'center', paddingVertical: 20 },
  option: {
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: BORDER,
  },
  optionActive: { backgroundColor: NAVY, borderColor: NAVY },
  optionRole: { ...typography.cardTitle, color: CHARCOAL },
  optionService: { ...typography.body, color: MUTED, marginTop: 2 },
  optionTextActive: { color: '#ffffff' },
});
