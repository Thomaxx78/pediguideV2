<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import api from '@/services/api'

const router = useRouter()

const rpps = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const cpsCardUrl = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit(e: Event) {
  e.preventDefault()
  error.value = ''

  // Validate password confirmation
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas'
    return
  }

  // Validate RPPS (should be 11 digits)
  if (!/^\d{11}$/.test(rpps.value)) {
    error.value = 'Le numéro RPPS doit contenir exactement 11 chiffres'
    return
  }

  // Validate password strength (minimum 8 characters)
  if (password.value.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères'
    return
  }

  loading.value = true

  try {
    await api.auth.register({
      rpps: rpps.value,
      email: email.value,
      password: password.value,
      cpsCardUrl: cpsCardUrl.value || undefined,
    })

    // Registration successful - redirect to login
    router.push('/login')
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error('Registration error:', errorObj)

    // Handle specific error messages
    const errorMessage = errorObj.message || ''
    const lowerError = errorMessage.toLowerCase()

    if (
      lowerError.includes('rpps') ||
      lowerError.includes('email') ||
      lowerError.includes('déjà utilisé') ||
      lowerError.includes('duplicate')
    ) {
      error.value = 'Ce numéro RPPS ou cet email est déjà utilisé'
    } else if (lowerError.includes('serveur') || lowerError.includes('backend')) {
      error.value = errorMessage // Use the full server error message
    } else {
      error.value = errorMessage || 'Erreur lors de l\'inscription. Veuillez réessayer.'
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
        <FieldLabel for="rpps-number"> Numéro RPPS </FieldLabel>
        <Input
          id="rpps-number"
          v-model="rpps"
          type="text"
          name="rppsNumber"
          autocomplete="off"
          placeholder="Entrez votre numéro RPPS (11 chiffres)"
          pattern="\d{11}"
          required
          :disabled="loading"
        />
      </Field>
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
        <FieldLabel for="password"> Mot de passe </FieldLabel>
        <Input
          id="password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="new-password"
          placeholder="Entrez votre mot de passe (min. 8 caractères)"
          minlength="8"
          required
          :disabled="loading"
        />
      </Field>
      <Field>
        <FieldLabel for="confirm-password"> Confirmation </FieldLabel>
        <Input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          name="confirmPassword"
          autocomplete="new-password"
          placeholder="Confirmez votre mot de passe"
          minlength="8"
          required
          :disabled="loading"
        />
      </Field>
      <Field>
        <FieldLabel for="cps-card"> Carte CPS (optionnel) </FieldLabel>
        <Input
          id="cps-card"
          v-model="cpsCardUrl"
          type="text"
          name="cpsCard"
          placeholder="URL de votre carte CPS"
          :disabled="loading"
        />
      </Field>
      <FieldGroup>
        <Field>
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Création en cours...' : 'Créer un compte' }}
          </Button>
          <FieldDescription class="px-6 text-center">
            Vous avez déjà un compte ?
            <RouterLink to="/login">
              Se connecter
            </RouterLink>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </FieldGroup>
  </form>
</template>
