<template>
  <div class="home-page">
    <personal-section />
    <screen-manager-test />
  </div>
</template>

<script setup lang="ts">
import PersonalSection from '@/components/PersonalSection.vue';
import ScreenManagerTest from '@/components/ScreenManagerTest.vue';
</script>

<style scoped>
.home-page {
  @apply h-full;
  @apply flex flex-col;
  @apply overflow-auto;
}
</style>
