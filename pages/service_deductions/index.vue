<script setup>
import api from "~/utils/api.js";
import SkeletonLoader from "~/components/skeletonLoader.vue";
import {useAbility} from "@casl/vue";

const toast = useToast();
const {can} = useAbility();
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
const countries = ref([])
const services = ref([])
const querySender = ref("")
const queryReceiver = ref("")
const queryService = ref("")
const loadCountries = ref(false)
const loadServices = ref(false)
const canEditRole = computed(() => can('show', 'service_deduction') || can('manage', 'all'));
const canDeleteRole = computed(() => can('delete', 'service_deduction') || can('manage', 'all'));
const form = ref({
  service:'',
  service_id:'',
  sender_country:'',
  sender_country_id:'',
  receiver_country:'',
  receiver_country_id:'',
  unit_deduction:0
})
const editForm = ref({
  id:'',
  service:'',
  service_id:'',
  sender_country:'',
  sender_country_id:'',
  receiver_country:'',
  receiver_country_id:'',
  unit_deduction:0
})
const columns = ref([
  {
    key: "service_name",
    label: "Service",
    sortable: true,
  },
  {
    key:"sender_country_name",
    label:"Sender Country",
    sortable: true,
  },
  {
    key:"receiver_country_name",
    label:"Receiver Country",
    sortable: true,
  },
  {
    key:"unit_deduction",
    label:"Unit Deduction",
    sortable: true,
  },
  {
    key:"created_at",
    label: "Created At",
  },
  {
    key:"updated_at",
    label: "Updated At",
  },
  {
    key:"action",
    label: "Actions",
  }
])
const items = row => [
  [canEditRole.value ? {
    label: 'Edit',
    icon: 'i-heroicons-pencil-square-20-solid',
    click: () => getSingleData(row.id)
  }:{}],
  [canDeleteRole.value ?{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    click: () => deleteData(row.id)
  }:{}]
]

