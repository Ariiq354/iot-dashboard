<script setup lang="ts">
import AlertsContainer from "~/features/alerts/AlertsContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Peringatan",
    },
  },
});

useHead({
  title: "Peringatan · Dashboard IoT",
});
</script>

<template>
  <AlertsContainer />
</template>
