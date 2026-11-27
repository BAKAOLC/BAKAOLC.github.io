<template>
  <div class="home-page">
    <PersonalSection />
  </div>
</template>

<script setup lang="ts">
import PersonalSection from '@/components/PersonalSection.vue';
</script>

<style scoped>
@reference "@/assets/styles/main.css";

.home-page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