const addData = async () => {
  processing.value = true
  try {
    form.value.service_id = form.value.service?.id
    form.value.sender_country_id = form.value.sender_country?.id
    form.value.receiver_country_id = form.value.receiver_country?.id
    await api.post("/service_deduction", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    isOpen.value = false
    toast.add({
      title:"Service Deduction Added Successfully",
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
  editForm.value.service_id = editForm.value.service?.id
  editForm.value.sender_country_id = editForm.value.sender_country?.id
  editForm.value.receiver_country_id = editForm.value.receiver_country?.id
  try {
    await api.patch(`/service_deduction/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    toast.add({
      title:"Service Deduction Updated Successfully",
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
    let response = await api.get(`/service_deduction/${id}`)
    console.log(response)
    editForm.value.id = response.data.data?.id
    editForm.value.service = response.data.data?.service_id
    editForm.value.sender_country = response.data.data?.sender_country_id
    editForm.value.receiver_country = response.data.data?.receiver_country_id
    editForm.value.unit_deduction = response.data.data?.unit_deduction?.toString()
    processing.value = false
    editModal.value = true
  }catch (e) {
    console.log(e)
    processing.value = false
  }
}

const getData = async () => {
  const params = {
    service_name:queryService.value?.name,
    sender_country_name:querySender.value?.name,
    receiver_country_name:queryReceiver.value?.name,
    page : page.value,
    size:size.value
  }
  processing.value = true
  try{
    let response = await api.get("/service_deduction",{params})
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

watch(() => page.value,async (v) => {
  await getData()
})

const deleteData = async (id) => {
  if (confirm('Are you sure?')) {
    processing.value = true
    try {
      await api.delete(`/service_deduction/${id}`)
      await getData()
      processing.value = false
      toast.add({
        title:"Service Deduction Deleted Successfully",
      })
    }catch (e) {
      console.log(e)
      processing.value = false
    }
  }
}

const getCountries = async (q) => {
  loadCountries.value = true
  const params = {
    name:q
  }
  try{
    let response = await api.get("/countries",{params})
    if (response.data.data == null) {
      countries.value = []
    }else {
      countries.value = response.data.data
    }
    loadCountries.value = false
    return countries.value
  }catch (e) {
    console.log(e)
    loadCountries.value = false
  }
}
const getServices = async (q) => {
  loadServices.value = true
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
    loadServices.value = false
    return services.value
  }catch (e) {
    console.log(e)
    loadServices.value = false
  }
}
onMounted(async () => {
  await getData()
  // await getPermissions()
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
              <h1 class="uppercase font-medium">Service Deduction</h1>
            </div>
            <div v-if="$can('manage','all') || $can('add','service_deduction')">
              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Service Deduction</UButton>
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
<!--              <UInput v-model="q" clearable  placeholder="Filter service deduction..." />-->
              <div class="">
                <USelectMenu
                    v-model="queryService"
                    :options="services"
                    :searchable="getServices"
                    placeholder="Select Service"
                    option-attribute="name">
                  <template #label>
                    <span v-if="queryService" class="truncate">{{ queryService.name }}</span>
                    <span v-else>Select Service</span>
                  </template>
                </USelectMenu>
              </div>
              <div class="">
                <USelectMenu
                    v-model="querySender"
                    :options="countries"
                    :searchable="getCountries"
                    placeholder="Select Service"
                    option-attribute="name">
                  <template #label>
                    <span v-if="querySender" class="truncate">{{ querySender.name }}</span>
                    <span v-else>Select Sender Country</span>
                  </template>
                </USelectMenu>
              </div>
              <div class="">
                <USelectMenu
                    v-model="queryReceiver"
                    :options="countries"
                    :searchable="getCountries"
                    placeholder="Select Service"
                    option-attribute="name">
                  <template #label>
                    <span v-if="queryReceiver" class="truncate">{{ queryReceiver.name }}</span>
                    <span v-else>Select Receiver Country</span>
                  </template>
                </USelectMenu>
              </div>
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
            <UPagination v-model="page"  :total="total" />
          </div>
        </div>
      </div>
    </transition>
  </UCard>
  <!--Add Modal-->
  <div>
    <UModal v-model="isOpen" prevent-close :ui="{ width: 'w-[60%]',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Add Service Deduction
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="addData">
            <div class="space-y-4">
              <div class="space-y-2">
                <label>Service</label>
                <USelectMenu
                    v-model="form.service"
                    :options="services"
                    :searchable="getServices"
                    placeholder="Select Service"
                    option-attribute="name">
                  <template #label>
                    <span v-if="form.service" class="truncate">{{ form.service.name }}</span>
                    <span v-else>Select service</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="errors?.service">{{errors.service}}</small>
              </div>
              <div class="space-y-2">
                <label>Sender Country</label>
                <USelectMenu
                    v-model="form.sender_country"
                    :options="countries"
                    :searchable="getCountries"
                    placeholder="Select Sender Country"
                    option-attribute="name">
                  <template #label>
                    <span v-if="form.sender_country" class="truncate">{{ form.sender_country.name }}</span>
                    <span v-else>Select Sender Country</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="errors?.sender_country">{{errors.sender_country}}</small>
              </div>
              <div class="space-y-2">
                <label>Receiver Country</label>
                <USelectMenu
                    v-model="form.receiver_country"
                    :options="countries"
                    :searchable="getCountries"
                    placeholder="Select Receiver Country"
                    option-attribute="name">
                  <template #label>
                    <span v-if="form.receiver_country" class="truncate">{{ form.receiver_country.name }}</span>
                    <span v-else>Select Receiver Country</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="errors?.receiver_country">{{errors.receiver_country}}</small>
              </div>
              <div class="space-y-2">
                <label>Unit Deduction</label>
                <UInput v-model="form.unit_deduction" @input="clearErrors('unit_deduction')" :input-class="errors.unit_deduction ? 'border border-red-500' :''"  placeholder="Unit Deduction"  />
                <small class="text-red-500" v-if="errors?.unit_deduction">{{errors.unit_deduction}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','service_deduction')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Service Deduction</UButton>
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
    <UModal v-model="editModal" prevent-close :ui="{ width: 'w-[50%]',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Update Service Deduction
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="editModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="updateData">
            <div class="space-y-4">
              <div class="space-y-2">
                <label>Service</label>
                <USelectMenu
                    v-model="editForm.service"
                    :options="services"
                    :searchable="getServices"
                    placeholder="Select Service"
                    option-attribute="name">
                  <template #label>
                    <span v-if="editForm.service" class="truncate">{{ editForm.service.name }}</span>
                    <span v-else>Select service</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.service">{{error.service}}</small>
              </div>
              <div class="space-y-2">
                <label>Sender Country</label>
                <USelectMenu
                    v-model="editForm.sender_country"
                    :options="countries"
                    :searchable="getCountries"
                    placeholder="Select Sender Country"
                    option-attribute="name">
                  <template #label>
                    <span v-if="editForm.sender_country" class="truncate">{{ editForm.sender_country.name }}</span>
                    <span v-else>Select Sender Country</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.sender_country">{{error.sender_country}}</small>
              </div>
              <div class="space-y-2">
                <label>Receiver Country</label>
                <USelectMenu
                    v-model="editForm.receiver_country"
                    :options="countries"
                    :searchable="getCountries"
                    placeholder="Select Receiver Country"
                    option-attribute="name">
                  <template #label>
                    <span v-if="editForm.receiver_country" class="truncate">{{ editForm.receiver_country.name }}</span>
                    <span v-else>Select Receiver Country</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.receiver_country">{{error.receiver_country}}</small>
              </div>
              <div class="space-y-2">
                <label>Unit Deduction</label>
                <UInput v-model="editForm.unit_deduction" @input="clearError('unit_deduction')" type="text" :input-class="error.unit_deduction ? 'border border-red-500' :''"  placeholder="Unit Deduction"  />
                <small class="text-red-500" v-if="error?.unit_deduction">{{error.unit_deduction}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','service_deduction')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Service Deduction</UButton>
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