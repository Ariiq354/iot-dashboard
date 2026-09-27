export function formatDate(value: string | Date | null | undefined) {
  if (!value)
    return "Belum ada data";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value));
}

export function formatSensor(value: string | number | null | undefined, unit: string) {
  if (value === null || value === undefined)
    return "—";
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value))} ${unit}`;
}

export const alertLabels: Record<string, string> = {
  DEVICE_OFFLINE: "Perangkat offline",
  TEMPERATURE_HIGH: "Suhu di luar batas",
  HUMIDITY_HIGH: "Kelembapan di luar batas",
  CO2_HIGH: "CO₂ di luar batas",
};

export function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string")
      return data.message;
  }
  return "Terjadi kesalahan. Silakan coba lagi.";
}
