<script setup>
import api from "~/utils/api.js";
import SkeletonLoader from "~/components/skeletonLoader.vue";
import {useAbility} from "@casl/vue";

const toast = useToast();
const {can} = useAbility()
const processing = ref(false)
const isOpen = ref(false)
const editModal = ref(false)
const loader = ref(true)
const loadService = ref(false)
const q = ref('')
const rows = ref([])
const errors = ref([])
const error = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const services = ref([])
const type = ref([
  {
    val:'Expiry',
    name:"exp"
  },
  {
    val:'Non Expiry',
    name:'non_exp'
  }
])
const form = ref({
  name:'',
  type:'',
  rate:0,
  service:''
})
const canEditPermission = computed(() => can('show', 'rate') || can('manage', 'all'));
const canDeletePermission = computed(() => can('delete', 'rate') || can('manage', 'all'));
const canViewRateHistory = computed(() => can('show', 'rate history') || can('manage', 'all'));
const editForm = ref({
  id:'',
  name:'',
  type:'',
  rate:'',
  service:'',
  reason:''
})
const columns = ref([
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key:"service",
    label:"Service"
  },
  {
    key:"rate",
    label:"Rate"
  },
  {
    key:"type",
    label:"Type"
  },
  {
    key:"createdBy",
    label:"Created By"
  },
  {
    key:"historyCount",
    label: "History",
    sortable: true,
  },
  {
    key:"createdAt",
    label: "Created At",
    sortable: true,
  },

  {
    key:"action",
    label: "Actions",
  }
])
const items = row => [
  [canEditPermission.value ?{
    label: 'Edit',
    icon: 'i-heroicons-pencil-square-20-solid',
    click: () => getSingleData(row.id)
  }:{}],
  [canDeletePermission.value ?{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    click: () => deleteData(row.id)
  }:{}],
  [canViewRateHistory.value ?{
    label: 'View History',
    icon: 'i-heroicons-arrow-top-right-on-square',
    click: () => gotoHistory(row.id)
  }:{}]
]

