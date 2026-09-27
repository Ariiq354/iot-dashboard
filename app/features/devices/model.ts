import type { TableColumn } from "@nuxt/ui";
import type { IoTService } from "~~/server/modules/iot/service";
import { z } from "zod";
import { formatDate } from "~/utils/iot";

export const deviceFilterSchema = z.object({
  search: z.string().default(""),
  status: z.enum(["all", "online", "offline"]).default("all"),
});

export const deviceColumns: TableColumn<
  Awaited<ReturnType<typeof IoTService.listDevices>>[number]
>[] = [
  { accessorKey: "name", header: "Perangkat" },
  {
    accessorKey: "location",
    header: "Lokasi",
    cell: ({ row }) => row.original.location ?? "—",
  },
  { accessorKey: "status", header: "Koneksi" },
  {
    accessorKey: "lastSeen",
    header: "Terakhir menerima data (WIB)",
    cell: ({ row }) => formatDate(row.original.lastSeen),
  },
  {
    accessorKey: "createdAt",
    header: "Terdaftar (WIB)",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
];
