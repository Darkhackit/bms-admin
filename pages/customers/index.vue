<script setup>
import api from "~/utils/api.js";
import SkeletonLoader from "~/components/skeletonLoader.vue";
import {useAbility} from "@casl/vue";
const ws = useNuxtApp().$ws
const toast = useToast();
const {can} = useAbility()
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
const roles = ref([])
const permissions = ref([])
const main_users = ref([])
const total_customers = ref(0)
const active_customers = ref(0)
const disabled_customers = ref(0)
const verified_customers = ref(0)
const sub_customers = ref(0)
const main_customers = ref(0)
const loadRoles = ref(false)
const loadMainusers = ref(false)
const loadPermission = ref(false)
const canEditAdmin = computed(() => can('show', 'customer') || can('manage', 'all'));
const canDisableAdmin = computed(() => can('disable', 'customer') || can('manage', 'all'));
const options = ref(['all','disabled','verified','not_verified','active','main_account','sub_account'])
const status = ref("")
const start = ref("")
const end = ref("")
const account = ref("all")
const verification = ref("all")
const activeness = ref("all")
const form = ref({
  name:'',
  username:'',
  email:'',
  phone_number:'',
  dob:'',
  password:'',
  password_confirmation:'',
  sub_account:false,
  country_name:'',
  country_code:'',
  countries:"",
  users:"",
  user_id:''
})
const editForm = ref({
  id:'',
  name:'',
  username:'',
  email:'',
  phone_number:'',
  dob:'',
  sub_account:true,
  country_name:'',
  country_code:'',
  countries:"",
  users:"",
  user_id:'',
  permissions:[]
})
const columns = ref([
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key:"email",
    label:"Email",
    sortable: true,
  },
  {
    key:"username",
    label:"Username",
    sortable: true,
  },
  {
    key:"account_type",
    label:"Account Type",
    sortable: true,
  },
  {
    key:"phone_number",
    label:"Phone Number"
  },
  {
    key:"balance",
    label:"Balance",
    sortable: true,
  },
  {
    key:"country",
    label:"Country",
    sortable: true,
  },
  {
    key:"date_of_birth",
    label:"Date Of Birth"
  },
  {
    key:"sender_count",
    label:"Sender Count",
    sortable: true,
  },
  {
    key:"template_count",
    label:"Template Count",
    sortable: true,
  },

  {
    key:"sent_messages_count",
    label:"Sent Message",
    sortable: true,
  },
  {
    key:"subscription_count",
    label:"Subscription Count",
    sortable: true,
  },
  {
    key:"groups_count",
    label:"Groups Count",
    sortable: true,
  },
  {
    key:"contact_count",
    label:"Contacts Count",
    sortable: true,
  },
  {
    key:"message_source_count",
    label:"Message Source Count",
    sortable: true,
  },
  {
    key:"scheduled_message_count",
    label:"Scheduled Message Count",
    sortable: true,
  },
  {
    key:"birth_day_alert_count",
    label:"Birthday Alert Count",
    sortable: true,
  },

  {
    key:"verified_at",
    label: "Verified At",
    sortable: true,
  },

  {
    key:"last_login",
    label: "Last Login",
    sortable: true,
  },
  {
    key:"disabled_at",
    label: "Disabled At",
    sortable: true,
  },

  {
    key:"action",
    label: "Actions",
  }
])

const validate_date = (date) => {
  return date === "0001-01-01T00:00:00Z"
}
watch(() => status.value , (newVal) => {
   if (newVal === "all") {
     account.value = "all"
     verification.value = "all"
     activeness.value = "all"
   }
   if (newVal === "verified" || newVal === "not_verified") {
     account.value = "all"
     verification.value = newVal
     activeness.value = "all"
   }
   if (newVal === "disabled" || newVal === "active") {
     activeness.value = newVal
     verification.value = "all"
     account.value = "all"
   }
   if (newVal === "main_account" || newVal === "sub_account") {
     account.value = newVal
     verification.value = "all"
     activeness.value = "all"
   }
   start.value = ""
   end.value = ""
   q.value = ""
})
watch(() => form.value.sub_account , () => {
    form.value.users = ""
})
watch(() => editForm.value.sub_account , () => {
  editForm.value.users = ""
})
const items = row => [
  [canEditAdmin.value ? {
    label: 'Edit',
    icon: 'i-heroicons-pencil-square-20-solid',
    click: () => getSingleData(row.id)
  }:{}],
  [canDisableAdmin.value ? {
    label: validate_date(row.disabled_at) ?'Disable':'Enable',
    icon: 'i-heroicons-trash-20-solid',
    click: () => deleteData(row.id)
  }:{}]
]

