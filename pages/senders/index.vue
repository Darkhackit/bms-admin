<script setup>
import api from "~/utils/api.js";
import SkeletonLoader from "~/components/skeletonLoader.vue";
import {useAbility} from "@casl/vue";

const toast = useToast();
const {can} = useAbility()
const processing = ref(false)
const loadUsers = ref(false)
const loadMainUsers = ref(false)
const loadUserContacts = ref(false)
const loadUserTemplates = ref(false)
const loadUserSenders = ref(false)
const loadService = ref(false)
const isOpen = ref(false)
const editModal = ref(false)
const birthdayModal = ref(false)
const loader = ref(true)
const users = ref([])
const contacts = ref([])
const templates = ref([])
const senders = ref([])
const services = ref([])
const main_users = ref([])
const q = ref('')
const OwnerAccount = ref('')
const CreatorAccount = ref('')
const QueryService = ref('')
const QueryStatus = ref('')
const rows = ref([])
const errors = ref([])
const error = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const total_template = ref(0)
const pending_template = ref(0)
const approved_template = ref(0)
const processing_template = ref(0)
const rejected_template = ref(0)
const showVisibility = ref(false)
const showEditVisibility = ref(false)
const showContacts = ref(true)
const showEditContacts = ref(true)
const options = ref([
  {
    value:"public",
    label:"Public"
  },
  {
    value:"private",
    label:"Private"
  }
])
const status = ref(['pending','rejected','approved','processing'])
const editForm = ref({
  id:'',
  name:'',
  users:'',
  purpose:'',
  main_users:'',
  user_id:'',
  creator:'',
  services:"",
  service:"",
  visibility:'public',
})
const form = ref({
  name:'',
  users:'',
  purpose:'',
  main_users:'',
  user_id:'',
  creator:'',
  services:"",
  service:"",
  visibility:'public',
})

const bForm = ref({
  id:'',
  status:'',
})

watch(() => form.value.visibility , (newVal) => {
  form.value.main_users = ""
  showVisibility.value = newVal === 'private';
})

watch(() => form.value.users , () => {
  form.value.main_users = ""
  form.value.contacts = []
  if (form.value.visibility === "private"){
    showVisibility.value = false
    setTimeout(() => showVisibility.value = true,10)
  }

  if (form.value.birthday_alert) {
    getUserTemplate()
    getUserSenders()
    getService()
  }

  showContacts.value = false
  setTimeout(() => showContacts.value = true,10)
})

watch(() => form.value.birthday_alert,(value) => {
  form.value.templates = ""
  form.value.template_id = ""
  form.value.senders = ""
  form.value.services = ""
  form.value.sender_id = ""
  form.value.service = ""
})

watch(() => editForm.value.visibility , (newVal) => {
  editForm.value.main_users = ""
  showEditVisibility.value = newVal === 'private';
})

watch(() => editForm.value.users , () => {
  editForm.value.main_users = ""
  editForm.value.contacts = []
  if (editForm.value.visibility === "private"){
    showEditVisibility.value = false
    setTimeout(() => showEditVisibility.value = true,10)
  }

  showEditContacts.value = false
  setTimeout(() => showEditContacts.value = true,10)
})
const canEditPermission = computed(() => can('show', 'sender') || can('manage', 'all'));
const canDeletePermission = computed(() => can('delete', 'sender') || can('manage', 'all'));
const CanApprovalTemplate = computed(() => can('approve', 'sender') || can('manage', 'all'));

const columns = ref([
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key:"owner",
    label:"Owner"
  },
  {
    key:"created_by",
    label:"Created By",
  },
  {
    key:"service",
    label:"Service",
  },
  {
    key:"visibility",
    label:"Visibility",
  },
  {
    key:"status",
    label:"Status",
  },
  {
    key:"created_at",
    label: "Created At",
    sortable: true,
  },
  {
    key:"updated_at",
    label: "Updated At",
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
    click: () => getSingleData(row.id,row.owner_id)
  }:{}],
  [CanApprovalTemplate.value ?{
    label: 'Set Status',
    icon: 'i-heroicons-check-badge-20-solid',
    click: () => setStatus(row.id , row.status)
  }:{}],
  [canDeletePermission.value ?{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    click: () => deleteData(row.id,row.owner_id)
  }:{}]
]

const setStatus = async (id , status) => {
  bForm.value.id = id
  bForm.value.status = status
  birthdayModal.value = true
}

