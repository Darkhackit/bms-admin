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
const rows = ref([])
const errors = ref([])
const error = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
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
const editForm = ref({
  name:'',
  users:'',
  main_users:'',
  user_id:'',
  creator:'',
  contacts:[],

  visibility:'public',
})
const form = ref({
  name:'',
  users:'',
  main_users:'',
  user_id:'',
  creator:'',
  contacts:[],
  templates:"",
  template_id:'',
  sender_id:'',
  senders:"",
  services:"",
  service_id:"",
  visibility:'public',
  birthday_alert:false
})

const bForm = ref({
  group_id:'',
  user_id:'',
  sender:'',
  sender_id:'',
  template:'',
  template_id:'',
  service:'',
  service_id:'',
})

watch(() => form.value.visibility , (newVal) => {
  form.value.main_users = ""
  showVisibility.value = newVal === 'private';
})

watch(() => birthdayModal.value , (value) => {
   if (value === false) {
     bForm.value.sender = ""
     bForm.value.template = ""
     bForm.value.id = ""
     bForm.value.service = ""
     bForm.value.user_id = ""
     bForm.value.service_id = ""
     bForm.value.sender_id = ""
     bForm.value.template_id = ""
   }
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
    form.value.service_id = ""
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
const canEditPermission = computed(() => can('show', 'group') || can('manage', 'all'));
const canDeletePermission = computed(() => can('delete', 'group') || can('manage', 'all'));
const canToggleBirthdayAlert = computed(() => can('list', 'group') || can('manage', 'all'));

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
    key:"contact_count",
    label:"Contact Count",
  },
  {
    key:"birthday_activated",
    label:"Birthday Alert",
  },
  {
    key:"visibility",
    label:"Visibility",
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
    click: () => getSingleData(row.id)
  }:{}],
  [canToggleBirthdayAlert.value ?{
    label: row.birthday_activated ? 'Disable Birthday Alert' : 'Enable Birthday Alert',
    icon: 'i-heroicons-cake-20-solid',
    click: () => toggleBirthdayAlert(row.id , row.birthday_activated , row.owner_id,row.birthday_alert_id)
  }:{}],
  [canDeletePermission.value ?{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    click: () => deleteData(row.id)
  }:{}]
]

const toggleBirthdayAlert = async (id , alert , user_id, birthday_id) => {
  if (alert === false) {
    bForm.value.group_id = id
    bForm.value.user_id = user_id
   return  birthdayModal.value = true
  }
  await removeBirthdayAlert(birthday_id,user_id)
}

