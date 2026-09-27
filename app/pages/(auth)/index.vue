<script setup lang="ts">
import LoginContainer from "~/features/auth/LoginContainer.vue";

definePageMeta({
  layout: "auth",
});
useHead({
  title: "Masuk · IoT Dashboard",
});
</script>

<template>
  <LoginContainer />
</template>
