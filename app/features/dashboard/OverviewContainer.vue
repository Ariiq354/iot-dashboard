<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn } from "@vueuse/core";
import { LineChart } from "vue-chrts";
import DataTable from "~/components/table/DataTable.vue";
import { formatDate } from "~/utils/iot";
import { chartFilterSchema, metrics, overviewColumns } from "./model";

const { data, status, error, refresh } = await useFetch("/api/dashboard/overview");
const filters = reactive(chartFilterSchema.parse({}));
watch(() => data.value?.devices, (devices) => {
  if (!filters.deviceId && devices?.[0])
    filters.deviceId = String(devices[0].id);
}, { immediate: true });
const deviceOptions = computed(() => (data.value?.devices ?? []).map(d => ({ label: d.name, value: String(d.id) })));
const historyQuery = computed(() => ({ deviceId: filters.deviceId ? Number(filters.deviceId) : undefined, page: 1, limit: 100 }));
const { data: history, status: historyStatus, error: historyError, refresh: refreshHistory } = await useFetch("/api/telemetry/history", { query: historyQuery });
const chartData = computed(() => (history.value?.items ?? [])
  .filter(item => item.deviceId === Number(filters.deviceId) && item[filters.metric] !== null)
  .toReversed()
  .map(item => ({ time: item.receivedAt, value: Number(item[filters.metric]) })));
const metric = computed(() => metrics[filters.metric]);
const categories = computed(() => ({ value: { name: metric.value.label, color: metric.value.color } }));
const page = ref(1);
const rows = computed(() => (data.value?.devices ?? []).slice((page.value - 1) * 10, page.value * 10));
const visibility = useDocumentVisibility();
const now = ref(Date.now());
const { pause, resume } = useIntervalFn(() => {
  if (visibility.value === "visible") {
    now.value = Date.now();
    if (status.value !== "pending")
      void refresh();
    if (historyStatus.value !== "pending")
      void refreshHistory();
  }
}, 5000);
onDeactivated(pause);
onActivated(resume);

function isStale(lastSeen: string | null, offline: boolean) {
  return offline || !lastSeen || now.value - new Date(lastSeen).getTime() > 60000;
}
function xFormatter(index: number) {
  return chartData.value[index] ? formatDate(chartData.value[index].time) : "";
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Ringkasan Monitoring
        </h1><p class="mt-1 text-sm text-muted">
          Diperbarui setiap 5 detik saat halaman aktif.
        </p>
      </div>
      <UButton to="/dashboard/simulator" icon="i-lucide-radio-tower" variant="soft">
        Buka simulator
      </UButton>
    </div>
    <UAlert v-if="error" color="error" title="Gagal memuat ringkasan">
      <template #actions>
        <UButton size="xs" color="error" :loading="status === 'pending'" @click="refresh()">
          Coba lagi
        </UButton>
      </template>
    </UAlert>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">
            Total perangkat
          </p><UIcon name="i-lucide-cpu" class="size-5 text-primary" />
        </div><p class="mt-3 text-3xl font-semibold">
          {{ data?.devices.length ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Online
        </p><p class="mt-3 text-3xl font-semibold text-success">
          {{ data?.devices.filter(d => d.status === 'online').length ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Offline
        </p><p class="mt-3 text-3xl font-semibold text-error">
          {{ data?.devices.filter(d => d.status === 'offline').length ?? 0 }}
        </p>
      </UCard>
      <UCard>
        <NuxtLink to="/dashboard/alerts">
          <p class="text-sm text-muted">
            Peringatan belum selesai
          </p><p class="mt-3 text-3xl font-semibold text-warning">
            {{ data?.activeAlertCount ?? 0 }}
          </p>
        </NuxtLink>
      </UCard>
    </div>
    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="font-semibold">
              Tren sensor
            </h2><p class="text-sm text-muted">
              Maksimal 100 reading terbaru per perangkat · {{ metric.unit }}
            </p>
          </div><div class="flex flex-wrap gap-2">
            <USelect v-model="filters.deviceId" :items="deviceOptions" aria-label="Perangkat grafik" placeholder="Pilih perangkat" class="w-56" /><USelect v-model="filters.metric" aria-label="Metrik grafik" :items="Object.entries(metrics).map(([value, item]) => ({ value, label: item.label }))" class="w-40" />
          </div>
        </div>
      </template>
      <UAlert v-if="historyError" color="error" title="Gagal memuat grafik" />
      <div v-else-if="historyStatus === 'pending' && !chartData.length" class="flex h-72 items-center justify-center text-muted">
        Memuat grafik...
      </div>
      <ClientOnly v-else-if="chartData.length > 1">
        <LineChart :data="chartData" :categories="categories" :height="300" :x-formatter="xFormatter" :y-label="metric.unit" :x-num-ticks="4" />
        <template #fallback>
          <div class="h-72 animate-pulse rounded bg-elevated" />
        </template>
      </ClientOnly>
      <div v-else class="flex h-72 flex-col items-center justify-center gap-3 text-muted">
        <UIcon name="i-lucide-chart-line" class="size-10" /><p>Grafik memerlukan minimal dua reading.</p><UButton to="/dashboard/simulator" color="neutral" variant="outline">
          Buka simulator
        </UButton>
      </div>
    </UCard>
    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Pengukuran terakhir
        </h2>
      </template>
      <DataTable v-model:page="page" :data="rows" :columns="overviewColumns" :total="data?.devices.length ?? 0" :loading="status === 'pending' && !data" pagination>
        <template #status-cell="{ row }">
          <UBadge :color="row.original.status === 'online' ? 'success' : 'error'" variant="subtle">
            {{ row.original.status === 'online' ? 'Online' : 'Offline' }}
          </UBadge>
        </template>
        <template #stale-cell="{ row }">
          <UBadge :color="isStale(row.original.lastSeen, row.original.stale) ? 'warning' : 'success'" variant="subtle">
            {{ !row.original.latestTelemetry ? 'Belum ada data' : isStale(row.original.lastSeen, row.original.stale) ? 'Stale' : 'Terbaru' }}
          </UBadge>
        </template>
        <template #empty>
          <p class="py-8 text-muted">
            Belum ada perangkat. Tambahkan data perangkat melalui seed.
          </p>
        </template>
      </DataTable>
      <p class="mt-4 text-xs text-muted">
        Nilai terakhir ditandai stale jika perangkat offline atau tidak mengirim data selama lebih dari 60 detik. Nilai tersebut bukan pengukuran saat ini.
      </p>
    </UCard>
  </div>
</template>
