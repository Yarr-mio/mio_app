import { ThemedText } from '@/components/themed/ThemedText';
import { TimePickerLabels } from '@/constants/notifications';
import { AppModalLayout, TimePickerLayout } from '@/constants/theme';
import { formatTimeHHMM, formatTimeUnit, parseTimeHHMM } from '@/utils/time';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);
const WHEEL_PADDING_COUNT = Math.floor(TimePickerLayout.wheelVisibleCount / 2);
const WHEEL_HEIGHT = TimePickerLayout.wheelItemHeight * TimePickerLayout.wheelVisibleCount;
const WHEEL_PADDING_HEIGHT = TimePickerLayout.wheelItemHeight * WHEEL_PADDING_COUNT;

interface TimeWheelColumnProps {
  values: number[];
  selectedValue: number;
  isActive: boolean;
  onValueChange: (value: number) => void;
}

function getWheelIndexFromOffset(offsetY: number, valuesLength: number): number {
  const index = Math.round(offsetY / TimePickerLayout.wheelItemHeight);
  return Math.min(Math.max(index, 0), valuesLength - 1);
}

function triggerTimePickerSelectionHaptic(): void {
  void Haptics.selectionAsync();
}

function TimeWheelColumn({ values, selectedValue, isActive, onValueChange }: TimeWheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lastHapticIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      lastHapticIndexRef.current = null;
      return;
    }

    const selectedIndex = values.indexOf(selectedValue);
    if (selectedIndex < 0) {
      return;
    }

    lastHapticIndexRef.current = selectedIndex;
    scrollRef.current?.scrollTo({
      y: selectedIndex * TimePickerLayout.wheelItemHeight,
      animated: false,
    });
  }, [isActive, selectedValue, values]);

  const handleScrollOffset = (offsetY: number, shouldUpdateValue: boolean) => {
    const clampedIndex = getWheelIndexFromOffset(offsetY, values.length);

    if (lastHapticIndexRef.current !== clampedIndex) {
      lastHapticIndexRef.current = clampedIndex;
      triggerTimePickerSelectionHaptic();
    }

    if (!shouldUpdateValue) {
      return;
    }

    onValueChange(values[clampedIndex]);
  };

  return (
    <View className="relative z-10 flex-1" style={{ height: WHEEL_HEIGHT }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={TimePickerLayout.wheelItemHeight}
        decelerationRate="fast"
        scrollEventThrottle={16}
        className="flex-1"
        style={{ height: WHEEL_HEIGHT }}
        contentContainerStyle={{ paddingVertical: WHEEL_PADDING_HEIGHT }}
        onScroll={(event) => handleScrollOffset(event.nativeEvent.contentOffset.y, false)}
        onScrollEndDrag={(event) => handleScrollOffset(event.nativeEvent.contentOffset.y, true)}
        onMomentumScrollEnd={(event) => handleScrollOffset(event.nativeEvent.contentOffset.y, true)}
      >
        {values.map((value) => (
          <View
            key={value}
            className="items-center justify-center"
            style={{ height: TimePickerLayout.wheelItemHeight }}
          >
            <ThemedText type="default" className="text-fg-default">
              {formatTimeUnit(value)}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

interface TimePickerModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

export function TimePickerModal({ visible, value, onClose, onConfirm }: TimePickerModalProps) {
  const parsedValue = parseTimeHHMM(value);
  const [hour, setHour] = useState(parsedValue.hour);
  const [minute, setMinute] = useState(parsedValue.minute);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const nextValue = parseTimeHHMM(value);
    setHour(nextValue.hour);
    setMinute(nextValue.minute);
  }, [value, visible]);

  const handleConfirm = () => {
    onConfirm(formatTimeHHMM(hour, minute));
    onClose();
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="시간 선택 닫기"
          className="absolute inset-0 bg-modal-overlay"
          onPress={onClose}
        />

        <View className="z-10 rounded-t-base-card border border-modal-border bg-modal-surface px-6 pb-8 pt-6">
          <View className="relative mb-6 flex-row items-center" style={{ height: WHEEL_HEIGHT }}>
            <View
              pointerEvents="none"
              className="absolute inset-x-0 z-0 rounded-modal-button border border-sub-tab-selected-border bg-sub-tab-selected-bg"
              style={{
                top: WHEEL_PADDING_HEIGHT,
                height: TimePickerLayout.wheelItemHeight,
              }}
            />
            <TimeWheelColumn
              values={HOURS}
              selectedValue={hour}
              isActive={visible}
              onValueChange={setHour}
            />
            <ThemedText type="defaultBold" className="z-10 px-2 text-fg-default">
              :
            </ThemedText>
            <TimeWheelColumn
              values={MINUTES}
              selectedValue={minute}
              isActive={visible}
              onValueChange={setMinute}
            />
          </View>

          <View className="gap-3">
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={TimePickerLabels.confirm}
              className="items-center justify-center rounded-modal-button bg-white"
              style={{ height: AppModalLayout.buttonHeight }}
            >
              <ThemedText type="default" className="text-lg font-bold text-modal-confirm-text">
                {TimePickerLabels.confirm}
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={TimePickerLabels.cancel}
              className="items-center justify-center rounded-modal-button bg-btn-disabled"
              style={{ height: AppModalLayout.buttonHeight }}
            >
              <ThemedText type="default" className="text-lg font-bold text-fg">
                {TimePickerLabels.cancel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
