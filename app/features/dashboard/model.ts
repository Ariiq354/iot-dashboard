import type { TableColumn } from "@nuxt/ui";
import type { IoTService } from "~~/server/modules/iot/service";
import { z } from "zod";
import { formatDate, formatSensor } from "~/utils/iot";

export const chartFilterSchema = z.object({
  deviceId: z.string().default(""),
});
export const overviewColumns: TableColumn<
  Awaited<ReturnType<typeof IoTService.getOverview>>["devices"][number]
>[] = [
  { accessorKey: "name", header: "Perangkat" },
  { accessorKey: "status", header: "Koneksi" },
  {
    accessorKey: "namaNilai",
    header: "Nama nilai",
  },
  {
    id: "nilai",
    header: "Nilai",
    cell: ({ row }) => formatSensor(row.original.latestTelemetry?.nilai, row.original.satuanNilai),
  },
  {
    accessorKey: "lastSeen",
    header: "Terakhir menerima data (WIB)",
    cell: ({ row }) => formatDate(row.original.lastSeen),
  },
  { accessorKey: "stale", header: "Kesegaran data" },
];
