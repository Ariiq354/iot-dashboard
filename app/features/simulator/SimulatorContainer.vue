<script setup lang="ts">
import DataTable from "~/components/table/DataTable.vue";
import { useAuthSession } from "~/composables/auth";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { errorMessage, formatSensor } from "~/utils/iot";
import { resultColumns, simulationModes, simulatorSchema } from "./model";

const { session } = await useAuthSession();
const isAdmin = computed(() => session.value?.user.role === "admin");

const state = reactive(simulatorSchema.parse({}));
const { data: devices } = await useFetch("/api/devices");

const busy = ref(false);
const result = ref<Awaited<ReturnType<typeof generate>>>();
const failure = ref("");

function generate() {
  return $fetch("/api/simulator/generate", {
    method: "POST",
    body: { mode: state.mode },
  });
}

async function submit() {
  if (busy.value || !isAdmin.value)
    return;
  busy.value = true;
  failure.value = "";
  result.value = undefined;
  try {
    result.value = await generate();
    useToastSuccess(
      "Simulasi selesai",
      `${result.value.results.length} perangkat diproses.`,
    );
  }
  catch (error) {
    failure.value = errorMessage(error);
    useToastError("Simulasi gagal", failure.value);
  }
  finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold">
        IoT Simulator
      </h1>
      <p class="mt-1 text-sm text-muted">
        Jalankan simulasi manual untuk menguji telemetry dan peringatan.
      </p>
    </div>

    <UAlert
      v-if="!isAdmin"
      color="warning"
      title="Akses khusus admin"
      description="Hanya admin yang dapat menjalankan simulator. Anda dapat melihat hasil pengukuran melalui Beranda dan Riwayat Telemetri."
    />

    <template v-else>
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            Generate Telemetry
          </h2>
        </template>
        <UForm
          :state="state"
          :schema="simulatorSchema"
          class="space-y-6"
          @submit="submit"
        >
          <UFormField label="Mode simulasi" name="mode">
            <URadioGroup
              v-model="state.mode"
              :items="simulationModes"
              :disabled="busy"
              variant="card"
              class="mt-2"
            />
          </UFormField>
          <p class="text-sm text-muted">
            Satu klik mengirim satu nilai untuk setiap perangkat. Nama nilai dan
            satuan mengikuti konfigurasi perangkat. Mode normal tidak melebihi
            threshold; mode anomaly memicu minimal satu alert.
          </p>
          <UButton
            type="submit"
            icon="i-lucide-play"
            :loading="busy"
            :disabled="busy"
          >
            {{ busy ? "Memproses perangkat..." : "Generate Telemetry" }}
          </UButton>
        </UForm>
      </UCard>

      <UAlert
        v-if="failure"
        color="error"
        title="Simulasi gagal"
        :description="failure"
      />

      <UCard v-if="result">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-semibold">
              Hasil simulasi · {{ result.mode }}
            </h2>
            <UBadge color="success" variant="subtle">
              {{ result.results.length }} perangkat
            </UBadge>
          </div>
        </template>
        <div class="mb-4 flex flex-wrap gap-4 text-sm text-muted">
          <span>{{
            result.results.filter((r) => r.outcome === "telemetry").length
          }}
            reading tersimpan</span>
        </div>

        <DataTable :data="result.results" :columns="resultColumns">
          <template #deviceId-cell="{ row }">
            {{
              devices?.find((d) => d.id === row.original.deviceId)?.name
                ?? `Perangkat #${row.original.deviceId}`
            }}
          </template>
          <template #outcome-cell="{ row }">
            <UBadge
              :color="
                row.original.outcome === 'telemetry' ? 'success' : 'warning'
              "
              variant="subtle"
            >
              {{
                row.original.outcome === "telemetry"
                  ? "Reading tersimpan"
                  : "Offline"
              }}
            </UBadge>
          </template>
          <template #nilai-cell="{ row }">
            {{ formatSensor(row.original.reading?.nilai, row.original.reading?.satuanNilai ?? "") }}
          </template>
          <template #empty>
            <p class="py-8 text-muted">
              Belum ada perangkat untuk diproses.
            </p>
          </template>
        </DataTable>
      </UCard>
    </template>
  </div>
</template>
