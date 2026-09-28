import { z } from "zod";

export const sensorNumber = z.number().finite().min(-99_999_999.99).max(99_999_999.99).multipleOf(0.01);

export const createDeviceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200).optional(),
  namaNilai: z.string().trim().min(1).max(100),
  satuanNilai: z.string().trim().min(1).max(30),
  nilai: sensorNumber.optional(),
  threshold: sensorNumber,
});
