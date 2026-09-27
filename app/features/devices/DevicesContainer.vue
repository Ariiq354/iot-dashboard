<script setup lang="ts">
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { deviceColumns, deviceFilterSchema } from "./model";

const filters = reactive(deviceFilterSchema.parse({}));
const page = ref(1);

const { data, status, error, refresh } = await useFetch("/api/devices");

const filtered = computed(() =>
  (data.value ?? []).filter(
    item =>
      (filters.status === "all" || item.status === filters.status)
      && `${item.name} ${item.location ?? ""}`
        .toLowerCase()
        .includes(filters.search.toLowerCase()),
  ),
);

const rows = computed(() =>
  filtered.value.slice((page.value - 1) * 10, page.value * 10),
);

watch(filters, () => {
  page.value = 1;
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Perangkat
        </h1>
        <p class="mt-1 text-sm text-muted">
          Pantau lokasi dan status koneksi seluruh sensor IoT.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        :loading="status === 'pending'"
        @click="refresh()"
      >
        Muat ulang
      </UButton>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <UCard>
        <p class="text-sm text-muted">
          Total perangkat
        </p>
        <p class="mt-2 text-3xl font-semibold">
          {{ data?.length ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Online
        </p>
        <p class="mt-2 text-3xl font-semibold text-success">
          {{ data?.filter((d) => d.status === "online").length ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Offline
        </p>
        <p class="mt-2 text-3xl font-semibold text-error">
          {{ data?.filter((d) => d.status === "offline").length ?? 0 }}
        </p>
      </UCard>
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="Gagal memuat perangkat"
      description="Coba muat ulang untuk mengambil data terbaru."
    />

    <UCard>
      <div class="mb-4 flex flex-wrap gap-3">
        <InputSearch
          v-model="filters.search"
          placeholder="Cari nama atau lokasi perangkat..."
        />
        <USelect
          v-model="filters.status"
          aria-label="Status koneksi"
          :items="[
            { label: 'Semua status', value: 'all' },
            { label: 'Online', value: 'online' },
            { label: 'Offline', value: 'offline' },
          ]"
          class="w-44"
        />
      </div>
      <DataTable
        v-model:page="page"
        :data="rows"
        :columns="deviceColumns"
        :loading="status === 'pending'"
        :total="filtered.length"
        pagination
        enumerate
      >
        <template #status-cell="{ row }">
          <UBadge
            :color="row.original.status === 'online' ? 'success' : 'error'"
            variant="subtle"
          >
            {{ row.original.status === "online" ? "Online" : "Offline" }}
          </UBadge>
        </template>
        <template #empty>
          <p class="py-8 text-muted">
            Tidak ada perangkat yang sesuai.
          </p>
        </template>
      </DataTable>
    </UCard>

    <p class="text-xs text-muted">
      Status koneksi pada prototype ditentukan oleh simulator, bukan pemantauan
      perangkat fisik.
    </p>
  </div>
</template>