const addData = async () => {
  processing.value = true
  try {
    form.value.type = form.value.type?.name
    form.value.service = form.value.service?.id
    await api.post("/rates", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    isOpen.value = false
    toast.add({
      title:"Rate Added Successfully",
    })
  }catch (e) {
    console.log(e)
    if (e.response?.status === 422) {
      errors.value = e.response.data
    }
    if (e.response?.status === 500) {
      errors.value = {name:e.response?.data}
    }
    processing.value = false
  }
}

const updateData = async () => {
  processing.value = true
  editForm.value.type = editForm.value.type?.name
  editForm.value.service = editForm.value.service?.id
  try {
    await api.patch(`/rates/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    editForm.value.reason = ""
    toast.add({
      title:"Rate Updated Successfully",
    })
  }catch (e) {
    console.log(e)
    if (e.response?.status === 422) {
      error.value = e.response.data
    }
    processing.value = false
  }

}

const getSingleData = async (id) => {
  processing.value = true
  try {
    let response = await api.get(`/rates/${id}`)
    console.log(response)
    editForm.value.id = response.data.data?.id
    editForm.value.name = response.data.data?.name
    editForm.value.rate = response.data.data?.rate
    editForm.value.service = response.data.data?.service
    editForm.value.type = type.value.find(t => t.name === response.data.data?.type)
    processing.value = false
    editModal.value = true
  }catch (e) {
    console.log(e)
    processing.value = false
  }
}

const getData = async () => {
  const params = {
    search:q.value,
    page : page.value,
    size:size.value
  }
  processing.value = true
  try{
    let response = await api.get("/rates",{params})
    if (response.data.data == null) {
      rows.value = []
    }else {
      rows.value = response.data.data
      page.value = response.data.pages?.current_page
      size.value = response.data.pages.page_size
      total.value = response.data.pages?.total_count
    }
    processing.value = false
  }catch (e) {
    console.log(e)
    processing.value = false
  }
}
const clearErrors = field => {
  delete errors.value[field]
}
const clearError = field => {
  delete error.value[field]
}
const getSearchData = async () => {
  // if (q.value === "") return
  page.value = 1
  size.value = 0
  await getData()
}

const gotoHistory = async (id) => {
   await navigateTo({name : 'rates-history-id',params:{id:id}})
}
watch(() => page.value,async (v) => {
  await getData()
})

const deleteData = async (id) => {
  if (confirm('Are you sure?')) {
    processing.value = true
    try {
      await api.delete(`/rates/${id}`)
      await getData()
      processing.value = false
      toast.add({
        title:"Rate Deleted Successfully",
      })
    }catch (e) {
      console.log(e)
      processing.value = false
    }
  }
}
const getService = async (q) => {
  loadService.value = true
  const params = {
    search:q
  }
  try{
    let response = await api.get("/services",{params})
    if (response.data.data == null) {
      services.value = []
    }else {
      services.value = response.data.data
    }
    loadService.value = false
    if (editForm.value.service) {
      editForm.value.service = services.value.find(s => s.id === editForm.value.service)
    }
    return services.value
  }catch (e) {
    console.log(e)
    loadService.value = false
  }
}

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
              <h1 class="uppercase font-medium">Rates</h1>
            </div>
            <div v-if="$can('manage','all') || $can('add','rate')">
              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Rate</UButton>
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <UInput v-model="q" clearable  placeholder="Filter rate..." />
              <UButton color="black" variant="solid" @click.prevent="getSearchData" size="2xs">Search</UButton>
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
            <template #type-data="{ row }">
              <div>
                <p > {{ row.type === "exp" ? 'Expiry' : 'Non Expiry' }}</p>
              </div>
            </template>
            <template #createdAt-data="{ row }">
              <p> {{new Date(row.createdAt).toLocaleDateString('en-US',{
                year: 'numeric',
                month: 'long', // 'short' for abbreviated month names
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short' // Optional: to include the time zone
              })}}</p>
            </template>
            <template #updatedAt-data="{ row }">
              <p> {{new Date(row.updatedAt).toLocaleDateString('en-US',{
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
              Add Rate
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="addData">
            <div class="space-y-2">
              <div class="space-y-2">
                <label>Name</label>
                <UInput v-model="form.name" @input="clearErrors('name')" :input-class="errors.name ? 'border border-red-500' :''"  placeholder="Name"  />
                <small class="text-red-500" v-if="errors?.name">{{errors.name}}</small>
              </div>
              <div class="space-y-2">
                <label>Type</label>
                <USelectMenu
                    v-model="form.type"
                    :options="type"
                    placeholder="Select Type"
                    option-attribute="val">
                  <template #label>
                    <span v-if="form.type" class="truncate">{{ form.type.val }}</span>
                    <span v-else>Select rate</span>
                  </template>
                </USelectMenu>
                  <small class="text-red-500" v-if="errors?.type">{{errors.type}}</small>
              </div>
              <div class="space-y-2">
                <label>Rate</label>
                <UInput v-model="form.rate" @input="clearErrors('rate')" type="number" :input-class="errors.rate ? 'border border-red-500' :''"  placeholder="Rate"  />
                <small class="text-red-500" v-if="errors?.rate">{{errors.rate}}</small>
              </div>
              <div class="space-y-2">
                <label>Service</label>
                <USelectMenu
                    v-model="form.service"
                    :options="services"
                    option-attribute="name"
                    :loading="loadService"
                    :searchable="getService"
                    placeholder="Select Service"
                    >
                  <template #label>
                    <span v-if="form.service" class="truncate">{{ form.service.name }}</span>
                    <span v-else>Select rate</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="errors?.service">{{errors.service}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','rate')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Rate</UButton>
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
              Update Rate
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="editModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="updateData">
            <div class="space-y-2">
              <div class="space-y-2">
                <label>Name</label>
                <UInput v-model="editForm.name" @input="clearError('name')" :input-class="error.name ? 'border border-red-500' :''"  placeholder="Name"  />
                <small class="text-red-500" v-if="error?.name">{{error.name}}</small>
              </div>
              <div class="space-y-2">
                <label>Type</label>
                <USelectMenu
                    v-model="editForm.type"
                    :options="type"
                    placeholder="Select Type"
                    option-attribute="val">
                  <template #label>
                    <span v-if="editForm.type" class="truncate">{{ editForm.type.val }}</span>
                    <span v-else>Select rate</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.type">{{error.type}}</small>
              </div>
              <div class="space-y-2">
                <label>Rate</label>
                <UInput v-model="editForm.rate" @input="clearError('rate')" type="number" :input-class="error.rate ? 'border border-red-500' :''"  placeholder="Rate"  />
                <small class="text-red-500" v-if="error?.rate">{{error.rate}}</small>
              </div>
              <div class="space-y-2">
                <label>Service</label>
                <USelectMenu
                    v-model="editForm.service"
                    :options="services"
                    option-attribute="name"
                    :loading="loadService"
                    :searchable="getService"
                    placeholder="Select Service"
                >
                  <template #label>
                    <span v-if="editForm.service" class="truncate">{{ editForm.service.name }}</span>
                    <span v-else>Select rate</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.service">{{error.service}}</small>
              </div>
              <div class="space-y-2">
                <label>Reason</label>
                <UTextarea v-model="editForm.reason" @input="clearError('reason')" :input-class="error.reason ? 'border border-red-500' :''"  placeholder="Reason"  />
                <small class="text-red-500" v-if="error?.reason">{{error.reason}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','rate')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Rate</UButton>
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