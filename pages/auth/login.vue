<script setup lang="ts">
import {useAuthStore} from "~/store/auth";

definePageMeta({
  layout:'authentication'
})

const authStore  = useAuthStore();
const processing = ref(false)
const form = ref({
  username:'',
  password:''
})
const errors = ref([])

const clearErrors = (field) => {
  delete errors.value[field]
}
const login = async () => {
  processing.value = true
  try {
    let response = await api.post("/login", form.value)
    if (response && response.data && response.data?.change_password) {
        await navigateTo({name:'auth-set_new_password'})

    } else if(response && response.data && response.data?.otp) {
       await navigateTo({name:'auth-verify'})
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
      errors.value = {username:e.response?.data}
    }
    processing.value = false
  }
}
</script>

<template>
  <div>
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!--      <img class="mx-auto h-10 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600" alt="Your Company" />-->
      <h2 class="mt-6 text-center text-2xl font-bold leading-9 tracking-tight dark:text-white text-gray-900">Sign in to your account</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div class="bg-white dark:bg-gray-700 px-6 py-12 shadow-2xl sm:rounded-lg sm:px-12">
        <form class="space-y-6"  @submit.prevent="login">
          <div>
            <label for="email" class="block text-sm font-medium leading-6 dark:text-white text-gray-900">Username</label>
            <div class="mt-2">
              <input id="email" v-model="form.username" name="email" @input="clearErrors('username')" type="text"  :class="errors?.username ? 'ring-red-500' : 'ring-gray-300'"  class="block w-full rounded-md border-0 py-1.5 px-3 dark:bg-gray-600 dark:text-white text-gray-900 shadow-sm ring-1 ring-inset  placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <small v-if="errors?.username" class="text-red-500">{{errors?.username}}</small>
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium leading-6 dark:text-white text-gray-900">Password</label>
            <div class="mt-2">
              <input id="password" v-model="form.password" @input="clearErrors('password')" :class="errors?.password ? 'ring-red-500' : 'ring-gray-300'" name="password" type="password" autocomplete="current-password"  class="block w-full rounded-md border-0 py-1.5 px-3 dark:bg-gray-600 dark:text-white  text-gray-900 shadow-sm ring-1 ring-inset  placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
              <small v-if="errors?.password" class="text-red-500">{{errors?.password}}</small>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input id="remember-me" name="remember-me"  type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
              <label for="remember-me" class="ml-3 block text-sm leading-6 dark:text-white text-gray-900">Remember me</label>
            </div>

            <div class="text-sm leading-6">
              <nuxt-link :to="{name:'auth-forget_password'}" class="font-semibold dark:text-white text-gray-700 dark:hover:text-white  hover:text-gray-800">Forgot password?</nuxt-link>
            </div>
          </div>

          <div>
            <UButton :loading="processing" color="black" type="submit" class="flex w-full justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign in</UButton >
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