const addData = async () => {
  processing.value = true
  form.value.user_id = form.value.users?.id
  form.value.creator = form.value.main_users?.id
  form.value.service_id = form.value.services?.id
  form.value.template_id = form.value.templates?.id
  form.value.sender_id = form.value.senders?.id
  try {
    await api.post("/groups", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    form.value.user_id = ""
    form.value.pho = ""
    form.value.users = ""
    form.value.main_users = ""
    isOpen.value = false
    toast.add({
      title:"Group Added Successfully",
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
  try {
    await api.patch(`/groups/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    toast.add({
      title:"Group Updated Successfully",
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
    let response = await api.get(`/groups/${id}`)
    console.log(response)
    editForm.value.id = response.data?.id
    editForm.value.name = response.data?.name
    editForm.value.users = response.data?.owner
    editForm.value.visibility = response.data?.visibility
    setTimeout(() => editForm.value.main_users = response.data?.created_by?.id === "00000000-0000-0000-0000-000000000000" ? "" : response.data?.created_by , 10)
    setTimeout(() => editForm.value.contacts = response.data?.contacts ? response.data?.contacts : [] )
    processing.value = false
    editModal.value = true
    console.log(editForm.value.main_users)
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
    user_id:OwnerAccount.value?.email,
    created_by:CreatorAccount.value?.email
  }
  processing.value = true
  try{
    let response = await api.get("/groups",{params})
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
      await api.delete(`/groups/${id}`)
      await getData()
      processing.value = false
      toast.add({
        title:"Group Deleted Successfully",
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

const getEditUserContacts = async (q) => {
  loadUserContacts.value = true
  if (!editForm.value.users) {
    loadUserContacts.value = false
    return  contacts.value = []
  }
  try{
    let response = await api.get(`/contacts/${editForm.value.users?.id}`)
    loadUserContacts.value = false
    if (response.data.data == null) {
      contacts.value = []
    }else {
      contacts.value = response.data.data
    }
    return contacts.value
  }catch (e) {
    contacts.value = []
    loadUserContacts.value = false
  }
}

const getUserContacts = async (q) => {
  loadUserContacts.value = true
  if (!form.value.users) {
    loadUserContacts.value = false
    return  contacts.value = []
  }
  try{
    let response = await api.get(`/contacts/${form.value.users?.id}`)
    loadUserContacts.value = false
    if (response.data.data == null) {
      contacts.value = []
    }else {
      contacts.value = response.data.data
    }
    return contacts.value
  }catch (e) {
    contacts.value = []
    loadUserContacts.value = false
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
  if (!form.value.users) {
    loadService.value = false
    return  services.value = []
  }
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

const getBirthdayService = async (q) => {
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
const getUserBirthdaySenders = async (q) => {
  loadUserSenders.value = true
  try{
    let response = await api.get(`/senders/${bForm.value.user_id}`)
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

const getUserBirthdayTemplate = async (q) => {
  loadUserTemplates.value = true

  try{
    let response = await api.get(`/templates/${bForm.value.user_id}`)
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

const createBirthdayAlert = async () => {
  processing.value = true
  bForm.value.template_id = bForm.value.template?.id
  bForm.value.service_id = bForm.value.service?.id
  bForm.value.sender_id = bForm.value.sender?.id
  try {
    await api.post("/birthday_alert", bForm.value)
    await getData()
    processing.value = false

    birthdayModal.value = false
    toast.add({
      title:"Birthday Alert Created Successfully",
    })
  }catch (e) {
    console.log(e)
    toast.add({
      title:`${e.response}`,
    })
    processing.value = false
  }
}

const removeBirthdayAlert = async (id , birthday_id) => {
 if (confirm('Are you sure?')) {
   processing.value = true
   try {
     await api.delete(`/birthday_alert/${id}/${birthday_id}`)
     await getData()
     processing.value = false

     birthdayModal.value = false
     toast.add({
       title:"Birthday Alert Removed Successfully",
     })
   }catch (e) {
     console.log(e)
     toast.add({
       title:`${e.response}`,
     })
     processing.value = false
   }
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
              <h1 class="uppercase font-medium">Groups</h1>
            </div>
            <div v-if="$can('manage','all') || $can('add','group')">
              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Group</UButton>
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <UInput v-model="q" clearable  placeholder="Filter group..." />
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
              <UButton color="black" variant="solid" @click.prevent="getSearchData" size="2xs">Search</UButton>
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
              Add Group
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
              <div class="space-y-2" v-if="showContacts">
                <label>Contacts</label>
                <USelectMenu
                    option-attribute="name"
                    v-model="form.contacts"
                    :loading="loadUserContacts"
                    :options="contacts"
                    :searchable="getUserContacts"
                    placeholder="Select Type"
                    multiple
                >
                  <template #label>
                    <span v-if="form.contacts.length" class="truncate">{{ form.contacts.map(contact => contact.name).join(',')}}</span>
                    <span v-else>Add Contact</span>
                  </template>
                </USelectMenu>
              </div>
              <div>
                <UCheckbox v-model="form.birthday_alert" label="Enable Birthday Alert" />
              </div>
              <div v-if="form.birthday_alert">
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
                </div>
                <div class="space-y-2">
                  <label>Template</label>
                  <USelectMenu
                      option-attribute="title"
                      v-model="form.templates"
                      :loading="loadUserTemplates"
                      :options="templates"
                      :searchable="getUserTemplate"
                      placeholder="Select Type"
                      :search-attributes="['title', 'service']"
                  >
                    <template #label>
                      <span v-if="form.templates" class="truncate">{{ form.templates?.title}}</span>
                      <span v-else>Select Template</span>
                    </template>
                    <template #option="{ option: person }">
                      <span>{{person.service}}</span> ---
                      <span class="truncate">{{ person.title }}</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2">
                  <label>Sender</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="form.senders"
                      :loading="loadUserSenders"
                      :options="senders"
                      :searchable="getUserSenders"
                      placeholder="Select Type"
                      :search-attributes="['name', 'service']"
                  >
                    <template #label>
                      <span v-if="form.senders" class="truncate">{{ form.senders?.name}}</span>
                      <span v-else>Add Sender</span>
                    </template>
                    <template #option="{ option: person }">
                      <span>{{person.service}}</span> ---
                      <span class="truncate">{{ person.name }}</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','group')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Group</UButton>
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
              Update Group
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
              <div class="space-y-2" v-if="showEditContacts">
                <label>Contacts</label>
                <USelectMenu
                    option-attribute="name"
                    v-model="editForm.contacts"
                    :loading="loadUserContacts"
                    :searchable="getEditUserContacts"
                    placeholder="Select Type"
                    multiple
                    trailing
                    by="id"
                >
                  <template #label>
                    <span v-if="editForm.contacts.length" class="truncate">{{ editForm.contacts.map(contact => contact.name).join(',')}}</span>
                    <span v-else>Add Contact</span>
                  </template>
                </USelectMenu>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','group')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Group</UButton>
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
              Enable Birthday Alert
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="birthdayModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="createBirthdayAlert">
            <div class="space-y-2">
              <div>
                <div class="space-y-2">
                  <label>Service</label>
                  <USelectMenu
                      v-model="bForm.service"
                      :options="services"
                      :loading="loadService"
                      :searchable="getBirthdayService"
                      placeholder="Select Type"
                      option-attribute="name">
                    <template #label>
                      <span v-if="bForm.service" class="truncate">{{ bForm.service?.name }}</span>
                      <span v-else>Select service</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2">
                  <label>Template</label>
                  <USelectMenu
                      option-attribute="title"
                      v-model="bForm.template"
                      :loading="loadUserTemplates"
                      :options="templates"
                      :searchable="getUserBirthdayTemplate"
                      placeholder="Select Type"
                      :search-attributes="['title', 'service']"
                  >
                    <template #label>
                      <span v-if="bForm.template" class="truncate">{{ bForm.template?.title}}</span>
                      <span v-else>Select Template</span>
                    </template>
                    <template #option="{ option: person }">
                      <span>{{person.service}}</span> ---
                      <span class="truncate">{{ person.title }}</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2">
                  <label>Sender</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="bForm.sender"
                      :loading="loadUserSenders"
                      :options="senders"
                      :searchable="getUserBirthdaySenders"
                      placeholder="Select Type"
                      :search-attributes="['name', 'service']"
                  >
                    <template #label>
                      <span v-if="bForm.sender" class="truncate">{{ bForm.sender?.name}}</span>
                      <span v-else>Add Sender</span>
                    </template>
                    <template #option="{ option: person }">
                      <span>{{person.service}}</span> ---
                      <span class="truncate">{{ person.name }}</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','group')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Enable Birthday Alert</UButton>
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