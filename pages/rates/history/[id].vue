<script setup lang="ts">
import api from "~/utils/api.js";
import SkeletonLoader from "~/components/skeletonLoader.vue";
import type { DatePickerDate, DatePickerRangeObject } from 'v-calendar/dist/types/src/use/datePicker'
import 'v-calendar/dist/style.css'
import { sub, format, isSameDay } from 'date-fns'
import {DatePicker} from "v-calendar";
const route = useRoute();
const processing = ref(false)
const isOpen = ref(false)
const editModal = ref(false)
const loader = ref(true)
const q = ref('')
const rows = ref([])
const errors = ref([])
const error = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const form = ref({
  name:''
})
const editForm = ref({
  id:'',
  name:''
})
const columns = ref([
  {
    key: "rate_name",
    label: "Rate Name",
    sortable: true,
  },
  {
    key:"old_rate",
    label:"Old Rate"
  },
  {
    key:"new_rate",
    label:"New Rate"
  },
  {
    key:"change_reason",
    label:"Reason"
  },
  {
    key:"changed_at",
    label: "Created At",
    sortable: true,
  },
  {
    key:"created_by_email",
    label: "Created By",
    sortable: true,
  },
  {
    key:"action",
    label: "Actions",
  }
])
const items = row => [
]
const ranges = [
  { label: 'Last 7 days', duration: { days: 7 } },
  { label: 'Last 14 days', duration: { days: 14 } },
  { label: 'Last 30 days', duration: { days: 30 } },
  { label: 'Last 3 months', duration: { months: 3 } },
  { label: 'Last 6 months', duration: { months: 6 } },
  { label: 'Last year', duration: { years: 1 } }
]
const selected = ref({ start: sub(new Date(), { days: 14 }), end: new Date() })
const getData = async () => {
  const params = {
    search:q.value,
    page : page.value,
    size:size.value
  }
  processing.value = true
  try{
    let response = await api.get(`/rates/history/${route.params.id}`,{params})
    if (response.data.data == null) {
      rows.value = []
    }else {
      rows.value = response.data.data
      page.value = response.data.pages?.current_page
      size.value = response.data.pages.page_size
      total.value = response.data.pages.total_count
    }
    processing.value = false
  }catch (e) {
    console.log(e)
    processing.value = false
  }
}
function isRangeSelected(duration) {
  return isSameDay(selected.value.start, sub(new Date(), duration)) && isSameDay(selected.value.end, new Date())
}
function selectRange(duration) {
  selected.value = { start: sub(new Date(), duration), end: new Date() }
}

const getSearchData = async () => {
  // if (q.value === "") return
  page.value = 1
  size.value = 0
  await getData()
}

watch(() => page.value,async (v) => {
  await getData()
})

onMounted(async () => {
  await getData()
  loader.value = false
})

</script>

<template>
  <UCard class="bg-white   rounded-lg">
    <transition name="fade" mode="out-in">
      <div class="space-y-4" v-if="loader">
        <SkeletonLoader :loader="loader" />
      </div>
      <div v-else>
        <div>
          <div class="flex justify-between items-center">
            <div>
              <h1 class="uppercase font-medium"></h1>
            </div>
            <div>
<!--              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Permission</UButton>-->
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <UPopover :popper="{ placement: 'bottom-start' }">
                <UButton icon="i-heroicons-calendar-days-20-solid">
                  {{ format(selected.start, 'd MMM, yyy') }} - {{ format(selected.end, 'd MMM, yyy') }}
                </UButton>

                <template #panel="{ close }">
                  <div class="flex items-center sm:divide-x divide-gray-200 dark:divide-gray-800">
                    <div class="hidden sm:flex flex-col py-4">
                      <UButton
                          v-for="(range, index) in ranges"
                          :key="index"
                          :label="range.label"
                          color="gray"
                          variant="ghost"
                          class="rounded-none px-6"
                          :class="[isRangeSelected(range.duration) ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
                          truncate
                          @click="selectRange(range.duration)"
                      />
                    </div>
                    <DatePicker v-model="selected" @close="close" />
                  </div>
                </template>
              </UPopover>
            </div>
          </div>
          <UTable
              :loading="processing"
              :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
              :progress="{ color: 'purple', animation: 'carousel' }"
              class="w-full"
              :columns="columns"
              :rows="rows"
          >
            <template #action-data="{ row }">
              <UDropdown :items="items(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
              </UDropdown>
            </template>
            <template #roles-data="{ row }">
              <div>
                <p v-for="r in row.roles"> {{r.name + ' '}}</p>
              </div>
            </template>
            <template #changed_at-data="{ row }">
              <p> {{new Date(row.changed_at).toLocaleDateString('en-US',{
                year: 'numeric',
                month: 'long', // 'short' for abbreviated month names
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short' // Optional: to include the time zone
              })}}</p>
            </template>
          </UTable>

          <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
            <UPagination v-model="page" :total="total" />
          </div>
        </div>
      </div>
    </transition>
  </UCard>
  <!--Add Modal-->
  <div>
    <UModal v-model="isOpen" prevent-close :ui="{ width: 'w-[20%]',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Add Permission
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="addData">
            <div class="space-y-4">
              <div class="space-y-2">
                <label>Name</label>
                <UInput v-model="form.name" @input="clearErrors('name')" :input-class="errors.name ? 'border border-red-500' :''"  placeholder="Name"  />
                <small class="text-red-500" v-if="errors?.name">{{errors.name}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','permission')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Permission</UButton>
              </div>
            </div>
          </form>
        </div>
      </UCard>
    </UModal>
  </div>
  <!--End Add Modal-->

  <!--Edit Modal-->
  <div>
    <UModal v-model="editModal" prevent-close :ui="{ width: 'w-[40%]',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Update Permission
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="editModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="updateData">
            <div class="space-y-4">
              <div class="space-y-2">
                <label>Name</label>
                <UInput v-model="editForm.name" @input="clearError('name')" :input-class="error.name ? 'border border-red-500' :''"  placeholder="Name"  />
                <small class="text-red-500" v-if="error?.name">{{errors.name}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','permission')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Permission</UButton>
              </div>
            </div>
          </form>
        </div>
      </UCard>
    </UModal>
  </div>
  <!--End Edit Modal-->
</template>

<style scoped>
/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>