<script setup>
import SkeletonLoader from "~/components/skeletonLoader.vue";
import api from "~/utils/api";
import {useAbility} from "@casl/vue";

const {can} = useAbility()
const toast = useToast();
const queryUser = ref(null)
const queryService = ref(null)
const queryScheduleUser = ref(null)
const queryScheduleService = ref(null)
const searchScheduleMessage = ref("")
const loader = ref(true)
const items = ref([
  {
    label:"Birthday Alert",
    key:'birthday',
  },
  {
    label:"Scheduled Messages",
    key:'s_messages',
  },
  {
    label:"Date Based Scheduled Messages",
    key:'d_messages',
  },
])
const processing = ref(false)
const loadUsers = ref(false)
const loadService = ref(false)
const birthdayEditModal = ref(false)
const addBirthDayAlertModal = ref(false)
const addScheduleMessageModal = ref(false)
const loadUserTemplates = ref(false)
const loadUserSenders = ref(false)
const loadUserGroup = ref(false)
const showEditGroup = ref(true)
const showGroup = ref(true)
const showEditSender = ref(true)
const showSender = ref(true)
const showEditTemplate = ref(true)
const showTemplate = ref(true)
const editMode = ref(false)
const addMode = ref(false)
const users = ref([])
const services = ref([])
const templates = ref([])
const senders = ref([])
const groups = ref([])
const page = ref(1)
const sPage = ref(1)
const size = ref(10)
const sSize = ref(10)
const total = ref(0)
const sTotal = ref(0)
const maxCount = ref(161)
const q = ref("")
const sq = ref("")
const sourceTab = ref([
  {
    label:"Direct",
    key:'direct',
  },
  {
    label:"File",
    key:'file',
  },
  {
    label:"Group",
    key:'group',
  }
])
const birthday_columns = ref([
  {
    label:"Template Title",
    key:'title',
    sortable:true
  },
  {
    label:"User",
    key:'user',
    sortable:true
  },
  {
    label:"Group",
    key:'group',
  },
  {
    label:"Service",
    key:'service',
    sortable:true
  },
  {
    label:"Sender",
    key:'sender',
  },
  {
    label:"Actions",
    key:'action',
  }
])
const s_columns = ref([
  {
    label:"User",
    key:'user',
    sortable:true
  },
  {
    label:"Sender",
    key:'sender',
    sortable:true
  },
  {
    label:"Source Type",
    key:'source_type',
  },
  {
    label:"Service",
    key:'service',
    sortable:true
  },
  {
    label:"Status",
    key:'status',
  },
  {
    label:"Created At",
    key:'created_at',
  },
  {
    label:"Actions",
    key:'action',
  }
])
const birthday_rows = ref([])
const schedule_messages_rows = ref([])

const editBirthdayForm = ref({
  id :'',
  sender:'',
  sender_id:'',
  group:'',
  group_id:'',
  service:'',
  service_id:'',
  template:'',
  template_id:'',
  user:'',
  user_id:''
})
const BirthdayForm = ref({
  sender:'',
  sender_id:'',
  group:'',
  group_id:'',
  service:'',
  service_id:'',
  template:'',
  template_id:'',
  user:'',
  user_id:''
})
const scheduleMessageForm = ref({
  user:'',
  service:'',
  source:'direct',
  useTemplate:null,
  templateMessage:"",
  remove_duplicate:true
})
const canEditPermission = computed(() => can('show', 'sender') || can('manage', 'all'));
const canDeletePermission = computed(() => can('delete', 'sender') || can('manage', 'all'));
const CanApprovalTemplate = computed(() => can('approve', 'sender') || can('manage', 'all'));

