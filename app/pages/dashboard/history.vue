<script setup lang="ts">
import TelemetryHistoryContainer from "~/features/history/TelemetryHistoryContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Riwayat Telemetri",
    },
  },
});

useHead({
  title: "Riwayat Telemetri · Dashboard IoT",
});
</script>

<template>
  <TelemetryHistoryContainer />
</template>
