<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn } from "@vueuse/core";
import { createDeviceSchema } from "~~/shared/schemas/iot";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useAuthSession } from "~/composables/auth";
import { errorMessage } from "~/utils/iot";
import { deviceColumns, deviceFilterSchema } from "./model";

const { session } = await useAuthSession();
const isAdmin = computed(() => session.value?.user.role === "admin");
const open = ref(false);
const busy = ref(false);
const failure = ref("");
const initialState = () => ({ name: "", location: "", namaNilai: "", satuanNilai: "", threshold: undefined as number | undefined, nilai: undefined as number | undefined });
const state = reactive(initialState());
const { data, status, error, refresh } = await useFetch("/api/devices");

async function createDevice() {
  if (busy.value)
    return;
  busy.value = true;
  failure.value = "";
  try {
    await $fetch("/api/devices", { method: "POST", body: createDeviceSchema.parse(state) });
    open.value = false;
    Object.assign(state, initialState());
    await refresh();
  }
  catch (error) {
    failure.value = errorMessage(error);
  }
  finally {
    busy.value = false;
  }
}

const filters = reactive(deviceFilterSchema.parse({}));
const page = ref(1);

const visibility = useDocumentVisibility();
const { pause, resume } = useIntervalFn(() => {
  if (visibility.value === "visible" && status.value !== "pending")
    void refresh();
}, 5000);
onDeactivated(pause);
onActivated(resume);

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
      <div class="flex gap-2">
        <UButton v-if="isAdmin" icon="i-lucide-plus" @click="open = true; failure = ''">
          Tambah perangkat
        </UButton>
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
    </div>

    <UModal v-model:open="open" title="Tambah perangkat" description="Konfigurasikan satu nilai sensor dan threshold alert perangkat.">
      <template #body>
        <UForm :schema="createDeviceSchema" :state="state" class="space-y-4" @submit="createDevice">
          <UFormField label="Nama perangkat" name="name" required>
            <UInput v-model="state.name" class="w-full" placeholder="Sensor ruang 1" />
          </UFormField>
          <UFormField label="Lokasi" name="location">
            <UInput v-model="state.location" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Nama nilai" name="namaNilai" required>
              <UInput v-model="state.namaNilai" placeholder="Suhu" class="w-full" />
            </UFormField>
            <UFormField label="Satuan nilai" name="satuanNilai" required>
              <UInput v-model="state.satuanNilai" placeholder="°C" class="w-full" />
            </UFormField>
            <UFormField label="Nilai awal (opsional)" name="nilai">
              <UInput v-model.number.optional="state.nilai" type="number" step="0.01" class="w-full" />
            </UFormField>
            <UFormField label="Threshold alert" name="threshold" required>
              <UInput v-model.number="state.threshold" type="number" step="0.01" placeholder="60" class="w-full" />
            </UFormField>
          </div>
          <p class="text-sm text-muted">
            Alert aktif saat nilai lebih besar dari threshold. Nilai awal, jika diisi, disimpan sebagai telemetri pertama.
          </p>
          <UAlert v-if="failure" color="error" title="Gagal menambah perangkat" :description="failure" />
          <UButton type="submit" :loading="busy" :disabled="busy">
            Simpan perangkat
          </UButton>
        </UForm>
      </template>
    </UModal>

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
        <template #stale-cell="{ row }">
          <UBadge :color="row.original.stale ? 'warning' : 'success'" variant="subtle">
            {{ !row.original.lastSeen ? "Belum ada data" : row.original.stale ? "Stale" : "Terbaru" }}
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
      Status dihitung dari waktu data terakhir: stale setelah 1 menit dan offline
      setelah 3 menit. Perangkat tanpa data ditampilkan offline.
    </p>
  </div>
</template>
