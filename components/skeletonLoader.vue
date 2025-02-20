<script setup lang="ts">
defineProps({
  loader:{
    type:Boolean,
    default:false
  }
})
</script>

<template>
  <div class="flex justify-between items-center">
    <transition name="fade">
      <USkeleton v-if="loader" class="h-6 w-[150px]" />
      <h2 v-else class="text-lg font-semibold">Table Title</h2>
    </transition>

    <transition name="fade">
      <USkeleton v-if="loader" class="h-10 w-[100px]" />
      <UButton v-else color="primary">Add</UButton>
    </transition>
  </div>


  <!-- Table Skeleton -->
  <transition name="fade">
    <div v-if="loader" class="border border-gray-200 rounded-lg shadow-sm p-4">
      <div class="grid grid-cols-4 gap-4 pb-2 border-b">
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
        <USkeleton class="h-4 w-full" />
      </div>
      <div class="space-y-3 mt-4">
        <div v-for="i in 5" :key="i" class="grid grid-cols-4 gap-4">
          <USkeleton class="h-6 w-full" />
          <USkeleton class="h-6 w-full" />
          <USkeleton class="h-6 w-full" />
          <USkeleton class="h-6 w-full" />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>

</style>