watch(() => editBirthdayForm.value.user ,() => {
  if (!editMode.value) {
    showEditGroup.value = false
    setTimeout(() => {
      editBirthdayForm.value.group = ""
      showEditGroup.value = true
    } , 5)

    showEditTemplate.value = false
    setTimeout(() => {
      editBirthdayForm.value.template = ""
      showEditTemplate.value = true
    } , 5)

    showEditSender.value = false
    setTimeout(() => {
      editBirthdayForm.value.sender = ""
      showEditSender.value = true
    } , 5)
  }
})
watch(() => BirthdayForm.value.user,() => {
  showTemplate.value = false
  setTimeout(() => {
    BirthdayForm.value.template = ""
    showTemplate.value = true
  },4)

  showGroup.value = false
  setTimeout(() => {
    BirthdayForm.value.group = ""
    showGroup.value = true
  },4)

  showSender.value = false
  setTimeout(() => {
    BirthdayForm.value.sender = ""
    showSender.value = true
  },4)
})

watch(() => addBirthDayAlertModal.value , (value) => {
  if (value === true) {
    addMode.value = true
  }else {
    addMode.value = false
  }
})
const options = row => [
  [canEditPermission.value ?{
    label: 'Edit',
    icon: 'i-heroicons-pencil-square-20-solid',
    click: () => getSingleBirthdayData(row.id,row.user_id)
  }:{}],
  [canDeletePermission.value ?{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    click: () => removeBirthdayAlert(row.id,row.user_id)
  }:{}]
]

const addBirthdayAlert = async () => {
  processing.value = true
  BirthdayForm.value.user_id = BirthdayForm.value.user?.id
  BirthdayForm.value.group_id = BirthdayForm.value.group?.id
  BirthdayForm.value.sender_id = BirthdayForm.value.sender?.id
  BirthdayForm.value.service_id = BirthdayForm.value.service?.id
  BirthdayForm.value.template_id = BirthdayForm.value.template?.id
  try {
    await api.post("/birthday_alert",BirthdayForm.value)
    await getBirthdays()
    addBirthDayAlertModal.value = false
    BirthdayForm.value.template = ""
    BirthdayForm.value.template_id = ""
    BirthdayForm.value.user = ""
    BirthdayForm.value.user_id = ""
    BirthdayForm.value.sender = ""
    BirthdayForm.value.sender_id = ""
    BirthdayForm.value.group = ""
    BirthdayForm.value.group_id = ""
    BirthdayForm.value.service = ""
    BirthdayForm.value.service_id = ""
    processing.value = false
    toast.add({
      title:"Birthday Alert Added Successfully",
      color:'green'
    })
  }catch (e) {
    console.log(e)
    processing.value = false
   let  err = JSON.stringify(e.response.data)
    toast.add({
      title:`${err}`,
      color:'red'
    })
  }
}
const insertPlaceholder = (field) => {
  console.log(field)
  let cursorIndex = document.getElementById('templateMessage').selectionEnd;
  scheduleMessageForm.value.templateMessage = scheduleMessageForm.value.templateMessage.substring(0,cursorIndex) + field + scheduleMessageForm.value.templateMessage.substring(cursorIndex)
}
const getBirthdays = async () => {
     processing.value = true
     const params = {
       search : q.value,
       page : page.value,
       size:size.value,
       email:queryUser.value?.email,
       service:queryService.value?.name
     }
     try {
       let response = await api.get("/birthday_alert",{params})
       birthday_rows.value = response.data?.data ? response.data?.data : []
       page.value = response.data.pages?.current_page
       size.value = response.data.pages.page_size
       total.value = response.data.pages?.total_count
       processing.value = false
     }catch (e) {
       console.log(e)
       processing.value = false
     }
}

const getScheduleMessages = async () => {
  processing.value = true
  const params = {
    search : q.value,
    page : page.value,
    size:size.value,
    email:queryUser.value?.email,
    service:queryService.value?.name
  }
  try {
    let response = await api.get("/schedule_messages",{params})
    schedule_messages_rows.value = response.data?.data ? response.data?.data : []
    sPage.value = response.data.pages?.current_page
    sSize.value = response.data.pages.page_size
    sTotal.value = response.data.pages?.total_count
    processing.value = false
  }catch (e) {
    console.log(e)
    processing.value = false
  }
}

