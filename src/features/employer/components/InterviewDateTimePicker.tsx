import * as Haptics from "expo-haptics";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";

const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WEEKDAYS_FULL_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MONTHS_FULL_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const MONTHS_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const TIME_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute === 30) continue;
      const period = hour >= 12 ? "p. m." : "a. m.";
      const hour12 = hour % 12 || 12;
      const minStr = String(minute).padStart(2, "0");
      const label = `${hour12}:${minStr} ${period}`;
      const value = `${String(hour).padStart(2, "0")}:${minStr}`;
      slots.push({ value, label });
    }
  }
  return slots;
})();

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatInterviewDateShort(date: Date): string {
  const weekday = WEEKDAYS_ES[date.getDay()] ?? "";
  const day = date.getDate();
  const month = MONTHS_SHORT_ES[date.getMonth()] ?? "";
  return `${weekday} ${day} ${month}`;
}

export function formatInterviewDateTime(
  date: Date | null,
  timeValue: string | null,
): string {
  const timeSlot = TIME_SLOTS.find((s) => s.value === timeValue);
  if (!date && !timeSlot) return "";

  const datePart = date
    ? `${WEEKDAYS_FULL_ES[date.getDay()]} ${date.getDate()} de ${MONTHS_SHORT_ES[date.getMonth()]}`
    : "";

  if (datePart && timeSlot) {
    return `${datePart} · ${timeSlot.label}`;
  }
  return datePart || timeSlot?.label || "";
}

interface InterviewDateTimePickerProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onChangeDate: (date: Date) => void;
  onChangeTime: (timeValue: string) => void;
}

