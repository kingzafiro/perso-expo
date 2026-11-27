import { Clock } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import {
  AppSelectField,
  type SelectOption,
} from "@/components/ui/AppSelectField";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";

const DAY_PATTERNS: SelectOption[] = [
  { value: "Lunes a viernes", label: "Lunes a viernes" },
  { value: "Lunes a sábado", label: "Lunes a sábado" },
  { value: "Lunes a domingo (1 día de descanso)", label: "Lunes a domingo (1 día de descanso)" },
  { value: "Fines de semana", label: "Fines de semana" },
  { value: "Turnos rotativos", label: "Turnos rotativos" },
  { value: "Horario flexible", label: "Horario flexible / por objetivos" },
];

const TIME_OPTIONS: SelectOption[] = Array.from({ length: 36 }, (_, idx) => {
  const totalMinutes = 6 * 60 + idx * 30; // 06:00 a 23:30
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  const value = `${hours}:${minutes}`;
  return { value, label: `${value} hrs` };
});

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

function parseScheduleString(raw: string) {
  const clean = (raw || "").trim();
  if (!clean) {
    return {
      enabled: false,
      days: "Lunes a viernes",
      startTime: "09:00",
      endTime: "18:00",
    };
  }

  const timeMatch = clean.match(/(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})/);
  const matchedDay = DAY_PATTERNS.find((p) =>
    clean.toLowerCase().startsWith(p.value.toLowerCase()),
  );

  return {
    enabled: true,
    days: matchedDay?.value ?? "Lunes a viernes",
    startTime: timeMatch?.[1] ?? "09:00",
    endTime: timeMatch?.[2] ?? "18:00",
  };
}

export function validateScheduleTimes(
  days: string,
  startTime: string,
  endTime: string,
): string | null {
  if (days === "Horario flexible" || days === "Turnos rotativos") {
    return null;
  }

  if (!startTime || !endTime) {
    return "Selecciona la hora de entrada y de salida.";
  }

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === end) {
    return "La hora de salida debe ser distinta a la de entrada.";
  }

  if (end < start) {
    return "La hora de salida debe ser posterior a la hora de entrada.";
  }

  if (end - start < 120) {
    return "La jornada debe durar al menos 2 horas.";
  }

  return null;
}

interface SchedulePickerFieldProps {
  value: string;
  error?: string;
  onChange: (formattedSchedule: string) => void;
  onValidationChange?: (validationError: string | null) => void;
}

export function SchedulePickerField({
  value,
  error,
  onChange,
  onValidationChange,
}: SchedulePickerFieldProps) {
  const isDark = useColorScheme() === "dark";
  const theme = useTheme();

  const initial = parseScheduleString(value);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [days, setDays] = useState(initial.days);
  const [startTime, setStartTime] = useState(initial.startTime);
  const [endTime, setEndTime] = useState(initial.endTime);

  const needsTimeRange =
    days !== "Horario flexible" && days !== "Turnos rotativos";

  const localValidationError = enabled
    ? validateScheduleTimes(days, startTime, endTime)
    : null;

  useEffect(() => {
    onValidationChange?.(localValidationError);
  }, [localValidationError, onValidationChange]);

  const emitSchedule = (
    nextEnabled: boolean,
    nextDays: string,
    nextStart: string,
    nextEnd: string,
  ) => {
    if (!nextEnabled) {
      onChange("");
      return;
    }

    const usesRange =
      nextDays !== "Horario flexible" && nextDays !== "Turnos rotativos";

    if (!usesRange) {
      onChange(nextDays);
      return;
    }

    onChange(`${nextDays} · ${nextStart} a ${nextEnd}`);
  };

  const trackFalse = isDark ? "#3A3633" : "#D6D1CC";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.inputBackground,
          borderColor:
            error || localValidationError ? theme.error : theme.inputBorder,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Clock size={16} color={theme.primary} />
          <View style={styles.flexOne}>
            <Text style={[styles.title, { color: theme.text }]}>
              Horario laboral (opcional)
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {enabled && value
                ? value
                : "Activa para definir días y horario de la jornada"}
            </Text>
          </View>
        </View>

        <Switch
          value={enabled}
          onValueChange={(next) => {
            setEnabled(next);
            emitSchedule(next, days, startTime, endTime);
          }}
          trackColor={{ false: trackFalse, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      {enabled ? (
        <View style={styles.controls}>
          <AppSelectField
            label="Días laborales"
            value={days}
            options={DAY_PATTERNS}
            onChange={(nextDays) => {
              setDays(nextDays);
              emitSchedule(true, nextDays, startTime, endTime);
            }}
          />

          {needsTimeRange ? (
            <View style={styles.timeRow}>
              <View style={styles.flexOne}>
                <AppSelectField
                  label="Entrada"
                  value={startTime}
                  options={TIME_OPTIONS}
                  modalTitle="Hora de entrada"
                  onChange={(nextStart) => {
                    setStartTime(nextStart);
                    emitSchedule(true, days, nextStart, endTime);
                  }}
                />
              </View>

              <View style={styles.flexOne}>
                <AppSelectField
                  label="Salida"
                  value={endTime}
                  options={TIME_OPTIONS}
                  modalTitle="Hora de salida"
                  onChange={(nextEnd) => {
                    setEndTime(nextEnd);
                    emitSchedule(true, days, startTime, nextEnd);
                  }}
                />
              </View>
            </View>
          ) : null}

          {localValidationError || error ? (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {localValidationError || error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  flexOne: {
    flex: 1,
    gap: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },

  controls: {
    gap: 12,
  },

  timeRow: {
    flexDirection: "row",
    gap: 10,
  },

  errorText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
});
