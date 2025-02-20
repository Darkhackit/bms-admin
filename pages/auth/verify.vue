<script setup lang="ts">
import {useAuthStore} from "~/store/auth";
import {useRouter} from "#vue-router";

definePageMeta({
  layout:'authentication'
})
const router = useRouter();
const toast = useToast();
const authStore  = useAuthStore();
const processing = ref(false)
const previousRoute = useState('previousRoute')
const form = ref({
  code:'',
  route:previousRoute.value
})
const errors = ref([])

const clearErrors = (field) => {
  delete errors.value[field]
}
const login = async () => {
  processing.value = true
  try {
    let response = await api.post("/verify_otp", form.value)
    processing.value = false
    if (response.data?.change_password) {
      return await navigateTo({name:'auth-set_new_password'})
    }else {
      await authStore.checkAuth()

      processing.value = false
      await navigateTo("/")
    }
  }catch (e) {
    console.log(e)
    if (e.response?.status === 422) {
      errors.value = e.response.data
    }
    if (e.response?.status === 500) {
      errors.value = {code:e.response?.data}
    }
    processing.value = false
  }
}
console.log(previousRoute.value)

</script>

<template>
  <div>
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!--      <img class="mx-auto h-10 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />-->
      <h2 class="mt-6 text-center text-2xl font-bold leading-9 tracking-tight dark:text-white text-gray-900">Enter Verification Code</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div class="bg-white dark:bg-gray-700 px-6 py-12 shadow-2xl sm:rounded-lg sm:px-12">
        <form class="space-y-6"  @submit.prevent="login">
          <div>
            <label for="email" class="block text-sm font-medium leading-6 dark:text-white text-gray-900">Code</label>
            <div class="mt-2">
              <input id="email" v-model="form.code" name="email" @input="clearErrors('code')" type="text"  :class="errors?.code ? 'ring-red-500' : 'ring-gray-300'"  class="block w-full rounded-md border-0 py-1.5 px-3 dark:bg-gray-600 dark:text-white text-gray-900 shadow-sm ring-1 ring-inset  placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <small v-if="errors?.code" class="text-red-500">{{errors?.code}}</small>
            </div>
          </div>

          <div>
            <UButton :loading="processing" color="black" type="submit" class="flex w-full justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Verify</UButton >
          </div>
        </form>

        <div>

          <div class="mt-6 grid grid-cols-2 gap-4">
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>