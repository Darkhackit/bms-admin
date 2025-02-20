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
const permissions = ref([])
const loadPermission = ref(false)
const canEditRole = computed(() => can('show', 'role') || can('manage', 'all'));
const canDeleteRole = computed(() => can('delete', 'role') || can('manage', 'all'));
const form = ref({
  name:'',
  permissions:[]
})
const editForm = ref({
  id:'',
  name:'',
  permissions:[]
})
const columns = ref([
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key:"permissions",
    label:"Permissions"
  },
  {
    key:"createdAt",
    label: "Created At",
    sortable: true,
  },
  {
    key:"updatedAt",
    label: "Updated At",
    sortable: true,
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
    await api.post("/roles", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    isOpen.value = false
    toast.add({
      title:"Role Added Successfully",
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
    await api.patch(`/roles/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    toast.add({
      title:"Role Updated Successfully",
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
    let response = await api.get(`/roles/${id}`)
    console.log(response)
    editForm.value.id = response.data?.id
    editForm.value.name = response.data?.name
    editForm.value.permissions = response.data?.permissions
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
    let response = await api.get("/roles",{params})
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
      await api.delete(`/roles/${id}`)
      await getData()
      processing.value = false
      toast.add({
        title:"Role Deleted Successfully",
      })
    }catch (e) {
      console.log(e)
      processing.value = false
    }
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
              <h1 class="uppercase font-medium">Roles</h1>
            </div>
            <div v-if="$can('manage','all') || $can('add','role')">
              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Roles</UButton>
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <UInput v-model="q" clearable  placeholder="Filter roles..." />
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
            <template #permissions-data="{ row }">
              <div>
                <p v-for="r in row.permissions"> {{r.name + ' '}}</p>
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
            <UPagination v-model="page"  :total="total" />
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
              Add Role
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
              <div>
                <label>Permissions</label>
                <USelectMenu
                    option-attribute="name"
                    v-model="form.permissions"
                    :loading="loadPermission"
                    :searchable="getPermissions"
                    multiple
                    trailing
                    by="id"
                >
                  <template #label>
                    <span v-if="form.permissions.length" class="truncate">{{ form.permissions.map(p => p.name).join(', ') }}</span>
                    <span v-else>Select permission</span>
                  </template>
                </USelectMenu>
              </div>
              <div class="flex justify-end" v-if="$can('manage','all') || $can('add','role')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Add Role</UButton>
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
    <UModal v-model="editModal" prevent-close :ui="{ width: 'w-[20%]',padding:'p-2'}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white uppercase">
              Update Role
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
              <div class="flex justify-end" v-if="$can('manage','all') || $can('update','role')">
                <UButton type="submit" :loading="processing" color="black" variant="solid">Update Role</UButton>
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