export function InterviewDateTimePicker({
  selectedDate,
  selectedTime,
  onChangeDate,
  onChangeTime,
}: InterviewDateTimePickerProps) {
  const theme = useTheme();
  const today = useMemo(() => startOfDay(new Date()), []);

  const [activePanel, setActivePanel] = useState<"date" | "time" | null>(
    "date",
  );
  const [viewYear, setViewYear] = useState(
    () => (selectedDate ?? today).getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    () => (selectedDate ?? today).getMonth(),
  );

  const selectedTimeLabel = useMemo(
    () => TIME_SLOTS.find((s) => s.value === selectedTime)?.label ?? null,
    [selectedTime],
  );

  const calendarCells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(viewYear, viewMonth, d));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }
    return cells;
  }, [viewYear, viewMonth]);

  const canGoPrevMonth =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePickDate = (date: Date) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    onChangeDate(date);
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    if (!selectedTime) {
      setActivePanel("time");
    }
  };

  const handlePickTime = (value: string) => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    onChangeTime(value);
    if (selectedDate) {
      setActivePanel(null);
    }
  };

  const togglePanel = (panel: "date" | "time") => {
    if (Platform.OS !== "web") void Haptics.selectionAsync();
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const nextBusinessDay = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }, [today]);

  const summaryPreview = formatInterviewDateTime(selectedDate, selectedTime);

  return (
    <View style={styles.wrapper}>
      {/* Dos selectores separados: Fecha y Hora */}
      <View style={styles.triggersRow}>
        <Pressable
          onPress={() => togglePanel("date")}
          style={({ pressed }) => [
            styles.triggerCard,
            {
              backgroundColor:
                activePanel === "date"
                  ? theme.primarySoft
                  : theme.inputBackground,
              borderColor:
                activePanel === "date" || selectedDate
                  ? theme.primaryBorder
                  : theme.inputBorder,
            },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.triggerTopRow}>
            <Calendar size={14} color={theme.primary} />
            <Text
              style={[styles.triggerLabel, { color: theme.textSecondary }]}
            >
              Día y fecha
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.triggerValue,
              { color: selectedDate ? theme.text : theme.textMuted },
            ]}
          >
            {selectedDate
              ? formatInterviewDateShort(selectedDate)
              : "Elegir fecha"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => togglePanel("time")}
          style={({ pressed }) => [
            styles.triggerCard,
            {
              backgroundColor:
                activePanel === "time"
                  ? theme.primarySoft
                  : theme.inputBackground,
              borderColor:
                activePanel === "time" || selectedTime
                  ? theme.primaryBorder
                  : theme.inputBorder,
            },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.triggerTopRow}>
            <Clock size={14} color={theme.primary} />
            <Text
              style={[styles.triggerLabel, { color: theme.textSecondary }]}
            >
              Hora
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.triggerValue,
              { color: selectedTimeLabel ? theme.text : theme.textMuted },
            ]}
          >
            {selectedTimeLabel ?? "Elegir hora"}
          </Text>
        </Pressable>
      </View>

      {/* Panel de Calendario */}
      {activePanel === "date" ? (
        <View
          style={[
            styles.panelBox,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          {/* Atajos rápidos */}
          <View style={styles.quickRow}>
            {[
              { label: "Hoy", date: today },
              { label: "Mañana", date: tomorrow },
              {
                label: formatInterviewDateShort(nextBusinessDay),
                date: nextBusinessDay,
              },
            ].map((chip) => {
              const active = isSameDay(selectedDate, chip.date);
              return (
                <Pressable
                  key={chip.label}
                  onPress={() => handlePickDate(chip.date)}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : theme.surfaceElevated,
                      borderColor: active ? theme.primary : theme.inputBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      { color: active ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Navegación del mes */}
          <View style={styles.monthHeader}>
            <Pressable
              onPress={handlePrevMonth}
              disabled={!canGoPrevMonth}
              hitSlop={8}
              style={[
                styles.monthNavBtn,
                { backgroundColor: theme.surfaceElevated },
                !canGoPrevMonth && styles.navDisabled,
              ]}
            >
              <ChevronLeft size={16} color={theme.text} />
            </Pressable>

            <Text style={[styles.monthTitle, { color: theme.text }]}>
              {MONTHS_FULL_ES[viewMonth]} {viewYear}
            </Text>

            <Pressable
              onPress={handleNextMonth}
              hitSlop={8}
              style={[
                styles.monthNavBtn,
                { backgroundColor: theme.surfaceElevated },
              ]}
            >
              <ChevronRight size={16} color={theme.text} />
            </Pressable>
          </View>

          {/* Cabecera días de la semana */}
          <View style={styles.weekRow}>
            {WEEKDAYS_ES.map((dayName) => (
              <Text
                key={dayName}
                style={[styles.weekdayLabel, { color: theme.textMuted }]}
              >
                {dayName}
              </Text>
            ))}
          </View>

          {/* Cuadrícula de días */}
          <View style={styles.daysGrid}>
            {calendarCells.map((cellDate, idx) => {
              if (!cellDate) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const isPast = cellDate.getTime() < today.getTime();
              const isSelected = isSameDay(cellDate, selectedDate);
              const isToday = isSameDay(cellDate, today);

              return (
                <View key={cellDate.toISOString()} style={styles.dayCell}>
                  <Pressable
                    disabled={isPast}
                    onPress={() => handlePickDate(cellDate)}
                    style={({ pressed }) => [
                      styles.dayCircle,
                      isToday &&
                        !isSelected && {
                          borderWidth: 1.5,
                          borderColor: theme.primary,
                        },
                      isSelected && { backgroundColor: theme.primary },
                      pressed && !isPast && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: isSelected
                            ? "#FFFFFF"
                            : isPast
                              ? theme.textMuted
                              : theme.text,
                          opacity: isPast ? 0.35 : 1,
                        },
                      ]}
                    >
                      {cellDate.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Panel de Selector de Hora */}
      {activePanel === "time" ? (
        <View
          style={[
            styles.panelBox,
            {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
            },
          ]}
        >
          <Text style={[styles.timeSectionHint, { color: theme.textSecondary }]}>
            Selecciona la hora de la entrevista
          </Text>

          <ScrollView
            style={styles.timeScroll}
            contentContainerStyle={styles.timeGrid}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {TIME_SLOTS.map((slot) => {
              const active = slot.value === selectedTime;
              return (
                <Pressable
                  key={slot.value}
                  onPress={() => handlePickTime(slot.value)}
                  style={({ pressed }) => [
                    styles.timeSlotBtn,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : theme.surfaceElevated,
                      borderColor: active ? theme.primary : theme.inputBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      { color: active ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    {slot.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Resumen seleccionado */}
      {summaryPreview ? (
        <View
          style={[
            styles.summaryBar,
            {
              backgroundColor: theme.primarySoft,
              borderColor: theme.primaryBorder,
            },
          ]}
        >
          <Text style={[styles.summaryText, { color: theme.primary }]}>
            {summaryPreview}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },

  triggersRow: {
    flexDirection: "row",
    gap: 10,
  },

  triggerCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },

  triggerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  triggerLabel: {
    fontSize: 11.5,
    fontWeight: "600",
  },

  triggerValue: {
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  panelBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
  },

  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  quickChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  quickChipText: {
    fontSize: 12,
    fontWeight: "700",
  },

  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },

  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  navDisabled: {
    opacity: 0.35,
  },

  monthTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  weekRow: {
    flexDirection: "row",
  },

  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCell: {
    width: "14.2857%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
  },

  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  dayNumber: {
    fontSize: 13.5,
    fontWeight: "700",
  },

  timeSectionHint: {
    fontSize: 12,
    fontWeight: "600",
  },

  timeScroll: {
    maxHeight: 220,
  },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  timeSlotBtn: {
    width: "31.5%",
    minHeight: 38,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  timeSlotText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  summaryBar: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: "center",
  },

  summaryText: {
    fontSize: 13.5,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.78,
  },
});