const getSingleBirthdayData = async (id , user_id) => {
  processing.value = true
  editMode.value = true
  try {
    let response = await api.get(`/birthday_alert/${id}/${user_id}`)
    console.log(response)
    editBirthdayForm.value.id = response.data.id
    editBirthdayForm.value.user = response.data.user
    editBirthdayForm.value.service = response.data.service
    editBirthdayForm.value.group = response.data.group
    editBirthdayForm.value.sender = response.data.sender
    editBirthdayForm.value.template = response.data.template
    processing.value = false
    birthdayEditModal.value = true
    setTimeout(() => editMode.value = false , 2)
  }catch (e) {
    processing.value = false
    editMode.value = false
  }
}

const updateBirthdayAlert = async () => {
  processing.value = true
  editBirthdayForm.value.user_id = editBirthdayForm.value.user?.id
  editBirthdayForm.value.group_id = editBirthdayForm.value.group?.id
  editBirthdayForm.value.sender_id = editBirthdayForm.value.sender?.id
  editBirthdayForm.value.service_id = editBirthdayForm.value.service?.id
  editBirthdayForm.value.template_id = editBirthdayForm.value.template?.id
  try {
    await api.patch(`/birthday_alert/${editBirthdayForm.value.id}/${editBirthdayForm.value.user_id}`, editBirthdayForm.value)
    await getBirthdays()
    processing.value = false
    birthdayEditModal.value = false
    toast.add({
      title:"Birthday Alert Updated Successfully",
      color:'green'
    })
  }catch (e) {
    console.log(e)
    processing.value = false
    let  err = JSON.stringify(e.response.data)
    toast.add({
      title:`${err}`,
      color:'red'
    })
  }
}


