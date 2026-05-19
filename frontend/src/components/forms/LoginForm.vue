<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
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
    
    // Explicitly check success before redirecting
    if (response) {
       router.push('/profile')
    }
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error('Login error:', errorObj)
    
    // Improve error messages for user
    const errorMessage = errorObj.message || ''
    const lowerError = errorMessage.toLowerCase()
    
    if (lowerError.includes('401') || lowerError.includes('invalid') || lowerError.includes('credentials')) {
      error.value = 'Email ou mot de passe incorrect'
    } else {
      error.value = 'Erreur de connexion. Veuillez vérifier vos identifiants ou réessayer plus tard.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form @submit="handleSubmit">
    <FieldGroup>
      <div v-if="error" class="rounded-md bg-red-50 p-3 text-sm text-red-800 mb-4">
        {{ error }}
      </div>

      <Field>
        <FieldLabel for="email"> Email </FieldLabel>
        <Input
          id="email"
          v-model="email"
          type="email"
          name="email"
          autocomplete="email"
          placeholder="Entrez votre email"
          required
          :disabled="loading"
        />
      </Field>
      <Field>
        <div class="flex items-center">
          <FieldLabel for="password"> Mot de passe </FieldLabel>
        </div>
        <Input
          id="password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="current-password"
          placeholder="Entrez votre mot de passe"
          required
          :disabled="loading"
        />
      </Field>
      <Field>
        <Button type="submit" :disabled="loading">
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </Button>
        <FieldDescription class="text-center">
          Pas encore de compte ?
          <RouterLink
            to="/register"
          >
            Créer un compte
          </RouterLink>
        </FieldDescription>
      </Field>
    </FieldGroup>
  </form>
</template>
