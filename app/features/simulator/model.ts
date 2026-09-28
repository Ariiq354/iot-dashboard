import type { TableColumn } from "@nuxt/ui";
import type { IoTService } from "~~/server/modules/iot/service";
import { z } from "zod";

export const simulatorSchema = z.object({
  mode: z.enum(["normal", "random", "anomaly"]).default("normal"),
});
export const simulationModes = [
  {
    label: "Normal",
    value: "normal",
    description: "Semua perangkat mengirim reading dan menjadi online.",
  },
  {
    label: "Random",
    value: "random",
    description:
      "Semua perangkat mengirim nilai acak yang dapat melewati threshold alert.",
  },
  {
    label: "Force Anomaly",
    value: "anomaly",
    description:
      "Nilai salah satu perangkat dibuat melewati threshold alert.",
  },
];
export const resultColumns: TableColumn<
  Awaited<ReturnType<typeof IoTService.generateTelemetry>>["results"][number]
>[] = [
  { accessorKey: "deviceId", header: "Perangkat" },
  { accessorKey: "outcome", header: "Hasil" },
  { id: "namaNilai", header: "Nama nilai", cell: ({ row }) => row.original.reading?.namaNilai },
  { id: "nilai", header: "Nilai" },
];
