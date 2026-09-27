import type { TableColumn } from "@nuxt/ui";
import type { IoTService } from "~~/server/modules/iot/service";
import { z } from "zod";

export const simulatorSchema = z.object({ mode: z.enum(["normal", "random", "anomaly"]).default("normal") });
export const simulationModes = [
  { label: "Normal", value: "normal", description: "Semua perangkat mengirim reading dan menjadi online." },
  { label: "Random", value: "random", description: "Status koneksi berubah secara acak dan perangkat online mengirim reading." },
  { label: "Force Anomaly", value: "anomaly", description: "Suhu perangkat pertama dibuat melewati batas maksimum yang dikonfigurasi." },
];
export const resultColumns: TableColumn<Awaited<ReturnType<typeof IoTService.generateTelemetry>>["results"][number]>[] = [
  { accessorKey: "deviceId", header: "Perangkat" },
  { accessorKey: "outcome", header: "Hasil" },
  { id: "temperature", header: "Suhu" },
  { id: "humidity", header: "Kelembapan" },
  { id: "co2", header: "CO₂" },
];
