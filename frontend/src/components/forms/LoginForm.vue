<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import api from '@/services/api'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit(e: Event) {
  e.preventDefault()
  error.value = ''
  loading.value = true

  try {
    const response = await api.auth.login(email.value, password.value)
    if (response) router.push('/profile')
  } catch (err: unknown) {
    const errorObj = err as Error
    console.error('Login error:', errorObj)
    const errorMessage = errorObj.message || ''
    const lowerError = errorMessage.toLowerCase()

    if (lowerError.includes('401') || lowerError.includes('invalid') || lowerError.includes('credentials')) {
      error.value = 'Email ou mot de passe incorrect.'
    } else {
      error.value = 'Erreur de connexion. Veuillez vérifier vos identifiants ou réessayer plus tard.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-5" @submit="handleSubmit" novalidate>
    <FieldError v-if="error" :errors="[error]" />

    <Field>
      <FieldLabel for="email" required>Email professionnel</FieldLabel>
      <Input
        id="email"
        v-model="email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="c.reynaud@cabinet-bichat.fr"
        required
        :disabled="loading"
      />
    </Field>

    <Field>
      <div class="flex items-center justify-between">
        <FieldLabel for="password" required>Mot de passe</FieldLabel>
        <a
          href="#"
          class="text-[12.5px] text-[var(--color-muted-strong)] hover:text-[var(--color-ink)] hover:underline"
          @click.prevent
        >Mot de passe oublié&nbsp;?</a>
      </div>
      <Input
        id="password"
        v-model="password"
        type="password"
        name="password"
        autocomplete="current-password"
        placeholder="••••••••"
        required
        :disabled="loading"
      />
    </Field>

    <Button type="submit" :block="true" :disabled="loading">
      {{ loading ? 'Connexion…' : 'Se connecter' }}
    </Button>

    <p class="text-center text-[13.5px] text-[var(--color-ink-2)]">
      Pas encore de compte&nbsp;?
      <RouterLink to="/register" class="font-medium text-primary hover:underline">
        Créer un compte
      </RouterLink>
    </p>
  </form>
</template>
