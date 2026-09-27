<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const items = ref<NavigationMenuItem[][]>([
  [
    { label: "Dashboard", type: "label" },
    { label: "Beranda", to: "/dashboard", icon: "i-lucide-layout-dashboard" },
  ],
  [
    { label: "Master Data", type: "label" },
    { label: "Manajemen Anggota", to: "/dashboard/users", icon: "i-lucide-users" },
  ],
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
  />
</template>