const addData = async () => {
  processing.value = true
  form.value.user_id = form.value.users?.id
  form.value.creator = form.value.main_users?.id
  form.value.service = form.value.services?.name
  try {
    await api.post("/senders", form.value)
    await getData()
    processing.value = false
    form.value.title = ""
    form.value.message = ""
    form.value.user_id = ""
    form.value.creator = ""
    form.value.services = ""
    form.value.service = ""
    form.value.users = ""
    form.value.main_users = ""
    isOpen.value = false
    toast.add({
      title:"Sender Added Successfully",
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
  editForm.value.user_id = editForm.value.users?.id
  editForm.value.creator = editForm.value.main_users?.id
  editForm.value.service = editForm.value.services?.name
  try {
    await api.patch(`/senders/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    toast.add({
      title:"Sender Updated Successfully",
    })
  }catch (e) {
    console.log(e)
    if (e.response?.status === 422) {
      error.value = e.response.data
    }
    processing.value = false
  }

}

const getSingleData = async (id,user_id) => {
  processing.value = true
  try {
    let response = await api.get(`/senders/${id}/${user_id}`)
    console.log(response)
    editForm.value.id = response.data?.id
    editForm.value.name = response.data?.name
    editForm.value.purpose = response.data?.purpose
    editForm.value.users = response.data?.owner
    editForm.value.visibility = response.data?.visibility
    setTimeout(() => editForm.value.main_users = response.data?.creator?.id === "00000000-0000-0000-0000-000000000000" ? "" : response.data?.creator , 10)
    setTimeout(() => editForm.value.services = response.data?.service,10)
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
    creator:CreatorAccount.value?.email,
    owner:OwnerAccount.value?.email,
    service:QueryService.value?.name,
    status:QueryStatus.value,
  }
  processing.value = true
  try{
    let response = await api.get("/senders",{params})
    if (response.data.data == null) {
      rows.value = []
    }else {
      rows.value = response.data.data
      page.value = response.data.pages?.current_page
      size.value = response.data.pages.page_size
      total.value = response.data.pages?.total_count
      total_template.value = response.data.total_template
      pending_template.value = response.data.pending_template
      rejected_template.value = response.data.rejected_template
      processing_template.value = response.data.processing_template
      approved_template.value = response.data.approved_template
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

const deleteData = async (id,user_id) => {
  if (confirm('Are you sure?')) {
    processing.value = true
    try {
      await api.delete(`/senders/${id}/${user_id}`)
      await getData()
      processing.value = false
      toast.add({
        title:"Sender Deleted Successfully",
      })
    }catch (e) {
      console.log(e)
      processing.value = false
    }
  }
}

const updateStatus = async (id) => {
  if (confirm('Are you sure?')) {
    processing.value = true
    try {
      await api.patch(`/senders/update/${bForm.value.id}`,bForm.value)
      await getData()
      processing.value = false
      birthdayModal.value = false
      toast.add({
        title:"Sender Updated Successfully",
      })
    }catch (e) {
      console.log(e)
      processing.value = false
    }
  }
}

const getUsers = async (q) => {
  loadUsers.value = true
  const params = {
    search:q
  }
  try{
    let response = await api.get("/all_users",{params})
    if (response.data.data == null) {
      users.value = []
    }else {
      users.value = response.data.data
    }
    loadUsers.value = false
    return users.value
  }catch (e) {
    console.log(e)
    loadUsers.value = false
  }
}

const getMainUsers = async (q) => {
  loadMainUsers.value = true
  if (!form.value.users) {
    loadMainUsers.value = false
    return  main_users.value = []
  }
  if (form.value.users?.parent_id === "00000000-0000-0000-0000-000000000000") {
    loadMainUsers.value = false
    return main_users.value = []
  }

  try{
    let response = await api.get(`/get_user/${form.value.users?.parent_id}`)
    loadMainUsers.value = false
    return main_users.value = [response.data]
  }catch (e) {
    main_users.value = []
    loadMainUsers.value = false
  }
}

const getEditMainUsers = async (q) => {
  loadMainUsers.value = true
  if (!editForm.value.users) {
    loadMainUsers.value = false
    return  main_users.value = []
  }
  if (editForm.value.users?.parent_id === "00000000-0000-0000-0000-000000000000") {
    loadMainUsers.value = false
    return main_users.value = []
  }

  try{
    let response = await api.get(`/get_user/${editForm.value.users?.parent_id}`)
    loadMainUsers.value = false
    return main_users.value = [response.data]
  }catch (e) {
    main_users.value = []
    loadMainUsers.value = false
  }
}

const getUserTemplate = async (q) => {
  loadUserTemplates.value = true
  if (!form.value.users) {
    loadUserTemplates.value = false
    return  templates.value = []
  }
  try{
    let response = await api.get(`/templates/${form.value.users?.id}`)
    loadUserTemplates.value = false
    if (response.data.data == null) {
      templates.value = []
    }else {
      templates.value = response.data.data
    }
    return templates.value
  }catch (e) {
    templates.value = []
    loadUserTemplates.value = false
  }
}
const getUserSenders = async (q) => {
  loadUserSenders.value = true
  if (!form.value.users) {
    loadUserSenders.value = false
    return  senders.value = []
  }
  try{
    let response = await api.get(`/senders/${form.value.users?.id}`)
    loadUserSenders.value = false
    if (response.data.data == null) {
      senders.value = []
    }else {
      senders.value = response.data.data
    }
    return senders.value
  }catch (e) {
    senders.value = []
    loadUserSenders.value = false
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
          <div class="">
            <div>
              <h1 class="uppercase font-medium">Senders</h1>
            </div>
            <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-5">
              <UCard class="overflow-hidden rounded-lg">
                <dt class="truncate text-sm font-medium ">Total Senders</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ total_template }}</dd>
              </UCard>
              <UCard class="overflow-hidden rounded-lg">
                <dt class="truncate text-sm font-medium ">Pending Senders</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ pending_template }}</dd>
              </UCard>
              <UCard class="overflow-hidden rounded-lg">
                <dt class="truncate text-sm font-medium ">Approved Senders</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ approved_template }}</dd>
              </UCard>
              <UCard class="overflow-hidden rounded-lg">
                <dt class="truncate text-sm font-medium ">Processing Senders</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ processing_template }}</dd>
              </UCard>
              <UCard class="overflow-hidden rounded-lg">
                <dt class="truncate text-sm font-medium ">Rejected Senders</dt>
                <dd class="mt-1 text-3xl font-semibold tracking-tight ">{{ rejected_template }}</dd>
              </UCard>
            </dl>
          </div>
          <div>
            <div class="flex justify-between items-center space-x-2  border-b border-gray-200 dark:border-gray-700">
              <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
                <UInput v-model="q" clearable  placeholder="Filter template..." />
                <div class="space-y-2" >
                  <USelectMenu
                      option-attribute="email"
                      v-model="OwnerAccount"
                      :loading="loadUsers"
                      :options="users"
                      :searchable="getUsers"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="OwnerAccount" class="truncate">{{ OwnerAccount?.email}}</span>
                      <span v-else>Select Owner Account</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2" >
                  <USelectMenu
                      option-attribute="email"
                      v-model="CreatorAccount"
                      :loading="loadUsers"
                      :options="users"
                      :searchable="getUsers"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="CreatorAccount" class="truncate">{{ CreatorAccount?.email}}</span>
                      <span v-else>Select Creator Account</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2" >
                  <USelectMenu
                      option-attribute="name"
                      v-model="QueryService"
                      :loading="loadService"
                      :options="services"
                      :searchable="getService"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="QueryService" class="truncate">{{ QueryService?.name}}</span>
                      <span v-else>Select Service</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2">
                  <USelectMenu
                      v-model="QueryStatus"
                      :options="status"
                      placeholder="Select Type"
                      option-attribute="name">
                    <template #label>
                      <span v-if="QueryStatus" class="truncate">{{ QueryStatus }}</span>
                      <span v-else>Select Status</span>
                    </template>
                  </USelectMenu>
                </div>
                <UButton color="black" variant="solid" @click.prevent="getSearchData" size="2xs">Search</UButton>
              </div>
              <div>
                <div v-if="$can('manage','all') || $can('add','group')">
                  <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Senders</UButton>
                </div>
              </div>
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
            <template #updated_at-data="{ row }">
              <p> {{new Date(row.updated_at).toLocaleDateString('en-US',{
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
              Add Sender
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
                <label>Service</label>
                <USelectMenu
                    v-model="form.services"
                    :options="services"
                    :loading="loadService"
                    :searchable="getService"
                    placeholder="Select Type"
                    option-attribute="name">
                  <template #label>
                    <span v-if="form.services" class="truncate">{{ form.services?.name }}</span>
                    <span v-else>Select service</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="errors?.service">{{errors.service}}</small>
              </div>
              <div class="space-y-2" >
                <label>Users</label>
                <USelectMenu
                    option-attribute="email"
                    v-model="form.users"
                    :loading="loadUsers"
                    :options="users"
                    :searchable="getUsers"
                    placeholder="Select Type"
                >
                  <template #label>
                    <span v-if="form.users" class="truncate">{{ form.users?.email}}</span>
                    <span v-else>Select Customer Account</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="errors?.userid">{{errors.userid}}</small>
              </div>
              <div>
                <URadioGroup v-model="form.visibility" legend="Visibility" :options="options" />
              </div>
              <div class="space-y-2" v-if="showVisibility">
                <label>Main Account</label>
                <USelectMenu
                    option-attribute="email"
                    v-model="form.main_users"
                    :loading="loadMainUsers"
                    :options="main_users"
                    :searchable="getMainUsers"
                    placeholder="Select Type"
                >
                  <template #label>
                    <span v-if="form.main_users" class="truncate">{{ form.main_users?.email}}</span>
                    <span v-else>Select Main Account</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="errors?.creator">{{errors.creator}}</small>
              </div>
              <div>
                <label>Purpose</label>
                <UTextarea v-model="form.purpose"  size="xl" :rows="6"/>
                <small class="text-red-500" v-if="errors?.purpose">{{errors.purpose}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','sender')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Sender</UButton>
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
              Update Sender
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
                <label>Service</label>
                <USelectMenu
                    v-model="editForm.services"
                    :options="services"
                    :loading="loadService"
                    :searchable="getService"
                    placeholder="Select Type"
                    option-attribute="name">
                  <template #label>
                    <span v-if="editForm.services" class="truncate">{{ editForm.services?.name }}</span>
                    <span v-else>Select service</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.service">{{error.service}}</small>
              </div>
              <div class="space-y-2" >
                <label>Users</label>
                <USelectMenu
                    option-attribute="email"
                    v-model="editForm.users"
                    :loading="loadUsers"
                    :options="users"
                    :searchable="getUsers"
                    placeholder="Select Type"
                >
                  <template #label>
                    <span v-if="editForm.users" class="truncate">{{ editForm.users?.email}}</span>
                    <span v-else>Select Customer Account</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.userid">{{error.userid}}</small>
              </div>
              <div>
                <URadioGroup v-model="editForm.visibility" legend="Visibility" :options="options" />
              </div>
              <div class="space-y-2" v-if="showEditVisibility">
                <label>Main Account</label>
                <USelectMenu
                    option-attribute="email"
                    v-model="editForm.main_users"
                    :loading="loadMainUsers"
                    :options="main_users"
                    :searchable="getEditMainUsers"
                    placeholder="Select Type"
                >
                  <template #label>
                    <span v-if="editForm.main_users" class="truncate">{{ editForm.main_users?.email}}</span>
                    <span v-else>Select Main Account</span>
                  </template>
                </USelectMenu>
                <small class="text-red-500" v-if="error?.creator">{{error.creator}}</small>
              </div>
              <div>
                <label>Purpose</label>
                <UTextarea v-model="editForm.purpose"  size="xl" :rows="6"/>
                <small class="text-red-500" v-if="error?.purpose">{{error.purpose}}</small>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','sender')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Sender</UButton>
              </div>
            </div>
          </form>
        </div>
      </UCard>
    </UModal>
  </div>
  <!--End Edit Modal-->

  <!--Birthday Modal-->
  <div>
    <UModal v-model="birthdayModal" prevent-close :ui="{ width: 'w-full',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Set Template Status
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="birthdayModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="updateStatus">
            <div class="space-y-2">
              <div>
                <div class="space-y-2">
                  <label>Service</label>
                  <USelectMenu
                      v-model="bForm.status"
                      :options="status"
                      placeholder="Select Type"
                      option-attribute="name">
                    <template #label>
                      <span v-if="bForm.status" class="truncate">{{ bForm.status }}</span>
                      <span v-else>Select service</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('approve','template')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Set Status</UButton>
              </div>
            </div>
          </form>
        </div>
      </UCard>
    </UModal>
  </div>
  <!--End Birthday Modal-->
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