import type { TableColumn } from "@nuxt/ui";
import type { IoTService } from "~~/server/modules/iot/service";
import { z } from "zod";
import { alertLabels, formatDate, formatSensor } from "~/utils/iot";

export const alertFilterSchema = z.object({
  status: z.enum(["all", "active", "acknowledged", "resolved"]).default("all"),
  deviceId: z.string().default("all"),
  type: z.string().default("all"),
});

export const statusLabels = {
  active: "Aktif",
  acknowledged: "Sudah diketahui",
  resolved: "Selesai",
};
export const severityLabels = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
  critical: "Kritis",
};
export const alertColumns: TableColumn<
  Awaited<ReturnType<typeof IoTService.listAlerts>>["items"][number]
>[] = [
  { accessorKey: "deviceId", header: "Perangkat" },
  {
    accessorKey: "type",
    header: "Peringatan",
    cell: ({ row }) => alertLabels[row.original.type] ?? row.original.type,
  },
  { accessorKey: "severity", header: "Prioritas" },
  { accessorKey: "namaNilai", header: "Nama nilai" },
  {
    accessorKey: "threshold",
    header: "Threshold (>)",
    cell: ({ row }) => row.original.type === "VALUE_HIGH" ? formatSensor(row.original.threshold, row.original.satuanNilai) : "—",
  },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "lastValue",
    header: "Nilai terakhir",
    cell: ({ row }) => formatSensor(row.original.lastValue, row.original.satuanNilai),
  },
  {
    accessorKey: "openedAt",
    header: "Dibuka (WIB)",
    cell: ({ row }) => formatDate(row.original.openedAt),
  },
  {
    accessorKey: "resolvedAt",
    header: "Selesai (WIB)",
    cell: ({ row }) =>
      row.original.resolvedAt ? formatDate(row.original.resolvedAt) : "—",
  },
  { id: "acknowledge", header: "Tindakan" },
];
