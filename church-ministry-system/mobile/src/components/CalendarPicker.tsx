import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
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

const WEEK_LABELS = ['س', 'ج', 'خ', 'ر', 'ث', 'ن', 'ح'];

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
  const [showYearPicker, setShowYearPicker] = useState(false);

  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);
  const firstDayOfWeek = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  const handlePrevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else { setMonth(month - 1); }
    setDay(1);
  };

  const handleNextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else { setMonth(month + 1); }
    setDay(1);
  };

  const handlePrevYear = () => setYear(year - 1);
  const handleNextYear = () => setYear(year + 1);

  const handleSelect = () => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSelect(`${year}-${mm}-${dd}`);
    onClose();
  };

  const yearList = useMemo(() => {
    const years: number[] = [];
    for (let y = today.getFullYear() - 60; y <= today.getFullYear() + 5; y++) {
      years.push(y);
    }
    return years;
  }, [today]);

  const dayGrid = useMemo(() => {
    const grid: (number | null)[] = [];
    const emptyBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < emptyBefore; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [firstDayOfWeek, daysInMonth]);

  const rows: (number | null)[][] = useMemo(() => {
    const r: (number | null)[][] = [];
    for (let i = 0; i < dayGrid.length; i += 7) {
      r.push(dayGrid.slice(i, i + 7).reverse());
    }
    return r;
  }, [dayGrid]);

  if (showYearPicker) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر السنة</Text>
            </View>
            <FlatList
              data={yearList}
              keyExtractor={(item) => String(item)}
              style={styles.yearList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.yearItem, item === year && styles.yearItemActive]}
                  onPress={() => { setYear(item); setShowYearPicker(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.yearText, item === year && styles.yearTextActive]}>{item}</Text>
                </TouchableOpacity>
              )}
              initialScrollIndex={yearList.indexOf(year)}
              getItemLayout={(_, index) => ({ length: 48, offset: 48 * index, index })}
            />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handlePrevYear} activeOpacity={0.7}>
                <Text style={styles.arrow}>{'\u276E\u276E'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrevMonth} activeOpacity={0.7}>
                <Text style={styles.arrow}>{'\u276E'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setShowYearPicker(true)} activeOpacity={0.7}>
              <Text style={styles.headerTitle}>{MONTHS[month]} {year}</Text>
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleNextMonth} activeOpacity={0.7}>
                <Text style={styles.arrow}>{'\u276F'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNextYear} activeOpacity={0.7}>
                <Text style={styles.arrow}>{'\u276F\u276F'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekRow}>
            {WEEK_LABELS.map((w, i) => (
              <Text key={i} style={styles.weekLabel}>{w}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {rows.map((row, ri) => (
              <View key={ri} style={styles.dayRow}>
                {row.map((d, di) => (
                  <TouchableOpacity
                    key={di}
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row-reverse', gap: 4 },
  headerRight: { flexDirection: 'row-reverse', gap: 4 },
  arrow: { fontSize: 18, color: NAVY, paddingHorizontal: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: CHARCOAL },
  weekRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekLabel: { fontSize: 12, color: MUTED, fontWeight: '600', width: 36, textAlign: 'center' },
  daysGrid: {},
  dayRow: {
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
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
  modalHeader: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: CHARCOAL },
  yearList: { maxHeight: 300 },
  yearItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  yearItemActive: { backgroundColor: NAVY },
  yearText: { fontSize: 16, color: CHARCOAL },
  yearTextActive: { color: '#ffffff', fontWeight: '700' },
});