const addData = async () => {
  processing.value = true
  form.value.country_name = form.value.countries?.name
  form.value.country_code = form.value.countries?.code
  form.value.user_id = form.value.users?.id
  try {
    await api.post("/users/add", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    form.value.username = ""
    form.value.email = ""
    form.value.phone_number = ""
    form.value.country_code = ""
    form.value.country_code = ""
    form.value.password = ""
    form.value.password_confirmation = ""
    form.value.user_id = ""
    isOpen.value = false
    toast.add({
      title:"Customer Created Successfully",
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
  editForm.value.country_code = editForm.value.countries?.code
  editForm.value.country_name = editForm.value.countries?.name
  editForm.value.user_id = editForm.value.users?.id
  try {
    await api.patch(`/users/update/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    toast.add({
      title:"User Updated Successfully",
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
    let response = await api.get(`/users/show/${id}`)
    console.log(response)
    editForm.value.id = response.data?.id
    editForm.value.name = response.data?.name
    editForm.value.permissions = response.data?.permissions ?? []
    editForm.value.username = response.data?.username
    editForm.value.email = response.data?.email
    editForm.value.phone_number = response.data?.phone_number
    editForm.value.sub_account = response.data?.sub_account
    editForm.value.countries = response.data?.country
    editForm.value.users = response.data?.user
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
    size:size.value,
    start:start.value,
    end:end.value,
    account:account.value,
    verification:verification.value,
    activeness:activeness.value,
  }
  processing.value = true
  try{
    let response = await api.get("/users",{params})
    if (response.data.data == null) {
      rows.value = []
    }else {
      rows.value = response.data.data
      page.value = response.data.pages?.current_page
      size.value = response.data.pages.page_size
      total.value = response.data.pages?.total_count
      total_customers.value = response.data.count?.total_users
      active_customers.value = response.data.count?.active_users
      verified_customers.value = response.data.count?.unverified_users
      disabled_customers.value = response.data.count?.disabled_users
      main_customers.value = response.data.count?.main_accounts
      sub_customers.value = response.data.count?.sub_accounts
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
      await api.delete(`/users/${id}`)
      await getData()
      processing.value = false
      toast.add({
        title:"User Updated Successfully",
      })
    }catch (e) {
      console.log(e)
      processing.value = false
    }
  }
}

const getRoles = async (q) => {
  loadRoles.value = true
  const params = {
    name:q
  }
  try{
    let response = await api.get("/countries",{params})
    if (response.data.data == null) {
      roles.value = []
    }else {
      roles.value = response.data.data
    }
    loadRoles.value = false
    return roles.value
  }catch (e) {
    console.log(e)
    loadRoles.value = false
  }
}
const getMainUsers = async (q) => {
  loadMainusers.value = true
  const params = {
    search:q
  }
  try{
    let response = await api.get("/users/main",{params})
    if (response.data.data == null) {
      main_users.value = []
    }else {
      main_users.value = response.data.data
    }
    loadMainusers.value = false
    return main_users.value
  }catch (e) {
    console.log(e)
    loadMainusers.value = false
  }
}

const getPermissions = async (q) => {
  loadPermission.value = true
  const params = {
    search:q
  }
  try{
    let response = await api.get("/permissions",{params})
    if (response.data.data == null) {
      permissions.value = []
    }else {
      permissions.value = response.data.data
    }
    loadPermission.value = false
    return permissions.value
  }catch (e) {
    console.log(e)
    loadPermission.value = false
  }
}

const convertDate = (dateString) => {
  const date = new Date(dateString);

  const year = date.getUTCFullYear(); // Get last 2 digits of the year
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getUTCDate().toString().padStart(2, '0');

  return `${day}-${month}-${year}`
}

onMounted(async () => {
  ws.on('wallet-created',data => {
    console.log(data);
  })
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
         <div class="flex justify-between">
           <div>
             <h1 class="uppercase font-medium">Customers</h1>
           </div>
           <div class="flex space-x-2">
             <UInput type="date" v-model="start"  />
             <UInput type="date" v-model="end" />
             <div class="space-y-2">
               <USelectMenu
                   v-model="status"
                   :options="options"
                   placeholder="Select Type"
                   option-attribute="name">
                 <template #label>
                   <span v-if="status" class="truncate">{{ status }}</span>
                   <span v-else>Select Status</span>
                 </template>
               </USelectMenu>
             </div>
             <UButton color="black" variant="solid" @click.prevent="getSearchData" size="2xs">Search</UButton>
           </div>
         </div>
          <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-6">
            <UCard class="overflow-hidden rounded-lg">
              <dt class="truncate text-sm font-medium ">Total Customers</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ total_customers }}</dd>
            </UCard>
            <UCard class="overflow-hidden rounded-lg">
              <dt class="truncate text-sm font-medium ">Active Customers</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ active_customers }}</dd>
            </UCard>
            <UCard class="overflow-hidden rounded-lg">
              <dt class="truncate text-sm font-medium ">Unverified Customers</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ verified_customers }}</dd>
            </UCard>
            <UCard class="overflow-hidden rounded-lg">
              <dt class="truncate text-sm font-medium ">Disabled Customers</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ disabled_customers }}</dd>
            </UCard>
            <UCard class="overflow-hidden rounded-lg">
              <dt class="truncate text-sm font-medium ">Main Customers</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ main_customers }}</dd>
            </UCard>
            <UCard class="overflow-hidden rounded-lg">
              <dt class="truncate text-sm font-medium ">Sub Customers</dt>
              <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ sub_customers }}</dd>
            </UCard>
          </dl>
        </div>
        <div>
          <div class="flex justify-between items-center">
            <div>

            </div>

          </div>
          <div>
            <div class="flex justify-between space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
             <div class="flex space-x-2">
               <UInput v-model="q" clearable  placeholder="Filter customers..." />
               <UButton color="black" variant="solid" @click.prevent="getSearchData" size="2xs">Search</UButton>
             </div>
              <div v-if="$can('manage','all') || $can('add','customer')">
                <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Customer</UButton>
              </div>
            </div>
          </div>
          <UTable
              :loading="processing"
              :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
              :progress="{ color: 'purple', animation: 'carousel' }"
              class="w-full text-nowrap"
              :columns="columns"
              :rows="rows"
          >
            <template #action-data="{ row }">
              <UDropdown :items="items(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
              </UDropdown>
            </template>
            <template #name-data="{ row }">
              <div>
                <p> {{row.name}}</p>
              </div>
            </template>
            <template #balance-data="{ row }">
              <div>
                <p>{{row.currency}} {{row.balance}}</p>
              </div>
            </template>
            <template #last_login-data="{ row }">
              <p> {{new Date(row.last_login).toLocaleDateString('en-US',{
                year: 'numeric',
                month: 'long', // 'short' for abbreviated month names
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short' // Optional: to include the time zone
              })}}</p>
            </template>
            <template #date_of_birth-data="{ row }">
              <p>{{ convertDate(row.date_of_birth) }}</p>
            </template>
            <template #login_at-data="{ row }">
              <p> {{new Date(row.login_at).toLocaleDateString('en-US',{
                year: 'numeric',
                month: 'long', // 'short' for abbreviated month names
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short' // Optional: to include the time zone
              })}}</p>
            </template>
            <template #verified_at-data="{ row }">
              <p> {{new Date(row.verified_at).toLocaleDateString('en-US',{
                year: 'numeric',
                month: 'long', // 'short' for abbreviated month names
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short' // Optional: to include the time zone
              })}}</p>
            </template>
            <template #disabled_at-data="{ row }">
              <p> {{new Date(row.disabled_at).toLocaleDateString('en-US',{
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
    <UModal v-model="isOpen" prevent-close :ui="{ width: 'w-full',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Add Customer
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="addData">
            <div class="space-y-4">
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Name</label>
                  <UInput v-model="form.name" @input="clearErrors('name')" :input-class="errors.name ? 'border border-red-500' :''"  placeholder="Name"  />
                  <small class="text-red-500" v-if="errors?.name">{{errors.name}}</small>
                </div>
                <div class="space-y-2">
                  <label>Username</label>
                  <UInput v-model="form.username" @input="clearErrors('username')" :input-class="errors.username ? 'border border-red-500' :''"  placeholder="Username"  />
                  <small class="text-red-500" v-if="errors?.username">{{errors.username}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2 items-center ">
                <div class="space-y-2">
                  <label>Email</label>
                  <UInput v-model="form.email" @input="clearErrors('email')" type="email" :input-class="errors.email ? 'border border-red-500' :''"  placeholder="Email"  />
                  <small class="text-red-500" v-if="errors?.email">{{errors.email}}</small>
                </div>
                <div class="space-y-2">
                  <label>Phone Number</label>
                  <UInput v-model="form.phone_number" @input="clearErrors('phonenumber')" :input-class="errors.phonenumber ? 'border border-red-500' :''"  placeholder="Phone Number"  />
                  <small class="text-red-500" v-if="errors?.phonenumber">{{errors.phonenumber}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2 items-center">
                <div class="space-y-2">
                  <label>Country</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="form.countries"
                      :options="roles"
                      :loading="loadRoles"
                      :searchable="getRoles"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="form.countries" class="truncate">{{ form.countries?.name}}</span>
                      <span v-else>Select Country</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2" v-if="form.sub_account">
                  <label>Main Account</label>
                  <USelectMenu
                      option-attribute="email"
                      v-model="form.users"
                      :loading="loadMainusers"
                      :options="main_users"
                      :searchable="getMainUsers"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="form.users" class="truncate">{{ form.users?.email}}</span>
                      <span v-else>Select Main Account</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2 items-center ">
                <div class="space-y-2">
                  <label>Password</label>
                  <UInput v-model="form.password" type="password" @input="clearErrors('password')" :input-class="errors.password ? 'border border-red-500' :''"  placeholder="Password"  />
                  <small class="text-red-500" v-if="errors?.password">{{errors.password}}</small>
                </div>
                <div class="space-y-2">
                  <label>Password Conformation</label>
                  <UInput v-model="form.password_confirmation" type="password" @input="clearErrors('passwordconfirmation')" :input-class="errors.passwordconfirmation ? 'border border-red-500' :''"  placeholder="Password Confirmation"  />
                  <small class="text-red-500" v-if="errors?.passwordconfirmation">{{errors.passwordconfirmation}}</small>
                </div>
              </div>
              <div>
                <UCheckbox v-model="form.sub_account" name="notifications" label="Sub Account" />
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','customer')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Customer</UButton>
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
    <UModal v-model="editModal" prevent-close :ui="{ width: 'w-full',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Update Customer
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="editModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="updateData">
            <div class="space-y-4">
              <div class="grid grid-cols-2 space-x-2">
                <div class="space-y-2">
                  <label>Name</label>
                  <UInput v-model="editForm.name" @input="clearError('name')" :input-class="error.name ? 'border border-red-500' :''"  placeholder="Name"  />
                  <small class="text-red-500" v-if="error?.name">{{error.name}}</small>
                </div>
                <div class="space-y-2">
                  <label>Username</label>
                  <UInput v-model="editForm.username" @input="clearError('username')" :input-class="error.username ? 'border border-red-500' :''"  placeholder="Username"  />
                  <small class="text-red-500" v-if="error?.username">{{error.username}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2 items-center ">
                <div class="space-y-2">
                  <label>Email</label>
                  <UInput v-model="editForm.email" @input="clearError('email')" type="email" :input-class="error.email ? 'border border-red-500' :''"  placeholder="Email"  />
                  <small class="text-red-500" v-if="error?.email">{{error.email}}</small>
                </div>
                <div class="space-y-2">
                  <label>Phone Number</label>
                  <UInput v-model="editForm.phone_number" @input="clearError('phonenumber')" :input-class="error.phonenumber ? 'border border-red-500' :''"  placeholder="Phone Number"  />
                  <small class="text-red-500" v-if="error?.phonenumber">{{error.phonenumber}}</small>
                </div>
              </div>
              <div class="grid grid-cols-2 space-x-2 items-center">
                <div class="space-y-2">
                  <label>Country</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="editForm.countries"
                      :options="roles"
                      :loading="loadRoles"
                      :searchable="getRoles"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="editForm.countries" class="truncate">{{ editForm.countries?.name}}</span>
                      <span v-else>Select Country</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2" v-if="editForm.sub_account">
                  <label>Main Account</label>
                  <USelectMenu
                      option-attribute="email"
                      v-model="editForm.users"
                      :loading="loadMainusers"
                      :options="main_users"
                      :searchable="getMainUsers"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="editForm.users" class="truncate">{{ editForm.users?.email}}</span>
                      <span v-else>Select Main Account</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div class="">
                <div>
                  <label>Permissions</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="editForm.permissions"
                      :loading="loadPermission"
                      :searchable="getPermissions"
                      multiple
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="editForm.permissions.length" class="truncate">{{ editForm.permissions.map(p => p.name).join(', ') }}</span>
                      <span v-else>Select permission</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div>
                <UCheckbox v-model="editForm.sub_account" name="notifications" label="Sub Account" />
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','customer')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Customer</UButton>
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