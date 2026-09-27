<script setup lang="ts">
import DevicesContainer from "~/features/devices/DevicesContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Perangkat",
    },
  },
});

useHead({
  title: "Perangkat · Dashboard IoT",
});
</script>

<template>
  <DevicesContainer />
</template>
