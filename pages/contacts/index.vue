<script setup>
import api from "~/utils/api.js";
import SkeletonLoader from "~/components/skeletonLoader.vue";
import {useAbility} from "@casl/vue";
import { read, utils } from 'xlsx';
import Papa from 'papaparse';
const ws = useNuxtApp().$ws

const toast = useToast();
const {can} = useAbility()
const processing = ref(false)
const isOpen = ref(false)
const editModal = ref(false)
const loadMainusers = ref(false)
const loadUserGroup = ref(false)
const loadUsers = ref(false)
const showGroup = ref(true)
const showEditGroup = ref(true)
const showUploadGroup = ref(true)
const loader = ref(true)
const q = ref('')
const rows = ref([])
const queryUser = ref(null)
const main_users = ref([])
const users = ref([])
const groups = ref([])
const errors = ref([])
const error = ref([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const fileInput = ref(null);
const isDragging = ref(false);
const errorMessage = ref('');
const columnValidation = ref(null);
const markedContact = ref([]);

//
const loadingState = ref(0);


// Define your expected columns here
const expectedColumns = [
  'name',
  'email',
  'phone',
  'date_of_birth',
  'custom_1',
  'custom_2',
  // Add all your expected column names
];

const form = ref({
  name:'',
  users:'',
  user_id:'',
  phone_number:'',
  birthday:'',
  email:'',
  custom_1:'',
  custom_2:'',
  groups:[]
})
const uploadForm = ref({
  users:'',
  user_id:'',
  file:'',
  groups:[]
})
const canEditPermission = computed(() => can('show', 'contact') || can('manage', 'all'));
const canDeletePermission = computed(() => can('delete', 'contact') || can('manage', 'all'));
const editForm = ref({
  id:'',
  name:'',
  users:'',
  user_id:'',
  phone_number:'',
  birthday:'',
  email:'',
  custom_1:'',
  custom_2:'',
  groups:[]
})
const columns = ref([
  {
    key: "name",
    label: "Name",
    sortable: true,
  },
  {
    key: "email",
    label: "Email",
    sortable: true,
  },
  {
    key:"phone_number",
    label:"Phone Number"
  },
  {
    key:"birthday",
    label:"Birthday"
  },
  {
    key:"user_name",
    label:"Owner"
  },
  {
    key:"group_count",
    label:"Group Count"
  },
  {
    key:"custom1",
    label:"Custom 1",
  },
  {
    key:"custom2",
    label:"Custom 2",
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
    click: () => getSingleData(row.id,row.user_id)
  }:{}],
  [canDeletePermission.value ?{
    label: 'Delete',
    icon: 'i-heroicons-trash-20-solid',
    click: () => deleteData(row.id)
  }:{}]
]

watch(() => form.value.users, () => {
     form.value.groups = []
     showGroup.value = false
   setTimeout(() => showGroup.value = true,5)
})
watch(() => editForm.value.users, () => {
     editForm.value.groups = []
  showEditGroup.value = false
   setTimeout(() => showEditGroup.value = true,5)
})

watch(() => uploadForm.value.users, () => {
  uploadForm.value.groups = []
  showUploadGroup.value = false
  setTimeout(() => showUploadGroup.value = true,5)
})

const tabs = [{
  label: 'Create Contact',
  icon: 'i-heroicons-information-circle',
  key: 'account',
}, {
  label: 'Upload File',
  icon: 'i-heroicons-arrow-down-tray',
  key: 'file',
}
]

const addData = async () => {
  processing.value = true
  form.value.user_id = form.value.users?.id
  try {
    await api.post("/contacts", form.value)
    await getData()
    processing.value = false
    form.value.name = ""
    form.value.phone_number = ""
    form.value.birthday = ""
    form.value.email = ""
    form.value.custom_1 = ""
    form.value.custom_2 = ""
    form.value.users = ""
    form.value.groups = []
    toast.add({
      title:"Contact Added Successfully",
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

const uploadData = async () => {
  processing.value = true
  uploadForm.value.user_id = uploadForm.value.users?.id
  console.log(uploadForm.value)
  try {
    await api.post("/contacts/upload", uploadForm.value,{
      headers:{
        'Content-Type':"multipart/form-data"
      }
    })
    await getData()
    processing.value = false
    toast.add({
      title:"Contact Added Successfully",
    })
    uploadForm.value.file =""
    uploadForm.value.users =""
    uploadForm.value.user_id =""
    uploadForm.value.groups = []
    columnValidation.value = null
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
  try {
    await api.patch(`/contacts/${editForm.value.id}`, editForm.value)
    await getData()
    processing.value = false
    editModal.value = false
    toast.add({
      title:"Contact Updated Successfully",
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
    let response = await api.get(`/contacts/${id}/${user_id}`)
    console.log(response)
    editForm.value.id = response.data?.id
    editForm.value.name = response.data?.name
    editForm.value.users = response.data?.user
    editForm.value.phone_number = response.data?.phone_number
    editForm.value.birthday = response.data?.birthday
    editForm.value.email = response.data?.email
    editForm.value.custom_1 = response.data?.custom_1
    editForm.value.custom_2 = response.data?.custom_2
    setTimeout(() => editForm.value.groups = response.data?.groups , 6)
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
    email:queryUser.value?.email
  }
  processing.value = true
  try{
    let response = await api.get("/contacts",{params})
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
  const contact = markedContact.value.map(c => c.id)
  const user_id = rows.value[0].user_id
  if (confirm('Are you sure?')) {
    processing.value = true
    try {
      await api.post(`/contacts/delete`,{id:contact,user_id:user_id})
      await getData()
      processing.value = false
      toast.add({
        title:"Contact Deleted Successfully",
      })
      markedContact.value = []
    }catch (e) {
      console.log(e)
      processing.value = false
    }
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

const getUserGroup = async (q) => {
  loadUserGroup.value = true
  if (!form.value.users) {
    loadUserGroup.value = false
    return  groups.value
  }
  const params = {
    search:q
  }
  try{
    let response = await api.get(`/groups/user/${form.value.users?.id}`,{params})
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

const selectContact = (row) => {

  const index = markedContact.value.findIndex(contact => contact === row.id)
  console.log(index)
  if (index === -1) {
    markedContact.value.push(row.id)
  }else {
    markedContact.value.splice(index, 1)
  }
  console.log(markedContact.value)
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

const getEditUserGroup = async (q) => {
  loadUserGroup.value = true
  if (!editForm.value.users) {
    loadUserGroup.value = false
    return  groups.value
  }
  const params = {
    search:q
  }
  try{
    let response = await api.get(`/groups/user/${editForm.value.users?.id}`,{params})
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

const getUserGroupForUpload = async (q) => {
  loadUserGroup.value = true
  if (!uploadForm.value.users) {
    loadUserGroup.value = false
    return  groups.value
  }
  const params = {
    search:q
  }
  try{
    let response = await api.get(`/groups/user/${uploadForm.value.users?.id}`,{params})
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

const openFilePicker = () => {
  fileInput.value.click();
};

const handleDrop = (e) => {
  isDragging.value = false;
  if (e.dataTransfer.files.length) {
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  }
};

const handleFileChange = (e) => {
  if (e.target.files.length) {
    const file = e.target.files[0];
    validateAndSetFile(file);
  }
};

const validateAndSetFile = async (file) => {
  if (!isValidFileType(file)) {
    errorMessage.value = 'Please upload only .xlsx or .csv files';
    uploadForm.value.file = null;
    columnValidation.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
    return;
  }

  uploadForm.value.file = file;
  errorMessage.value = '';

  try {
    const columns = await extractFileColumns(file);
    validateColumns(columns);
  } catch (error) {
    errorMessage.value = 'Error reading file: ' + error.message;
    console.error(error);
  }
};


const isValidFileType = (file) => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  return validTypes.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.csv');
};

const extractFileColumns = (file) => {
  return new Promise((resolve, reject) => {
    if (file.name.endsWith('.xlsx')) {
      // Handle Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = utils.sheet_to_json(firstSheet, { header: 1 });
          const columns = jsonData[0]; // First row contains headers
          resolve(columns);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.csv')) {
      // Handle CSV file
      Papa.parse(file, {
        header: true,
        preview: 1,
        complete: (results) => {
          resolve(Object.keys(results.meta.fields || (results.data[0] || {})));
        },
        error: (error) => {
          reject(error);
        }
      });
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};
const validateColumns = (actualColumns) => {
  // Normalize column names (trim, lowercase, etc.)
  const normalizedActual = actualColumns.map(col => col.toString().trim().toLowerCase());
  const normalizedExpected = expectedColumns.map(col => col.trim().toLowerCase());

  const validationResults = normalizedExpected.map(expectedCol => {
    const found = normalizedActual.includes(expectedCol);
    return {
      name: expectedCol,
      valid: found
    };
  });

  const missingColumns = normalizedExpected.filter(
      col => !normalizedActual.includes(col)
  );

  columnValidation.value = {
    columns: validationResults,
    missingColumns,
    isValid: missingColumns.length === 0
  };

  // Emit validation results to parent if needed
  // emit('columns-validated', columnValidation.value);
};

const convertDate = (dateString) => {
  const date = new Date(dateString);

  const year = date.getUTCFullYear(); // Get last 2 digits of the year
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = date.getUTCDate().toString().padStart(2, '0');

  return `${day}-${month}-${year}`
}

onMounted(async () => {
  ws.on('contact-upload',data => {
    loadingState.value = data.upload_contact;
    console.log(data);
  })
  await getData()
  loader.value = false
})

const newProcess = ref(false)
watch(()=>loadingState.value,(newValue)=>{
  console.log(newValue)
  if( newValue>0){
    newProcess.value = true;
  }
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
              <h1 class="uppercase font-medium">Contacts</h1>
            </div>
            <div v-if="$can('manage','all') || $can('add','contact')">
              <UButton @click.prevent="isOpen = true" color="black" variant="solid">Add Contact</UButton>
            </div>
          </div>
          <div>
            <div class="flex space-x-2 px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
              <UInput v-model="q" clearable  placeholder="Filter contact..." />
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
              <UButton color="black" variant="solid" @click.prevent="getSearchData" size="2xs">Search</UButton>
              <UButton v-if="markedContact.length && canDeletePermission" color="red" variant="solid" @click.prevent="deleteData" size="2xs">Delete Contact</UButton>
            </div>
          </div>
          <UTable
              :loading="processing"
              :loading-state="{ icon: 'i-heroicons-arrow-path-20-solid', label: 'Loading...' }"
              :progress="{ color: 'purple', animation: 'carousel' }"
              class="w-full text-nowrap"
              :columns="columns"
              :rows="rows"
              v-model="markedContact"
          >
            <template #action-data="{ row }">
              <UDropdown :items="items(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
              </UDropdown>
            </template>
            <template #birthday-data="{ row }">
              <div>
                <p > {{convertDate(row.birthday)}}</p>
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
    <UModal v-model="isOpen" prevent-close :ui="{ width: 'w-full',padding:''}">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
          <div class="flex items-center justify-end">
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
          </div>
        <div class="" >
          <UTabs :items="tabs" class="w-full">
            <template #item="{ item}">
              <div v-if="item.key === 'account'">
                <form class="space-y-2" @submit.prevent="addData">
                  <div class="grid grid-cols-2 space-x-2">
                    <div>
                      <label>Name</label>
                      <UInput  clearable v-model="form.name"   @input="clearErrors('name')" :input-class="errors.name ? 'border border-red-500' :''" placeholder="Name" />
                      <small class="text-red-500" v-if="errors?.name">{{errors.name}}</small>
                    </div>
                    <div>
                      <label>Phone Number</label>
                      <UInput  clearable v-model="form.phone_number"   @input="clearErrors('phone_number')" :input-class="errors.phone_number ? 'border border-red-500' :''"  placeholder="Phone Number" />
                      <small class="text-red-500" v-if="errors?.phone_number">{{errors.phone_number}}</small>
                    </div>
                   </div>
                  <div class="grid grid-cols-2 space-x-2">
                    <div>
                      <label>Birthday</label>
                      <UInput  clearable v-model="form.birthday" @input="clearErrors('dateofbirth')" :input-class="errors.dateofbirth ? 'border border-red-500' :''"  placeholder="Birthday" type="date" />
                      <small class="text-red-500" v-if="errors?.dateofbirth">{{errors.dateofbirth}}</small>
                    </div>
                    <div>
                      <label>Email</label>
                      <UInput  clearable v-model="form.email" @input="clearErrors('email')" :input-class="errors.email ? 'border border-red-500' :''"   placeholder="Email" />
                      <small class="text-red-500" v-if="errors?.email">{{errors.email}}</small>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 space-x-2">
                    <div>
                      <label>Custom 1</label>
                      <UInput  clearable v-model="form.custom_1" @input="clearErrors('custom1')" :input-class="errors.custom1 ? 'border border-red-500' :''"  placeholder="Custom 1" type="text" />
                      <small class="text-red-500" v-if="errors?.custom1">{{errors.custom1}}</small>
                    </div>
                    <div>
                      <label>Custom 2</label>
                      <UInput  clearable v-model="form.custom_2" @input="clearErrors('custom2')" :input-class="errors.custom2 ? 'border border-red-500' :''"  placeholder="Custom 2" />
                      <small class="text-red-500" v-if="errors?.custom2">{{errors.custom2}}</small>
                    </div>
                  </div>
                  <div class="space-y-2" >
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
                    <small class="text-red-500" v-if="errors?.userid">{{errors.userid}}</small>
                  </div>
                  <div class="space-y-2" v-if="showGroup">
                    <label>Groups</label>
                    <USelectMenu
                        option-attribute="name"
                        v-model="form.groups"
                        :loading="loadUserGroup"
                        :options="groups"
                        :searchable="getUserGroup"
                        placeholder="Select Type"
                        multiple
                    >
                      <template #label>
                        <span v-if="form.groups.length" class="truncate">{{ form.groups.map(group => group.name).join(',')}}</span>
                        <span v-else>Select Groups</span>
                      </template>
                    </USelectMenu>
                    <small class="text-red-500" v-if="errors?.groupid">{{errors.userid}}</small>
                  </div>
                  <div class="flex justify-end mt-4" v-if="$can('manage','all') || $can('add','contact')">
                    <UButton type="submit" :loading="processing" color="black" variant="solid">Add Contact</UButton>
                  </div>
                </form>
              </div>
              <div v-else-if="item.key === 'file'">
                <div v-if="newProcess" class="text-center space-y-4 py-10">
                  <UProgress :value="loadingState"/>
                  <div v-if="loadingState == 100" class="space-y-2">
                    <p>Contacts Uploaded Successfully</p>
                    <UButton @click="(e)=>{loadingState=0; newProcess=false;}">Complete</UButton>
                  </div>
                </div>
                <form  @submit.prevent="uploadData" v-if="!newProcess">
                <div class="space-y-2">
                  <label>Main Account</label>
                  <USelectMenu
                      option-attribute="email"
                      v-model="uploadForm.users"
                      :loading="loadMainusers"
                      :options="main_users"
                      :searchable="getMainUsers"
                      placeholder="Select Type"
                  >
                    <template #label>
                      <span v-if="uploadForm.users" class="truncate">{{ uploadForm.users?.email}}</span>
                      <span v-else>Select Main Account</span>
                    </template>
                  </USelectMenu>
                  <small class="text-red-500" v-if="errors?.userid">{{errors.userid}}</small>
                </div>

                <div class="max-w-md mx-auto  bg-white rounded-lg shadow-sm space-y-2">
                  <label>Import contacts from excel</label>

                  <div
                      @click="openFilePicker"
                      @dragover.prevent="isDragging = true"
                      @dragleave="isDragging = false"
                      @drop.prevent="handleDrop"
                      :class="[
                      'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                      isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                    ]"
                  >
                    <div class="flex flex-col items-center justify-center space-y-2">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p class="text-sm text-gray-600">File should be .xlsx or .csv</p>
                      <p class="text-sm text-gray-500">Drag and drop your file here, or click to browse</p>
                    </div>
                    <input
                        ref="fileInput"
                        type="file"
                        class="hidden"
                        accept=".xlsx,.csv"
                        @change="handleFileChange"
                    />
                  </div>

                  <div v-if="uploadForm.file" class="mt-3 text-sm text-gray-600">
                    Selected file: {{ uploadForm.file.name }}
                  </div>

                  <div v-if="errorMessage" class="mt-3 text-sm text-red-500">
                    {{ errorMessage }}
                  </div>

                  <!-- Show column validation results -->
                  <div v-if="columnValidation" class="mt-4">
                    <h3 class="font-medium text-gray-700 mb-2">Column Validation:</h3>
                    <ul class="text-sm space-y-1">
                      <li v-for="(col, index) in columnValidation.columns" :key="index"
                          :class="col.valid ? 'text-green-600' : 'text-red-600'">
                        {{ col.name }}:
                        <span v-if="col.valid">✓ Found</span>
                        <span v-else>✗ Missing</span>
                      </li>
                    </ul>
                    <p v-if="columnValidation.missingColumns.length" class="mt-2 text-red-500 text-sm">
                      Missing required columns: {{ columnValidation.missingColumns.join(', ') }}
                    </p>
                  </div>
                </div>
                <div class="space-y-2" v-if="showUploadGroup">
                  <label>Groups</label>
                  <USelectMenu
                      option-attribute="name"
                      v-model="uploadForm.groups"
                      :loading="loadUserGroup"
                      :options="groups"
                      :searchable="getUserGroupForUpload"
                      placeholder="Select Type"
                      multiple
                  >
                    <template #label>
                      <span v-if="uploadForm.groups.length" class="truncate">{{ uploadForm.groups.map(group => group.name).join(',')}}</span>
                      <span v-else>Select Groups</span>
                    </template>
                  </USelectMenu>
                </div>
                <div class="flex justify-end mt-4" v-if="$can('manage','all') || $can('add','contact')">
                  <UButton type="submit" :loading="processing" color="black" variant="solid">Add Contact</UButton>
                </div>
                </form>
              </div>

            </template>
          </UTabs>
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
              Update Contact
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="editModal = false" />
          </div>
        </template>

        <div class="" >
          <form class="space-y-2" @submit.prevent="updateData">
            <div class="grid grid-cols-2 space-x-2">
              <div>
                <label>Name</label>
                <UInput  clearable v-model="editForm.name"   @input="clearError('name')" :input-class="error.name ? 'border border-red-500' :''" placeholder="Name" />
                <small class="text-red-500" v-if="error?.name">{{error.name}}</small>
              </div>
              <div>
                <label>Phone Number</label>
                <UInput  clearable v-model="editForm.phone_number"   @input="clearError('phone_number')" :input-class="error.phone_number ? 'border border-red-500' :''"  placeholder="Phone Number" />
                <small class="text-red-500" v-if="error?.phone_number">{{error.phone_number}}</small>
              </div>
            </div>
            <div class="grid grid-cols-2 space-x-2">
              <div>
                <label>Birthday</label>
                <UInput  clearable v-model="editForm.birthday" @input="clearError('dateofbirth')" :input-class="error.dateofbirth ? 'border border-red-500' :''"  placeholder="Birthday" type="date" />
                <small class="text-red-500" v-if="error?.dateofbirth">{{error.dateofbirth}}</small>
              </div>
              <div>
                <label>Email</label>
                <UInput  clearable v-model="editForm.email" @input="clearError('email')" :input-class="error.email ? 'border border-red-500' :''"   placeholder="Email" />
                <small class="text-red-500" v-if="error?.email">{{error.email}}</small>
              </div>
            </div>
            <div class="grid grid-cols-2 space-x-2">
              <div>
                <label>Custom 1</label>
                <UInput  clearable v-model="editForm.custom_1" @input="clearError('custom1')" :input-class="error.custom1 ? 'border border-red-500' :''"  placeholder="Custom 1" type="text" />
                <small class="text-red-500" v-if="error?.custom1">{{error.custom1}}</small>
              </div>
              <div>
                <label>Custom 2</label>
                <UInput  clearable v-model="editForm.custom_2" @input="clearError('custom2')" :input-class="error.custom2 ? 'border border-red-500' :''"  placeholder="Custom 2" />
                <small class="text-red-500" v-if="error?.custom2">{{error.custom2}}</small>
              </div>
            </div>
            <div class="space-y-2" >
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
              <small class="text-red-500" v-if="error?.userid">{{error.userid}}</small>
            </div>
            <div class="space-y-2" v-if="showEditGroup">
              <label>Groups</label>
              <USelectMenu
                  option-attribute="name"
                  v-model="editForm.groups"
                  :loading="loadUserGroup"
                  :options="groups"
                  :searchable="getEditUserGroup"
                  placeholder="Select Type"
                  multiple
                  trailing
                  by="id"
              >
                <template #label>
                  <span v-if="editForm.groups.length" class="truncate">{{ editForm.groups.map(group => group.name).join(',')}}</span>
                  <span v-else>Select Groups</span>
                </template>
              </USelectMenu>
              <small class="text-red-500" v-if="error?.groupid">{{error.userid}}</small>
            </div>
            <div class="flex justify-end mt-4" v-if="$can('manage','all') || $can('update','contact')">
              <UButton type="submit" :loading="processing" color="black" variant="solid">Update Contact</UButton>
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