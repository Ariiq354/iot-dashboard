import type { TableColumn } from "@nuxt/ui";
import type { IoTService } from "~~/server/modules/iot/service";
import { z } from "zod";
import { formatDate, formatSensor } from "~/utils/iot";

export const chartFilterSchema = z.object({
  deviceId: z.string().default(""),
  metric: z.enum(["temperature", "humidity", "co2"]).default("temperature"),
});
export const metrics = {
  temperature: { label: "Suhu", unit: "°C", color: "#f97316" },
  humidity: { label: "Kelembapan", unit: "%", color: "#3b82f6" },
  co2: { label: "CO₂", unit: "ppm", color: "#8b5cf6" },
};
export const overviewColumns: TableColumn<
  Awaited<ReturnType<typeof IoTService.getOverview>>["devices"][number]
>[] = [
  { accessorKey: "name", header: "Perangkat" },
  { accessorKey: "status", header: "Koneksi" },
  {
    id: "temperature",
    header: "Suhu",
    cell: ({ row }) =>
      formatSensor(row.original.latestTelemetry?.temperature, "°C"),
  },
  {
    id: "humidity",
    header: "Kelembapan",
    cell: ({ row }) =>
      formatSensor(row.original.latestTelemetry?.humidity, "%"),
  },
  {
    id: "co2",
    header: "CO₂",
    cell: ({ row }) => formatSensor(row.original.latestTelemetry?.co2, "ppm"),
  },
  {
    accessorKey: "lastSeen",
    header: "Terakhir menerima data (WIB)",
    cell: ({ row }) => formatDate(row.original.lastSeen),
  },
  { accessorKey: "stale", header: "Kesegaran data" },
];
