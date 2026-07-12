import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const NAVY = '#192f5f';
const GOLD = '#d4a843';
const CREAM = '#f7f4ed';
const OFF_WHITE = '#fcfbf8';
const BORDER = '#eceae4';
const CHARCOAL = '#1c1c1c';
const MUTED = '#5f5f5d';

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (dateStr: string) => void;
  initialDate?: string;
}

export default function CalendarPicker({ visible, onClose, onSelect, initialDate }: Props) {
  const today = new Date();
  const init = initialDate ? new Date(initialDate) : today;

  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const [day, setDay] = useState(init.getDate());

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const firstDayOfWeek = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  const handlePrevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setDay(1);
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setDay(1);
  };

  const handleSelect = () => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSelect(`${year}-${mm}-${dd}`);
    onClose();
  };

  const years: number[] = [];
  for (let y = today.getFullYear() - 50; y <= today.getFullYear(); y++) {
    years.push(y);
  }

  const dayGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    dayGrid.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    dayGrid.push(d);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7}>
              <Text style={styles.arrow}>{'\u276E'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7}>
              <Text style={styles.arrow}>{'\u276F'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map((w, i) => (
              <Text key={i} style={styles.weekLabel}>{w}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {dayGrid.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayCell,
                  d === day && styles.dayCellActive,
                  d === null && styles.dayCellEmpty,
                ]}
                onPress={() => d !== null && setDay(d)}
                disabled={d === null}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayText, d === day && styles.dayTextActive]}>
                  {d || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleSelect} activeOpacity={0.7}>
              <Text style={styles.confirmText}>تأكيد</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '85%',
    maxWidth: 340,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  arrow: { fontSize: 22, color: NAVY, paddingHorizontal: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: CHARCOAL },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekLabel: { fontSize: 12, color: MUTED, fontWeight: '600', width: 36, textAlign: 'center' },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  dayCellActive: { backgroundColor: NAVY },
  dayCellEmpty: { backgroundColor: 'transparent' },
  dayText: { fontSize: 14, color: CHARCOAL },
  dayTextActive: { color: '#ffffff', fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CREAM,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: MUTED, fontWeight: '600' },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: NAVY,
    alignItems: 'center',
  },
  confirmText: { fontSize: 14, color: '#ffffff', fontWeight: '700' },
});
