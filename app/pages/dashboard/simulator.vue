<script setup lang="ts">
import SimulatorContainer from "~/features/simulator/SimulatorContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Simulator",
    },
  },
});

useHead({
  title: "Simulator · Dashboard IoT",
});
</script>

<template>
  <SimulatorContainer />
</template>
