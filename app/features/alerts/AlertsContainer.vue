<script setup lang="ts">
import DataTable from "~/components/table/DataTable.vue";
import { useAuthSession } from "~/composables/auth";
import { useToastError, useToastSuccess } from "~/composables/toast";
import { alertLabels, errorMessage } from "~/utils/iot";
import {
  alertColumns,
  alertFilterSchema,
  severityLabels,
  statusLabels,
} from "./model";

const { session } = await useAuthSession();
const isAdmin = computed(() => session.value?.user.role === "admin");

const filters = reactive(alertFilterSchema.parse({}));
const page = ref(1);
const busy = ref<number | null>(null);

watch(
  filters,
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const query = computed(() => ({
  page: page.value,
  limit: 10,
  status: filters.status === "all" ? undefined : filters.status,
  deviceId: filters.deviceId === "all" ? undefined : Number(filters.deviceId),
  type: filters.type === "all" ? undefined : filters.type,
}));

const { data: devices } = await useFetch("/api/devices");
const { data, status, error, refresh } = await useFetch("/api/alerts", {
  query,
});

const deviceOptions = computed(() => [
  { label: "Semua perangkat", value: "all" },
  ...(devices.value ?? []).map(d => ({ label: d.name, value: String(d.id) })),
]);
const columns = computed(() =>
  isAdmin.value
    ? alertColumns
    : alertColumns.filter(c => c.id !== "acknowledge"),
);

async function acknowledge(id: number) {
  busy.value = id;
  try {
    await $fetch(`/api/alerts/${id}/acknowledge`, { method: "POST" });
    useToastSuccess("Peringatan ditandai sudah diketahui");
    await refresh();
  }
  catch (error) {
    useToastError("Gagal memperbarui peringatan", errorMessage(error));
  }
  finally {
    busy.value = null;
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Peringatan
        </h1>
        <p class="mt-1 text-sm text-muted">
          Tinjau kondisi sensor dan gangguan koneksi perangkat.
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

    <UAlert
      icon="i-lucide-info"
      color="info"
      variant="subtle"
      title="Diketahui bukan berarti selesai"
      description="Acknowledge mencatat bahwa admin telah melihat peringatan. Kondisi selesai setelah data normal atau perangkat pulih."
    />

    <UAlert
      v-if="error"
      color="error"
      title="Gagal memuat peringatan"
      description="Coba muat ulang untuk mengambil data terbaru."
    />

    <UCard>
      <div class="mb-4 flex flex-wrap gap-3">
        <USelect
          v-model="filters.status"
          aria-label="Status peringatan"
          class="w-48"
          :items="[
            { label: 'Semua status', value: 'all' },
            ...Object.entries(statusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]"
        />
        <USelect
          v-model="filters.deviceId"
          aria-label="Perangkat"
          :items="deviceOptions"
          class="w-56"
        />
        <USelect
          v-model="filters.type"
          aria-label="Jenis peringatan"
          class="w-56"
          :items="[
            { label: 'Semua jenis', value: 'all' },
            ...Object.entries(alertLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]"
        />
      </div>
      <DataTable
        v-model:page="page"
        :data="data?.items ?? []"
        :columns="columns"
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
        <template #severity-cell="{ row }">
          <UBadge
            :color="
              row.original.severity === 'high'
                || row.original.severity === 'critical'
                ? 'error'
                : 'warning'
            "
            variant="subtle"
          >
            {{
              severityLabels[
                row.original.severity as keyof typeof severityLabels
              ]
            }}
          </UBadge>
        </template>
        <template #status-cell="{ row }">
          <UBadge
            :color="
              row.original.status === 'resolved'
                ? 'success'
                : row.original.status === 'active'
                  ? 'error'
                  : 'warning'
            "
            variant="subtle"
          >
            {{ statusLabels[row.original.status as keyof typeof statusLabels] }}
          </UBadge>
        </template>
        <template #acknowledge-cell="{ row }">
          <UButton
            v-if="isAdmin && row.original.status === 'active'"
            size="xs"
            variant="soft"
            :loading="busy === row.original.id"
            :disabled="busy !== null"
            @click="acknowledge(row.original.id)"
          >
            Tandai diketahui
          </UButton>
          <span v-else class="text-muted">—</span>
        </template>
        <template #empty>
          <p class="py-8 text-muted">
            Tidak ada peringatan untuk filter ini.
          </p>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
