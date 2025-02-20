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
const q = ref('')
const rows = ref([])
const errors = ref([])
const error = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const roles = ref([])
const loadRoles = ref(false)
const canEditAdmin = computed(() => can('show', 'admin') || can('manage', 'all'));
const canDisableAdmin = computed(() => can('disable', 'admin') || can('manage', 'all'));
const form = ref({
  name:'',
  username:'',
  email:'',
  phone_number:'',
  dob:'',
  password:'',
  password_confirmation:'',
  login_at:false,
  otp:false,
  roles:[]
})
const editForm = ref({
  id:'',
  name:'',
  username:'',
  email:'',
  phone_number:'',
  dob:'',
  otp:false,
  roles:[]
})
const columns = ref([
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key:"roles",
    label:"Roles"
  },
  {
    key:"username",
    label:"Username"
  },
  {
    key:"email",
    label:"Email"
  },
  {
    key:"dob",
    label:"Date Of Birth"
  },
  {
    key:"createdAt",
    label: "Created At",
    sortable: true,
  },
  {
    key:"login_at",
    label: "Last Login",
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
  try {
    await api.post("/admins", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    form.value.username = ""
    form.value.email = ""
    form.value.phone_number = ""
    form.value.dob = ""
    form.value.roles = []
    form.value.password = ""
    form.value.password_confirmation = ""
    form.value.login_at = false
    form.value.otp = false
    isOpen.value = false
    toast.add({
      title:"User Created Successfully",
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
  try {
    await api.patch(`/admins/${editForm.value.id}`, editForm.value)
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
    let response = await api.get(`/admins/${id}`)
    console.log(response)
    editForm.value.id = response.data.data?.id
    editForm.value.name = response.data.data?.name
    editForm.value.roles = response.data.data?.roles
    editForm.value.username = response.data.data?.username
    editForm.value.email = response.data.data?.email
    editForm.value.phone_number = response.data.data?.phone_number
    editForm.value.dob = response.data.data?.dob
    editForm.value.login_at = response.data.data?.login_at
    editForm.value.otp = response.data.data?.otp
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
    let response = await api.get("/admins",{params})
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
      await api.patch(`/disable_enable/admins/${id}`)
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
    search:q
  }
  try{
    let response = await api.get("/roles",{params})
    if (response.data.data == null) {
      roles.value = []
    }else {
      roles.value = response.data.data
    }
    console.log("Hey")
    loadRoles.value = false
    return roles.value
  }catch (e) {
    console.log(e)
    loadRoles.value = false
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
              <h1 class="uppercase font-medium">Users</h1>
            </div>
            <div v-if="$can('manage','all') || $can('add','admin')">
              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add User</UButton>
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <UInput v-model="q" clearable  placeholder="Filter users..." />
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
            <template #roles-data="{ row }">
              <div>
                <p v-for="r in row.roles"> {{r.name + ' '}}</p>
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
              Add User
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
                  <label>Date Of Birth</label>
                  <UInput v-model="form.dob" @input="clearErrors('dob')" type="date" :input-class="errors.dob ? 'border border-red-500' :''"  placeholder="Name"  />
                  <small class="text-red-500" v-if="errors?.dob">{{errors.dob}}</small>
                </div>
                <div class="space-y-2">
                  <label>Roles</label>
                  <USelectMenu
                      clear-search-on-close
                      option-attribute="name"
                      v-model="form.roles"
                      :loading="loadRoles"
                      :searchable="getRoles"
                      trailing
                      multiple
                      by="id"
                  >
                    <template #label>
                      <span v-if="form.roles.length" class="truncate">{{ form.roles.map(r => r.name).join(",")}}</span>
                      <span v-else>Select permission</span>
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
                <UCheckbox v-model="form.login_at" name="notifications" label="Change Password When logged in" />
              </div>
              <div>
                <UCheckbox v-model="form.otp" name="notifications" label="Enable Otp" />
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','admin')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add User</UButton>
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
              Update User
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
                  <label>Date Of Birth</label>
                  <UInput v-model="editForm.dob" @input="clearError('dob')" type="date" :input-class="error.dob ? 'border border-red-500' :''"  placeholder="Name"  />
                  <small class="text-red-500" v-if="error?.dob">{{error.dob}}</small>
                </div>
                <div class="space-y-2">
                  <label>Roles</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="editForm.roles"
                      :loading="loadRoles"
                      :searchable="getRoles"
                      trailing
                      multiple
                      by="id"
                  >
                    <template #label>
                      <span v-if="editForm.roles.length" class="truncate">{{ editForm.roles.map(r => r.name).join(",")}}</span>
                      <span v-else>Select Role</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div>
                <UCheckbox v-model="editForm.otp" name="notifications" label="Enable Otp" />
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','admin')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update User</UButton>
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