const getUsers = async (q) => {
  loadUsers.value = true
  const params = {
    search:q,
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
const sourceTabChange = (index) => {
  const item = sourceTab.value[index]
  scheduleMessageForm.value.source = item.key
}
const getUserApprovedTemplate = async (q) => {
  loadUserTemplates.value = true
  let params = {
    search:q
  }
  let id = null
  if (addMode.value) {
    id = BirthdayForm.value.user?.id
    if (!id) {
      loadUserTemplates.value = false
      return templates.value = []
    }
  }else {
    id = editBirthdayForm.value.user?.id
    if (!id) {
      loadUserTemplates.value = false
      return templates.value = []
    }
  }

  try{
    let response = await api.get(`/templates/${id}`,{params})
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
const getUserGroup = async (q) => {
  loadUserGroup.value = true
  const params = {
    search:q
  }
  let id = null
  if (addMode.value) {
    id = BirthdayForm.value.user?.id
    if (!id) {
      loadUserGroup.value = false
      return groups.value = []
    }
  }else {
    id = editBirthdayForm.value.user?.id
    if (!id) {
      loadUserGroup.value = false
      return groups.value = []
    }
  }
  try{
    let response = await api.get(`/groups/user/${id}`,{params})
    if (response.data.data == null) {
      groups.value = []
    }else {
      groups.value = response.data.data
    }
    loadUserGroup.value = false
    return groups.value
  }catch (e) {
    console.log(e)
    loadUserGroup.value = false
  }
}

const getUserBirthdaySenders = async (q) => {
  loadUserSenders.value = true
  let params = {
    search:q
  }
  let id = null
  if (addMode.value) {
       id = BirthdayForm.value.user?.id
       if (!id) {
         loadUserSenders.value = false
         return senders.value = []
       }
  }else {
     id = editBirthdayForm.value.user?.id
      if (!id) {
        loadUserSenders.value = false
        return senders.value = []
      }
  }
  try{
    let response = await api.get(`/senders/${id}`,{params})
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
const removeBirthdayAlert = async (id , birthday_id) => {
  if (confirm('Are you sure?')) {
    processing.value = true
    try {
      await api.delete(`/birthday_alert/${id}/${birthday_id}`)
      await getBirthdays()
      processing.value = false

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
  await getBirthdays()
  await getScheduleMessages()
  loader.value = false
})
</script>

<template>
  <div>
 <UCard class="bg-white   rounded-lg">
   <transition name="fade" mode="out-in">
   <div class="space-y-4" v-if="loader">
     <SkeletonLoader :loader="loader" />
   </div>
  <div v-else>
    <UTabs :items="items">
      <template #item="{ item}">
        <div v-if="item.key === 'birthday'">
          <div class="flex justify-between m-2 mt-4">
            <div class="flex items-center space-x-2">
              <UInput  placeholder="search birthday alert ...." />
              <USelectMenu
                  option-attribute="email"
                  v-model="queryUser"
                  :loading="loadUsers"
                  :options="users"
                  :searchable="getUsers"
                  placeholder="Select Type"
              >
                <template #label>
                  <span v-if="queryUser" class="truncate">{{ queryUser?.email}}</span>
                  <span v-else>Select Main Account</span>
                </template>
              </USelectMenu>
              <USelectMenu
                  option-attribute="name"
                  v-model="queryService"
                  :loading="loadService"
                  :options="services"
                  :searchable="getService"
                  placeholder="Select Service"
              >
                <template #label>
                  <span v-if="queryService" class="truncate">{{ queryService?.name}}</span>
                  <span v-else>Select Service</span>
                </template>
              </USelectMenu>
              <UButton color="black" variant="solid" @click.prevent="getBirthdays" size="sm">Search</UButton>
            </div>
            <div>
              <UButton color="black" variant="solid" @click.prevent="addBirthDayAlertModal = true" size="sm">Add Birthday Alert</UButton>
            </div>
          </div>
          <UTable
              :loading="processing"
              :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
              :progress="{ color: 'purple', animation: 'carousel' }"
              class="w-full text-nowrap"
              :columns="birthday_columns"
              :rows="birthday_rows"
          >
            <template #action-data="{ row }">
              <UDropdown :items="options(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
              </UDropdown>
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
        <div v-if="item.key === 's_messages'">
          <div class="flex justify-between m-2 mt-4">
            <div class="flex items-center space-x-2">
              <UInput v-model="searchScheduleMessage"  placeholder="search schedule message ...." />
              <USelectMenu
                  option-attribute="email"
                  v-model="queryScheduleUser"
                  :loading="loadUsers"
                  :options="users"
                  :searchable="getUsers"
                  placeholder="Select Type"
              >
                <template #label>
                  <span v-if="queryScheduleUser" class="truncate">{{ queryScheduleUser?.email}}</span>
                  <span v-else>Select Main Account</span>
                </template>
              </USelectMenu>
              <USelectMenu
                  option-attribute="name"
                  v-model="queryScheduleService"
                  :loading="loadService"
                  :options="services"
                  :searchable="getService"
                  placeholder="Select Service"
              >
                <template #label>
                  <span v-if="queryScheduleService" class="truncate">{{ queryScheduleService?.name}}</span>
                  <span v-else>Select Service</span>
                </template>
              </USelectMenu>
              <UButton color="black" variant="solid" @click.prevent="getScheduleMessages" size="sm">Search</UButton>
            </div>
            <div>
              <UButton color="black" variant="solid" @click.prevent="addScheduleMessageModal = true" size="sm">Add Schedule Message</UButton>
            </div>
          </div>
          <UTable
              :loading="processing"
              :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
              :progress="{ color: 'purple', animation: 'carousel' }"
              class="w-full text-nowrap"
              :columns="s_columns"
              :rows="schedule_messages_rows"
          >
            <template #action-data="{ row }">
              <UDropdown :items="options(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
              </UDropdown>
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
            <UPagination v-model="sPage"  :total="sTotal" />
          </div>
        </div>

      </template>
    </UTabs>
  </div>
   </transition>
 </UCard>
  </div>

  <!--Birthday Edit Modal-->
  <div>
    <UModal v-model="birthdayEditModal" prevent-close :ui="{ width: 'w-full',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Edit Birthday Alert
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="birthdayEditModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="updateBirthdayAlert">
            <div class="space-y-2">
              <div>
                <div class="space-y-2">
                  <label>Service</label>
                  <USelectMenu
                      v-model="editBirthdayForm.service"
                      :options="services"
                      :loading="loadService"
                      :searchable="getService"
                      placeholder="Select Type"
                      option-attribute="name"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="editBirthdayForm.service" class="truncate">{{ editBirthdayForm.service?.name }}</span>
                      <span v-else>Select service</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2">
                  <label>User</label>
                  <USelectMenu
                      option-attribute="email"
                      v-model="editBirthdayForm.user"
                      :loading="loadUsers"
                      :options="users"
                      :searchable="getUsers"
                      placeholder="Select Type"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="editBirthdayForm.user" class="truncate">{{ editBirthdayForm.user?.email}}</span>
                      <span v-else>Select User</span>
                    </template>
                  </USelectMenu>
                </div>
                 <div class="space-y-2" v-if="showEditGroup">
                   <label>Group</label>
                   <USelectMenu
                       option-attribute="name"
                       v-model="editBirthdayForm.group"
                       :loading="loadUserGroup"
                       :options="groups"
                       :searchable="getUserGroup"
                       placeholder="Select Type"
                       trailing
                       by="id"
                   >
                     <template #label>
                       <span v-if="editBirthdayForm.group" class="truncate">{{ editBirthdayForm.group?.name}}</span>
                       <span v-else>Select Groups</span>
                     </template>
                   </USelectMenu>
                 </div>
                 <div class="space-y-2" v-if="showEditTemplate">
                   <label>Template</label>
                   <USelectMenu
                       option-attribute="title"
                       v-model="editBirthdayForm.template"
                       :loading="loadUserTemplates"
                       :options="templates"
                       :searchable="getUserApprovedTemplate"
                       placeholder="Select Type"
                       :search-attributes="['title', 'service']"
                       trailing
                       by="id"
                   >
                     <template #label>
                       <span v-if="editBirthdayForm.template" class="truncate">{{ editBirthdayForm.template?.title}}</span>
                       <span v-else>Select Template</span>
                     </template>
                     <template #option="{ option: person }">
                       <span>{{person.service}}</span> ---
                       <span class="truncate">{{ person.title }}</span>
                     </template>
                   </USelectMenu>
                 </div>
                 <div class="space-y-2" v-if="showEditSender">
                   <label>Sender</label>
                   <USelectMenu
                       option-attribute="name"
                       v-model="editBirthdayForm.sender"
                       :loading="loadUserSenders"
                       :options="senders"
                       :searchable="getUserBirthdaySenders"
                       placeholder="Select Type"
                       :search-attributes="['name', 'service']"
                       trailing
                       by="id"
                   >
                     <template #label>
                       <span v-if="editBirthdayForm.sender" class="truncate">{{ editBirthdayForm.sender?.name}}</span>
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
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Birthday Alert</UButton>
              </div>
            </div>
          </form>
        </div>
      </UCard>
    </UModal>
  </div>
  <!--End Birthday Edit Modal-->
  <!--Add Birthday Modal-->
  <div>
    <UModal v-model="addBirthDayAlertModal" prevent-close :ui="{ width: 'w-full',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Add Birthday Alert
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="addBirthDayAlertModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="addBirthdayAlert">
            <div class="space-y-2">
              <div>
                <div class="space-y-2">
                  <label>Service</label>
                  <USelectMenu
                      v-model="BirthdayForm.service"
                      :options="services"
                      :loading="loadService"
                      :searchable="getService"
                      placeholder="Select Type"
                      option-attribute="name"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="BirthdayForm.service" class="truncate">{{ BirthdayForm.service?.name }}</span>
                      <span v-else>Select service</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2">
                  <label>User</label>
                  <USelectMenu
                      option-attribute="email"
                      v-model="BirthdayForm.user"
                      :loading="loadUsers"
                      :options="users"
                      :searchable="getUsers"
                      placeholder="Select Type"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="BirthdayForm.user" class="truncate">{{ BirthdayForm.user?.email}}</span>
                      <span v-else>Select User</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2" v-if="showGroup">
                  <label>Group</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="BirthdayForm.group"
                      :loading="loadUserGroup"
                      :options="groups"
                      :searchable="getUserGroup"
                      placeholder="Select Type"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="BirthdayForm.group" class="truncate">{{ BirthdayForm.group?.name}}</span>
                      <span v-else>Select Groups</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2" v-if="showTemplate">
                  <label>Template</label>
                  <USelectMenu
                      option-attribute="title"
                      v-model="BirthdayForm.template"
                      :loading="loadUserTemplates"
                      :options="templates"
                      :searchable="getUserApprovedTemplate"
                      placeholder="Select Type"
                      :search-attributes="['title', 'service']"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="BirthdayForm.template" class="truncate">{{ BirthdayForm.template?.title}}</span>
                      <span v-else>Select Template</span>
                    </template>
                    <template #option="{ option: person }">
                      <span>{{person.service}}</span> ---
                      <span class="truncate">{{ person.title }}</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="space-y-2" v-if="showSender">
                  <label>Sender</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="BirthdayForm.sender"
                      :loading="loadUserSenders"
                      :options="senders"
                      :searchable="getUserBirthdaySenders"
                      placeholder="Select Type"
                      :search-attributes="['name', 'service']"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="BirthdayForm.sender" class="truncate">{{ BirthdayForm.sender?.name}}</span>
                      <span v-else>Add Sender</span>
                    </template>
                    <template #option="{ option: person }">
                      <span>{{person.service}}</span> ---
                      <span class="truncate">{{ person.name }}</span>
                    </template>
                  </USelectMenu>
                </div>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','birthday')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Birthday Alert</UButton>
              </div>
            </div>
          </form>
        </div>
      </UCard>
    </UModal>
  </div>
  <!--End Add Birthday Modal-->

  <!--Add Schedule Message Modal-->
  <div>
    <UModal v-model="addScheduleMessageModal" prevent-close :ui="{ width: 'w-full',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Add Message Schedule
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="addScheduleMessageModal = false" />
          </div>
        </template>

        <div class="" >
          <form @submit.prevent="addBirthdayAlert">
            <div class="">
              <div>
                <div class="grid grid-cols-2 space-x-2">
                  <div class="space-y-2">
                    <label>Service</label>
                    <USelectMenu
                        v-model="BirthdayForm.service"
                        :options="services"
                        :loading="loadService"
                        :searchable="getService"
                        placeholder="Select Type"
                        option-attribute="name"
                        trailing
                        by="id"
                    >
                      <template #label>
                        <span v-if="BirthdayForm.service" class="truncate">{{ BirthdayForm.service?.name }}</span>
                        <span v-else>Select service</span>
                      </template>
                    </USelectMenu>
                  </div>
                  <div class="space-y-2">
                    <label>User</label>
                    <USelectMenu
                        option-attribute="email"
                        v-model="BirthdayForm.user"
                        :loading="loadUsers"
                        :options="users"
                        :searchable="getUsers"
                        placeholder="Select Type"
                        trailing
                        by="id"
                    >
                      <template #label>
                        <span v-if="BirthdayForm.user" class="truncate">{{ BirthdayForm.user?.email}}</span>
                        <span v-else>Select User</span>
                      </template>
                    </USelectMenu>
                  </div>
                </div>
                <div class="my-4">
                  <UTabs :items="sourceTab" class="w-full" @change="sourceTabChange">
                    <template #item="{ item}">
                      <div v-if="item.key === 'group'">
                        <div class="space-y-2" v-if="showGroup">
                          <div class="flex justify-between items-center">
                            <label>Group</label>
                            <UCheckbox v-model="scheduleMessageForm.useTemplate" label="Use Template" />
                          </div>
                          <USelectMenu
                              option-attribute="name"
                              v-model="BirthdayForm.group"
                              :loading="loadUserGroup"
                              :options="groups"
                              :searchable="getUserGroup"
                              placeholder="Select Type"
                              trailing
                              by="id"
                          >
                            <template #label>
                              <span v-if="BirthdayForm.group" class="truncate">{{ BirthdayForm.group?.name}}</span>
                              <span v-else>Select Groups</span>
                            </template>
                          </USelectMenu>
                        </div>
                        <div class="space-y-2" v-if="scheduleMessageForm.useTemplate">
                          <label>Template</label>
                          <USelectMenu
                              option-attribute="title"
                              v-model="BirthdayForm.template"
                              :loading="loadUserTemplates"
                              :options="templates"
                              :searchable="getUserApprovedTemplate"
                              placeholder="Select Type"
                              :search-attributes="['title', 'service']"
                              trailing
                              by="id"
                          >
                            <template #label>
                              <span v-if="BirthdayForm.template" class="truncate">{{ BirthdayForm.template?.title}}</span>
                              <span v-else>Select Template</span>
                            </template>
                            <template #option="{ option: person }">
                              <span>{{person.service}}</span> ---
                              <span class="truncate">{{ person.title }}</span>
                            </template>
                          </USelectMenu>
                        </div>
                        <div v-else class="m-2">
                          <label>Message</label>
                          <div class="flex space-x-1">
                            <p @click="insertPlaceholder('[firstname]')" class="cursor-pointer text-gray-500">[firstname]</p>
                            <p @click="insertPlaceholder('[lastname]')" class="cursor-pointer text-gray-500">[lastname]</p>
                            <p @click="insertPlaceholder('[email]')" class="cursor-pointer text-gray-500">[email]</p>
                            <p @click="insertPlaceholder('[phone_number]')" class="cursor-pointer text-gray-500">[phone_number]</p>
                            <p @click="insertPlaceholder('[custom1]')" class="cursor-pointer text-gray-500">[custom1]</p>
                            <p @click="insertPlaceholder('[custom2]')" class="cursor-pointer text-gray-500">[custom2]</p>
                          </div>
                          <UTextarea id="templateMessage" v-model="scheduleMessageForm.templateMessage" size="xl" :rows="6"/>
                          <div class="flex justify-between">
                            <p class="text-sm font-semibold">{{scheduleMessageForm.templateMessage.length}} character entered</p>
                            <p class="text-sm text-green-400" v-if="scheduleMessageForm.templateMessage.length">{{scheduleMessageForm.templateMessage.length && parseInt(scheduleMessageForm.templateMessage.length / maxCount + 1)}} message per recipient</p>
                          </div>
                        </div>
                        <UCheckbox v-model="scheduleMessageForm.remove_duplicate" label="Remove Duplicate" />
                      </div>
                    </template>
                  </UTabs>
                </div>

                <div class="space-y-2" v-if="showSender">
                  <label>Sender</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="BirthdayForm.sender"
                      :loading="loadUserSenders"
                      :options="senders"
                      :searchable="getUserBirthdaySenders"
                      placeholder="Select Type"
                      :search-attributes="['name', 'service']"
                      trailing
                      by="id"
                  >
                    <template #label>
                      <span v-if="BirthdayForm.sender" class="truncate">{{ BirthdayForm.sender?.name}}</span>
                      <span v-else>Add Sender</span>
                    </template>
                    <template #option="{ option: person }">
                      <span>{{person.service}}</span> ---
                      <span class="truncate">{{ person.name }}</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="mt-2">
                  <label>Schedule Time</label>
                  <UInput type="datetime-local" />
                </div>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','birthday')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Birthday Alert</UButton>
              </div>
            </div>
          </form>
        </div>
      </UCard>
    </UModal>
  </div>
  <!--End Schedule Message Modal-->


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