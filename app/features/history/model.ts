import type { TableColumn } from "@nuxt/ui";
import type { IoTService } from "~~/server/modules/iot/service";
import { z } from "zod";
import { formatDate, formatSensor } from "~/utils/iot";

export const historyFilterSchema = z.object({
  deviceId: z.string().default("all"),
  from: z.string().default(""),
  to: z.string().default(""),
}).refine(value => !value.from || !value.to || value.from <= value.to, {
  message: "Waktu mulai harus sebelum waktu akhir.",
  path: ["to"],
});

export const historyColumns: TableColumn<Awaited<ReturnType<typeof IoTService.getTelemetryHistory>>["items"][number]>[] = [
  { accessorKey: "receivedAt", header: "Waktu diterima (WIB)", cell: ({ row }) => formatDate(row.original.receivedAt) },
  { accessorKey: "deviceId", header: "Perangkat" },
  { accessorKey: "temperature", header: "Suhu", cell: ({ row }) => formatSensor(row.original.temperature, "°C") },
  { accessorKey: "humidity", header: "Kelembapan", cell: ({ row }) => formatSensor(row.original.humidity, "%") },
  { accessorKey: "co2", header: "CO₂", cell: ({ row }) => formatSensor(row.original.co2, "ppm") },
  { accessorKey: "source", header: "Sumber" },
];
