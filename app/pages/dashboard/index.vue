<script setup lang="ts">
import OverviewContainer from "~/features/dashboard/OverviewContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Beranda",
    },
  },
});

useHead({
  title: "Beranda · Dashboard IoT",
});
</script>

<template>
  <OverviewContainer />
</template>
