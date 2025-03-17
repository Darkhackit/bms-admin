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
const loadCountries = ref(false)
const loadRate = ref(false)
const showEditRate = ref(true)
const showRate = ref(true)
const q = ref('')
const rows = ref([])
const errors = ref([])
const error = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const services = ref([])
const rates = ref([])
const ed_rates = ref([])
const editMode = ref(true)
const countries = ref([])
const queryCountry = ref("")
const queryService = ref("")
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
  rate_id:'',
  rate:'',
  service:'',
  service_id:'',
  country:'',
  country_id:'',
  description:'',
  sms_count:0,
  price:0,
  validity_days:0,
  renewable:false,
  max_users:0,
  discount_rate:0,
  expiry_date:'2099-01-01',
  is_featured:false,
  minimum_balance:0,
  active:false,
  manual:false
})
const canEditPermission = computed(() => can('show', 'package') || can('manage', 'all'));
const canDeletePermission = computed(() => can('delete', 'package') || can('manage', 'all'));
const editForm = ref({
  id:'',
  name:'',
  rate_id:'',
  rate:'',
  service:'',
  service_id:'',
  country:'',
  country_id:'',
  description:'',
  sms_count:0,
  price:0,
  validity_days:0,
  renewable:false,
  max_users:0,
  discount_rate:0,
  expiry_date:'2099-01-01',
  is_featured:false,
  minimum_balance:0,
  active:false,
  manual:false
})
const columns = ref([
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key:"service_name",
    label:"Service"
  },
  {
    key:"country_name",
    label:"Country"
  },
  {
    key:"sms_count",
    label:"Sms Count"
  },
  {
    key:"price",
    label:"Price"
  },
  {
    key:"type",
    label:"Type"
  },
  {
    key:"created_by",
    label:"Created By"
  },
  {
    key:"created_at",
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
]

watch(() => form.value.rate, (newRate) => {
  if (newRate?.rate) {
    // Recalculate both since rate affects both
    if (form.value.price > 0) {
      return  calculateSmsCount()
    }else if (form.value.sms_count > 0) {
       return calculateSmsCount()
    }else {
      form.value.price = 0
      form.value.sms_count = 0
    }
  } else {
    form.value.price = 0
    form.value.sms_count = 0
  }
})
watch(() => editForm.value.rate, (newRate) => {
  if(editMode.value) {
    if (newRate?.rate) {
      // Recalculate both since rate affects both
      if (editForm.value.price > 0) {
        return calculateEditSmsCount()
      } else if (editForm.value.sms_count > 0) {
        return calculateEditSmsCount()
      } else {
        editForm.value.price = 0
        editForm.value.sms_count = 0
      }
    } else {
      editForm.value.price = 0
      editForm.value.sms_count = 0
    }
  }
})

const calculateEditSmsCount = () => {
  if (editMode.value) {

    const rate = parseFloat(editForm.value.rate?.rate)
    const minCount = parseFloat(editForm.value.rate?.minCount)
    const maxCount = parseFloat(editForm.value.rate?.maxCount)

    if (!editForm.value.manual) {

      // Calculate sms_count when price is changed
      if (rate && editForm.value.price) {
        if (editForm.value.price > maxCount) {
          editForm.value.sms_count = Math.floor(maxCount / rate)
          editForm.value.price = maxCount
        }else if (editForm.value.price < minCount) {
          editForm.value.sms_count = Math.floor(minCount / rate)
          editForm.value.price = minCount
        }else {
          editForm.value.sms_count = Math.floor(parseFloat(editForm.value.price) / rate)
        }
      } else {
        editForm.value.sms_count = 0
      }
    }
  }
}

const calculateSmsCount = () => {
  const rate = parseFloat(form.value.rate?.rate)
  const minCount = parseFloat(form.value.rate?.minCount)
  const maxCount = parseFloat(form.value.rate?.maxCount)

  if(!form.value.manual) {
    // Calculate sms_count when price is changed
    if (rate && form.value.price) {
      if (form.value.price > maxCount) {
        form.value.sms_count = Math.floor(maxCount / rate)
        form.value.price = maxCount
      }else if (form.value.price < minCount) {
        form.value.sms_count = Math.floor(minCount / rate)
        form.value.price = minCount
      }else {
        form.value.sms_count = Math.floor(parseFloat(form.value.price) / rate)
      }
    } else {
      form.value.sms_count = 0
    }
  }
}

const addData = async () => {
  processing.value = true
  try {
    form.value.rate_id = form.value.rate?.id
    form.value.service_id = form.value.service?.id
    form.value.country_id = form.value.country?.id
    await api.post("/packages", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    isOpen.value = false
    toast.add({
      title:"Package Added Successfully",
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
  editForm.value.rate_id = editForm.value.rate?.id
  editForm.value.service_id = editForm.value.service?.id
  editForm.value.country_id = editForm.value.country?.id
  try {
    await api.patch(`/packages/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    toast.add({
      title:"Package Updated Successfully",
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
  editMode.value = false
  try {
    let response = await api.get(`/packages/${id}`)
    console.log(response)
    editForm.value.id = response.data.data?.id
    editForm.value.name = response.data.data?.name
    editForm.value.rate = response.data.data?.rate
    editForm.value.service = response.data.data?.service
    editForm.value.country = response.data.data?.country
    editForm.value.sms_count = response.data.data?.sms_count
    editForm.value.manual = response.data.data?.manual
    editForm.value.price = response.data.data?.price
    editForm.value.active = response.data.data?.active
    editForm.value.description = response.data.data?.description
    editForm.value.is_featured = response.data.data?.is_featured
    editForm.value.minimum_balance = response.data.data?.minimum_balance
    editForm.value.max_users = response.data.data?.max_users
    editForm.value.validity_days = response.data.data?.validity_days
    editForm.value.renewable = response.data.data?.renewable
    editForm.value.expiry_date = convertDate(response.data.data?.expiry_date)
    editForm.value.discount_rate = response.data.data?.discount_rate
    processing.value = false
    editModal.value = true
  }catch (e) {
    console.log(e)
    processing.value = false
    editMode.value = true
  }

}

const getData = async () => {
  const params = {
    search:q.value,
    page : page.value,
    size:size.value,
    service_name : queryService.value?.name,
    country_code: queryCountry.value?.code
  }
  processing.value = true
  try{
    let response = await api.get("/packages",{params})
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
      await api.delete(`/packages/${id}`)
      await getData()
      processing.value = false
      toast.add({
        title:"Package Deleted Successfully",
      })
    }catch (e) {
      console.log(e)
      processing.value = false
    }
  }
}
const getService = async (q) => {
  loadService.value = true
  editMode.value = false
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
    editMode.value = true
    return services.value
  }catch (e) {
    console.log(e)
    loadService.value = false
    editMode.value = true
  }
}
const getRate = async (q) => {
  loadRate.value = true
  editMode.value = false
  const params = {
    rate_name:q,
    country_name:form.value.country?.name ?? 'xxx',
    service_name:form.value.service?.name
  }
  if (!form.value.country) {
    loadRate.value = false
    editMode.value = true
    return  rates.value = []
  }
  try{
    let response = await api.get("/rates",{params})
    if (response.data.data == null) {
      rates.value = []
    }else {
      rates.value = response.data.data
    }
    loadRate.value = false
    editMode.value = true
    return rates.value
  }catch (e) {
    console.log(e)
    loadRate.value = false
    editMode.value = true
  }
}

const getEditRate = async (q , n) => {

   loadRate.value = true
  editMode.value = false
   const params = {
     rate_name:q,
     country_name:n ?? editForm.value.country?.name,
     service_name:editForm.value.service?.name
   }
   try{
     let response = await api.get("/rates",{params})
     if (response.data.data == null) {
       ed_rates.value = []
     }else {
       ed_rates.value = response.data.data
     }
     loadRate.value = false
     editMode.value = true
     return ed_rates.value
   }catch (e) {
     console.log(e)
     loadRate.value = false
     editMode.value = true
   }
}

const getCountries = async (q) => {
  loadCountries.value = true
  const params = {
    name:q
  }
  editMode.value = false
  try{
    let response = await api.get("/countries",{params})
    if (response.data.data == null) {
      countries.value = []
    }else {
      countries.value = response.data.data
    }
    loadCountries.value = false
    editMode.value = true
    return countries.value
  }catch (e) {
    console.log(e)
    loadCountries.value = false
    editMode.value = true
  }
}
const countryChanged = async (e) => {
  showRate.value = false
  form.value.rate = ""
  await getRate()
  showRate.value = true
}

const countryEditChanged = async (e) => {
    editMode.value = false
    showEditRate.value = false
    editForm.value.rate = ""
    editForm.value.sms_count = 0
    editForm.value.price = 0
    await getEditRate("", "xxx")
    showEditRate.value = true
    editMode.value = true
}

onMounted(async () => {
  await getData()
  loader.value = false
})

const convertDate = (dateString) => {
  const date = new Date(dateString);

  const year = date.getUTCFullYear(); // Get last 2 digits of the year
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getUTCDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`
}

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
              <h1 class="uppercase font-medium">Packages</h1>
            </div>
            <div v-if="$can('manage','all') || $can('add','package')">
              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Package</UButton>
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <UInput v-model="q" clearable  placeholder="Filter package..." />
              <div class="space-y-2">
                <USelectMenu
                    v-model="queryService"
                    :options="services"
                    :searchable="getService"
                    placeholder="Select Type"
                    option-attribute="name">
                  <template #label>
                    <span v-if="queryService" class="truncate">{{ queryService.name }}</span>
                    <span v-else>Select service</span>
                  </template>
                </USelectMenu>
              </div>
              <div class="space-y-2">
                <USelectMenu
                    v-model="queryCountry"
                    :options="countries"
                    :searchable="getCountries"
                    placeholder="Select Type"
                    option-attribute="name">
                  <template #label>
                    <span v-if="queryCountry" class="truncate">{{ queryCountry.name }}</span>
                    <span v-else>Select country</span>
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
            <template #type-data="{ row }">
              <div>
                <p > {{ row.rate_type === "exp" ? 'Expiry' : 'Non Expiry' }}</p>
              </div>
            </template>
            <template #created_at-data="{ row }">
              <p> {{new Date(row.created_at).toLocaleDateString('en-US',{
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
            <template #price-data="{ row }">
              <p> {{row.currency}} {{row.price.toFixed(2)}}</p>
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
    <UModal v-model="isOpen" prevent-close :ui="{ width: 'w-full',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Add Package
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="addData">
            <div class="space-y-2">
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Service</label>
                  <USelectMenu
                      v-model="form.service"
                      :options="services"
                      :searchable="getService"
                      placeholder="Select Type"
                      option-attribute="name">
                    <template #label>
                      <span v-if="form.service" class="truncate">{{ form.service.name }}</span>
                      <span v-else>Select service</span>
                    </template>
                  </USelectMenu>
                  <small class="text-red-500" v-if="errors?.service">{{errors.service}}</small>
                </div>
                <div class="space-y-2">
                  <label>Country</label>
                  <USelectMenu
                      v-model="form.country"
                      :options="countries"
                      :disabled="!form.service"
                      :searchable="getCountries"
                      placeholder="Select Type"
                      @change="countryChanged(e)"
                      option-attribute="name">
                    <template #label>
                      <span v-if="form.country" class="truncate">{{ form.country.name }}</span>
                      <span v-else>Select country</span>
                    </template>
                  </USelectMenu>
                  <small class="text-red-500" v-if="errors?.country_id">{{errors.country_id}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2" v-if="showRate">
                  <label>Rate</label>
                  <USelectMenu
                      v-model="form.rate"
                      :options="rates"
                      :searchable="getRate"
                      placeholder="Select Type"
                      option-attribute="name">
                    <template #label>
                      <span v-if="form.rate" class="truncate">{{ form.rate?.name }}</span>
                      <span v-else>Select rate</span>
                    </template>
                  </USelectMenu>
                  <small class="text-red-500" v-if="errors?.rate_id">{{errors.rate_id}}</small>
                </div>
              </div>
             <div class="grid grid-cols-2 space-x-2">
               <div class="space-y-2">
                 <label>Name</label>
                 <UInput v-model="form.name" @input="clearErrors('name')" :input-class="errors.name ? 'border border-red-500' :''"  placeholder="Name"  />
                 <small class="text-red-500" v-if="errors?.name">{{errors.name}}</small>
               </div>
               <div class="space-y-2">
                 <label>Sms Count</label>
                 <UInput v-model="form.sms_count"  @input="clearErrors('sms_count')" type="number" @change="calculateSmsCount"  :input-class="errors.sms_count ? 'border border-red-500' :''"  placeholder="Sms Count"  />
                 <small class="text-red-500" v-if="errors?.sms_count">{{errors.sms_count}}</small>
               </div>
             </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Price</label>
                  <UInput v-model="form.price" :min="!form.manual ? form.rate?.minCount : ''" :max="!form.manual ? form.rate?.maxCount : ''" @input="clearErrors('price')" @change="calculateSmsCount"  type="number"  :input-class="errors.price ? 'border border-red-500' :''"  placeholder="Price"  />
                  <small class="text-red-500" v-if="errors?.price">{{errors.price}}</small>
                </div>
                <div class="space-y-2" v-if="form.rate?.type === 'exp'">
                  <label>Validity Days</label>
                  <UInput v-model="form.validity_days" @input="clearErrors('validity_days')"  type="number" :input-class="errors.validity_days ? 'border border-red-500' :''"  placeholder="Days"  />
                  <small class="text-red-500" v-if="errors?.validity_days">{{errors.validity_days}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Max Users</label>
                  <UInput v-model="form.max_users" @input="clearErrors('max_users')" type="number" :input-class="errors.max_users ? 'border border-red-500' :''"  placeholder="Max Users"  />
                  <small class="text-red-500" v-if="errors?.max_users">{{errors.max_users}}</small>
                </div>
                <div class="space-y-2">
                  <label>Discount Rate</label>
                  <UInput v-model="form.discount_rate" @input="clearErrors('discount_rate')"  type="number" :input-class="errors.discount_rate ? 'border border-red-500' :''"  placeholder="Discount Rate"  />
                  <small class="text-red-500" v-if="errors?.discount_rate">{{errors.discount_rate}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Expiry Date</label>
                  <UInput v-model="form.expiry_date" @input="clearErrors('expiry_date')" type="date" :input-class="errors.expiry_date ? 'border border-red-500' :''"  placeholder="Expiry Date"  />
                  <small class="text-red-500" v-if="errors?.expiry_date">{{errors.expiry_date}}</small>
                </div>
                <div class="space-y-2">
                  <label>Minimum Balance</label>
                  <UInput v-model="form.minimum_balance" @input="clearErrors('minimum_balance')" :input-class="errors.minimum_balance ? 'border border-red-500' :''"  placeholder="Minimum Balance"  />
                  <small class="text-red-500" v-if="errors?.minimum_balance">{{errors.minimum_balance}}</small>
                </div>
              </div>
              <div class="space-y-2">
                <label>Description</label>
                <UTextarea v-model="form.description" @input="clearErrors('description')" :input-class="errors.description ? 'border border-red-500' :''"  placeholder="Minimum Balance"  />
                <small class="text-red-500" v-if="errors?.description">{{errors.description}}</small>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <UCheckbox v-model="form.active" name="active" label="Active" />
                </div>
                <div class="space-y-2">
                  <UCheckbox v-model="form.renewable" name="renewable" label="Renewable" />
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <UCheckbox v-model="form.is_featured" name="Featured" label="Featured" />
                </div>
                <div class="space-y-2">
                  <UCheckbox v-model="form.manual" name="manual" label="Manual" />
                </div>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','package')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Package</UButton>
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
              Update Package
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="editModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="updateData">
            <div class="space-y-2">
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Service</label>
                  <USelectMenu
                      v-model="editForm.service"
                      :options="services"
                      :searchable="getService"
                      placeholder="Select Type"
                      option-attribute="name">
                    <template #label>
                      <span v-if="editForm.service" class="truncate">{{ editForm.service.name }}</span>
                      <span v-else>Select service</span>
                    </template>
                  </USelectMenu>
                  <small class="text-red-500" v-if="error?.service">{{error.service}}</small>
                </div>
                <div class="space-y-2">
                  <label>Country</label>
                  <USelectMenu
                      v-model="editForm.country"
                      :options="countries"
                      :disabled="!editForm.service"
                      :searchable="getCountries"
                      placeholder="Select Type"
                      @change="countryEditChanged(e)"
                      option-attribute="name">
                    <template #label>
                      <span v-if="editForm.country" class="truncate">{{ editForm.country.name }}</span>
                      <span v-else>Select country</span>
                    </template>
                  </USelectMenu>
                  <small class="text-red-500" v-if="error?.country_id">{{error.country_id}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2" v-if="showEditRate">
                  <label>Rate</label>
                  <USelectMenu
                      v-model="editForm.rate"
                      :options="ed_rates"
                      :searchable="getEditRate"
                      placeholder="Select Type"
                      option-attribute="name">
                    <template #label>
                      <span v-if="editForm.rate" class="truncate">{{ editForm.rate?.name }}</span>
                      <span v-else>Select rate</span>
                    </template>
                  </USelectMenu>
                  <small class="text-red-500" v-if="error?.rate_id">{{error.rate_id}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Name</label>
                  <UInput v-model="editForm.name" @input="clearError('name')" :input-class="error.name ? 'border border-red-500' :''"  placeholder="Name"  />
                  <small class="text-red-500" v-if="error?.name">{{error.name}}</small>
                </div>
                <div class="space-y-2">
                  <label>Sms Count</label>
                  <UInput v-model="editForm.sms_count"  @input="clearError('sms_count')" type="number" @change="calculateEditSmsCount"  :input-class="error.sms_count ? 'border border-red-500' :''"  placeholder="Sms Count"  />
                  <small class="text-red-500" v-if="error?.sms_count">{{error.sms_count}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Price</label>
                  <UInput v-model="editForm.price" :min="!editForm.manual ? editForm.rate?.minCount : ''" :max="!editForm.manual ? editForm.rate?.maxCount : ''" @input="clearError('price')" @change="calculateEditSmsCount"  type="number"  :input-class="error.price ? 'border border-red-500' :''"  placeholder="Price"  />
                  <small class="text-red-500" v-if="error?.price">{{error.price}}</small>
                </div>
                <div class="space-y-2" v-if="editForm.rate?.type === 'exp'">
                  <label>Validity Days</label>
                  <UInput v-model="editForm.validity_days" @input="clearError('validity_days')"  type="number" :input-class="error.validity_days ? 'border border-red-500' :''"  placeholder="Days"  />
                  <small class="text-red-500" v-if="error?.validity_days">{{error.validity_days}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Max Users</label>
                  <UInput v-model="editForm.max_users" @input="clearError('max_users')" type="number" :input-class="error.max_users ? 'border border-red-500' :''"  placeholder="Max Users"  />
                  <small class="text-red-500" v-if="error?.max_users">{{error.max_users}}</small>
                </div>
                <div class="space-y-2">
                  <label>Discount Rate</label>
                  <UInput v-model="editForm.discount_rate" @input="clearError('discount_rate')"  type="number" :input-class="error.discount_rate ? 'border border-red-500' :''"  placeholder="Discount Rate"  />
                  <small class="text-red-500" v-if="error?.discount_rate">{{error.discount_rate}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Expiry Date</label>
                  <UInput v-model="editForm.expiry_date" @input="clearError('expiry_date')" type="date" :input-class="error.expiry_date ? 'border border-red-500' :''"  placeholder="Expiry Date"  />
                  <small class="text-red-500" v-if="error?.expiry_date">{{error.expiry_date}}</small>
                </div>
                <div class="space-y-2">
                  <label>Minimum Balance</label>
                  <UInput v-model="editForm.minimum_balance" @input="clearError('minimum_balance')" :input-class="error.minimum_balance ? 'border border-red-500' :''"  placeholder="Minimum Balance"  />
                  <small class="text-red-500" v-if="error?.minimum_balance">{{error.minimum_balance}}</small>
                </div>
              </div>
              <div class="space-y-2">
                <label>Description</label>
                <UTextarea v-model="editForm.description" @input="clearError('description')" :input-class="error.description ? 'border border-red-500' :''"  placeholder="Minimum Balance"  />
                <small class="text-red-500" v-if="error?.description">{{error.description}}</small>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <UCheckbox v-model="editForm.active" name="active" label="Active" />
                </div>
                <div class="space-y-2">
                  <UCheckbox v-model="editForm.renewable" name="renewable" label="Renewable" />
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <UCheckbox v-model="editForm.is_featured" name="Featured" label="Featured" />
                </div>
                <div class="space-y-2">
                  <UCheckbox v-model="editForm.manual" name="manual" label="Manual" />
                </div>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','package')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Package</UButton>
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