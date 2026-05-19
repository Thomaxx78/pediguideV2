<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils.ts'
import type { HTMLAttributes } from 'vue'
import LoginForm from '@/components/forms/LoginForm.vue'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card>
      <CardHeader>
        <CardTitle as="h1">Connexion à votre compte</CardTitle>
        <CardDescription>Entrez vos informations pour vous connecter.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  </div>
</template>
