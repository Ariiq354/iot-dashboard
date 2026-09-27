<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items = ref<NavigationMenuItem[][]>([
  [
    { label: "Monitoring", type: "label" },
    { label: "Beranda", to: "/dashboard", icon: "i-lucide-layout-dashboard" },
    { label: "Perangkat", to: "/dashboard/devices", icon: "i-lucide-cpu" },
    { label: "Riwayat Telemetri", to: "/dashboard/history", icon: "i-lucide-chart-no-axes-column-increasing" },
    { label: "Peringatan", to: "/dashboard/alerts", icon: "i-lucide-triangle-alert" },
  ],
  [
    { label: "Tools", type: "label" },
    { label: "Simulator", to: "/dashboard/simulator", icon: "i-lucide-radio-tower" },
  ],
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
  />
</template>
