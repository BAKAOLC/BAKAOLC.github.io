<script setup lang="ts">
import { computed } from 'vue';

import { icons } from '../icons';

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 });
const component = computed(() => icons[props.name] ?? icons.Boxes);
</script>

<template>
  <component :is="component" :size="size" :stroke-width="1.8" aria-hidden="true" />
</template>
