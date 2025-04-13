<script setup lang="ts">
import { ref } from 'vue'
import {useAuthStore} from "~/store/auth";
import {useRoute} from "#vue-router";
import {useAbility} from "@casl/vue";

const {can} = useAbility()
const colorMode = useColorMode()
const authStore = useAuthStore()
const route = useRoute()
const isDark = computed({
  get () {
    return colorMode.value === 'dark'
  },
  set () {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})
const navigation = [
  { name: 'Dashboard', href: '/', icon: "i-heroicons-home", current: "/" ,action:"all" ,subject:"all" },
  { name: 'Contacts', href: '/contacts', icon: "i-heroicons-identification", current: "/contacts" ,action:"list" ,subject:"contact" },
  { name: 'Senders', href: '/senders', icon: "i-heroicons-arrow-left-start-on-rectangle", current: "/senders" ,action:"list" ,subject:"sender" },
  { name: 'Templates', href: '/templates', icon: "i-heroicons-rectangle-stack", current: "/templates" ,action:"list" ,subject:"template" },
  { name: 'Groups', href: '/groups', icon: "i-heroicons-rectangle-group", current: "/groups" ,action:"list" ,subject:"group" },
  { name: 'Customers', href: '/customers', icon: "i-heroicons-user-group", current: "/customers" ,action:"list" ,subject:"customer" },
  { name: 'Packages', href: '/packages', icon: "i-heroicons-inbox-stack", current: "/packages" ,action:"list" ,subject:"package" },
  { name: 'Rates', href: '/rates', icon: "i-heroicons-arrow-path-rounded-square", current: "/rates" ,action:"list" ,subject:"rate" },
  { name: 'Services', href: '/services', icon: "i-heroicons-arrow-down-on-square-stack", current: "/services" ,action:"list" ,subject:"service" },
  { name: 'Service Deductions', href: '/service_deductions', icon: "i-heroicons-presentation-chart-line", current: "/service_deductions" ,action:"list" ,subject:"service_deduction" },
  { name: 'Users', href: '/users', icon: "i-heroicons-users", current: "/users" ,action:"list" ,subject:"admin" },
  { name: 'Countries', href: '/countries', icon: "i-heroicons-flag", current: "/countries" ,action:"list" ,subject:"country" },
  { name: 'Roles', href: '/roles', icon: "i-heroicons-user-plus", current: "/roles", action:"list" ,subject:"role" },
  { name: 'Permissions', href: '/permissions', icon: "i-heroicons-lock-closed", current: "/permissions", action:"list" ,subject:"permission" },
]
const teams = [
  // { id: 1, name: 'Heroicons', href: '#', initial: 'H', current: false },
  // { id: 2, name: 'Tailwind Labs', href: '#', initial: 'T', current: false },
  // { id: 3, name: 'Workcation', href: '#', initial: 'W', current: false },
]
const userNavigation = [
  { name: 'Your profile', href: '#' },
  { name: 'Sign out', href: '#' },
]

const sidebarOpen = ref(false)

const logout = async () => {
    try {
       await api.post("/logout")
       authStore.isAuthenticated = false
       await authStore.checkAuth()
       navigateTo({name:'auth-login'})
    }catch (e) {

    }
}
</script>
<template>
  <div>
    <HeadlessTransitionRoot as="template" :show="sidebarOpen">
      <HeadlessDialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <HeadlessTransitionChild as="template" enter="transition-opacity ease-linear duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="transition-opacity ease-linear duration-300" leave-from="opacity-100" leave-to="opacity-0">
          <div class="fixed inset-0 bg-gray-900/80" />
        </HeadlessTransitionChild>

        <div class="fixed inset-0 flex">
          <HeadlessTransitionChild as="template" enter="transition ease-in-out duration-300 transform" enter-from="-translate-x-full" enter-to="translate-x-0" leave="transition ease-in-out duration-300 transform" leave-from="translate-x-0" leave-to="-translate-x-full">
            <HeadlessDialogPanel class="relative mr-16 flex w-full max-w-xs flex-1">
              <HeadlessTransitionChild as="template" enter="ease-in-out duration-300" enter-from="opacity-0" enter-to="opacity-100" leave="ease-in-out duration-300" leave-from="opacity-100" leave-to="opacity-0">
                <div class="absolute left-full top-0 flex w-16 justify-center pt-5">
                  <button type="button" class="-m-2.5 p-2.5" @click="sidebarOpen = false">
                    <span class="sr-only">Close sidebar</span>
                    <UIcon name="i-heroicons-x-mark" class="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </HeadlessTransitionChild>
              <!-- Sidebar component, swap this element with another sidebar if you like -->
              <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
                <div class="flex h-16 shrink-0 items-center">
                  <img class="h-8 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=white" alt="Your Company" />
                </div>
                <nav class="flex flex-1 flex-col">
                  <ul role="list" class="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" class="-mx-2 space-y-1">
                        <li v-for="item in navigation" :key="item.name">
                          <a :href="item.href" :class="[item.current ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:text-white hover:bg-indigo-700', 'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold']">
                            <UIcon :name="item.icon" :class="[item.current ? 'text-white' : 'text-indigo-200 group-hover:text-white', 'h-6 w-6 shrink-0']" aria-hidden="true" />
                            {{ item.name }}
                          </a>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <div class="text-xs font-semibold leading-6 text-indigo-200">Your teams</div>
                      <ul role="list" class="-mx-2 mt-2 space-y-1">
                        <li v-for="team in teams" :key="team.name">
                          <a :href="team.href" :class="[team.current ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:text-white hover:bg-indigo-700', 'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold']">
                            <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-indigo-400 bg-indigo-500 text-[0.625rem] font-medium text-white">{{ team.initial }}</span>
                            <span class="truncate">{{ team.name }}</span>
                          </a>
                        </li>
                      </ul>
                    </li>
                    <li class="mt-auto">
                      <a href="#" class="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-indigo-200 hover:bg-indigo-700 hover:text-white">
                        <UIcon name="i-heroicons-adjustments-vertical" class="h-6 w-6 shrink-0 text-indigo-200 group-hover:text-white" aria-hidden="true" />
                        Settings
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </HeadlessDialogPanel>
          </HeadlessTransitionChild>
        </div>
      </HeadlessDialog>
    </HeadlessTransitionRoot>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col h-screen">
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-600 px-6 pb-4 shadow-2xl  sm:rounded-lg">
        <div class="flex h-16 shrink-0 items-center">
          <!--          <img class="h-8 w-auto" src="https://tailwindui.com/img/logos/mark.svg?color=white" alt="Your Company" />-->
        </div>
        <nav class="flex flex-1 flex-col">
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-1">
                <ClientOnly>
                <li v-for="item in navigation" :key="item.name">
                  <nuxt-link v-if="can('manage','all') || can(item.action,item.subject)" :to="item.href" :class="[route.path === item.current ? 'dark:bg-gray-800 dark:text-white bg-gray-200 text-gray-00' : 'dark:text-white text-gray-500 dark:hover:text-white dark:hover:bg-gray-700 hover:text-gray-500 hover:bg-gray-100', 'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold']">
                    <UIcon :name="item.icon" :class="[route.path === item.current ? 'dark:text-white text-gray-500' : 'dark:text-white text-gray-500 dark:group-hover:text-white group-hover:text-gray-500', 'h-6 w-6 shrink-0']" aria-hidden="true" />
                    {{ item.name }}
                  </nuxt-link>
                </li>
                </ClientOnly>
              </ul>
            </li>

            <li class="mt-auto">
              <a href="#" class="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-indigo-200 hover:bg-indigo-700 hover:text-white">
                <UIcon name="i-heroicons-adjustments-vertical" class="h-6 w-6 shrink-0 text-indigo-200 group-hover:text-white" aria-hidden="true" />
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="lg:pl-72">
      <div class="sticky top-0 sm:top-5 z-40 w-full sm:w-[98%] rounded-md mx-auto flex h-16 shrink-0 items-center gap-x-4   bg-white dark:bg-gray-700 px-4 shadow-xl  dark:inset-shadow-gray-500 sm:gap-x-6 sm:px-6 lg:px-12">
        <button type="button" class="-m-2.5 p-2.5 text-gray-700 lg:hidden" @click="sidebarOpen = true">
          <span class="sr-only">Open sidebar</span>
          <UIcon name="i-heroicons-bars-3-center-left" class="h-6 w-6 text-gray-800 dark:text-white" aria-hidden="true" />
        </button>

        <!-- Separator -->
        <div class="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />

        <div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <form class="relative flex flex-1" action="#" method="GET">

          </form>
          <div class="flex items-center gap-x-4 lg:gap-x-6">
            <ClientOnly>
              <UButton
                  :icon="isDark ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
                  color="gray"
                  variant="ghost"
                  aria-label="Theme"
                  @click="isDark = !isDark"
              />
              <template #fallback>
                <div class="w-8 h-8" />
              </template>
            </ClientOnly>

            <!-- Separator -->
            <div class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-900/10" aria-hidden="true" />

            <!-- Profile dropdown -->
            <HeadlessMenu as="div" class="relative">
              <HeadlessMenuButton class="-m-1.5 flex items-center p-1.5">
                <span class="sr-only">Open user menu</span>
                <UIcon name="i-heroicons-user" class="h-6 w-8 rounded-full text-gray-800 dark:text-white"  />
                <span class="hidden lg:flex lg:items-center">
<!--                  <UIcon name="i-heroicons-chevron-down" class="ml-2 h-5 w-5 text-gray-400" aria-hidden="true" />-->
                </span>
              </HeadlessMenuButton>
              <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
                <HeadlessMenuItems class="absolute right-0 z-10 mt-2.5 w-48 p-2 origin-top-right dark:bg-gray-600 rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                  <HeadlessMenuItem >
                    <a class="block cursor-pointer px-3 py-1 text-sm leading-6 text-gray-600 dark:text-white hover:bg-gray-100 hover:dark:bg-gray-800">Settings</a>
                  </HeadlessMenuItem>
                  <HeadlessMenuItem @click.prevent="logout" >
                    <a class="block cursor-pointer px-3 py-1 text-sm leading-6 text-gray-600 dark:text-white hover:bg-gray-100 hover:dark:bg-gray-800">Logout</a>
                  </HeadlessMenuItem>
                </HeadlessMenuItems>
              </transition>
            </HeadlessMenu>
          </div>
        </div>
      </div>

      <main class="py-10 bg-gray-100 dark:bg-gray-800  h-screen">
        <div class="px-4 sm:px-6 lg:px-8 ">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>

</style>