<script setup lang="ts">
import DataTable from "~/components/table/DataTable.vue";
import { historyColumns, historyFilterSchema } from "./model";

const filters = reactive(historyFilterSchema.parse({}));
const page = ref(1);
const applied = ref<{ deviceId?: number; from?: string; to?: string }>({});
const query = computed(() => ({
  ...applied.value,
  page: page.value,
  limit: 10,
}));

const { data: devices } = await useFetch("/api/devices");
const { data, status, error, refresh } = await useFetch(
  "/api/telemetry/history",
  { query },
);

const deviceOptions = computed(() => [
  { label: "Semua perangkat", value: "all" },
  ...(devices.value ?? []).map(d => ({ label: d.name, value: String(d.id) })),
]);

function applyFilters() {
  applied.value = {
    deviceId: filters.deviceId === "all" ? undefined : Number(filters.deviceId),
    from: filters.from ? new Date(filters.from).toISOString() : undefined,
    to: filters.to ? new Date(filters.to).toISOString() : undefined,
  };
  page.value = 1;
}

function resetFilters() {
  Object.assign(filters, historyFilterSchema.parse({}));
  applyFilters();
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Riwayat Telemetri
        </h1>
        <p class="mt-1 text-sm text-muted">
          Telusuri pengukuran sensor berdasarkan perangkat dan rentang waktu.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        :loading="status === 'pending'"
        @click="refresh()"
      >
        Muat ulang
      </UButton>
    </div>

    <UCard>
      <UForm
        :schema="historyFilterSchema"
        :state="filters"
        class="flex flex-wrap items-end gap-4"
        @submit="applyFilters"
      >
        <UFormField label="Perangkat" name="deviceId">
          <USelect
            v-model="filters.deviceId"
            :items="deviceOptions"
            class="w-56"
          />
        </UFormField>
        <UFormField label="Mulai (waktu lokal)" name="from">
          <UInput v-model="filters.from" type="datetime-local" />
        </UFormField>
        <UFormField label="Sampai (waktu lokal)" name="to">
          <UInput v-model="filters.to" type="datetime-local" />
        </UFormField>
        <UButton type="submit" icon="i-lucide-list-filter">
          Terapkan
        </UButton>
        <UButton color="neutral" variant="ghost" @click="resetFilters">
          Reset
        </UButton>
      </UForm>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      title="Gagal memuat riwayat"
      description="Periksa koneksi dan coba muat ulang."
    />

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Data pengukuran
          <span class="text-sm font-normal text-muted">· {{ data?.total ?? 0 }} reading</span>
        </h2>
      </template>
      <DataTable
        v-model:page="page"
        :data="data?.items ?? []"
        :columns="historyColumns"
        :loading="status === 'pending'"
        :total="data?.total ?? 0"
        pagination
      >
        <template #deviceId-cell="{ row }">
          {{
            devices?.find((d) => d.id === row.original.deviceId)?.name
              ?? `Perangkat #${row.original.deviceId}`
          }}
        </template>
        <template #source-cell="{ row }">
          <UBadge color="neutral" variant="subtle">
            {{
              row.original.source === "simulator" ? "Simulator" : "Perangkat"
            }}
          </UBadge>
        </template>
        <template #empty>
          <p class="py-8 text-muted">
            Belum ada pengukuran untuk filter ini.
          </p>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
