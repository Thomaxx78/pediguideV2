<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import api from '@/services/api'

const router = useRouter()

const firstName = ref('')
const lastName = ref('')
const rpps = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const accept = ref(false)
const error = ref('')
const loading = ref(false)

async function handleSubmit(e: Event) {
  e.preventDefault()
  error.value = ''

  if (!firstName.value.trim()) {
    error.value = 'Le prénom est requis.'
    return
  }
  if (!lastName.value.trim()) {
    error.value = 'Le nom est requis.'
    return
  }
  if (!/^\d{11}$/.test(rpps.value.replace(/\s/g, ''))) {
    error.value = 'Le numéro RPPS doit comporter 11 chiffres.'
    return
  }
  if (!email.value.includes('@')) {
    error.value = 'Adresse email invalide.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Le mot de passe doit contenir au moins 8 caractères.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  if (!accept.value) {
    error.value = 'Vous devez accepter les CGU.'
    return
  }

  loading.value = true

  try {
    await api.auth.register({
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      rpps: rpps.value,
      email: email.value,
      password: password.value,
    })
    router.push('/login')
  } catch (err: unknown) {
    const errorObj = err as Error
    console.error('Registration error:', errorObj)
    const errorMessage = errorObj.message || ''
    const lowerError = errorMessage.toLowerCase()

    if (
      lowerError.includes('rpps') ||
      lowerError.includes('email') ||
      lowerError.includes('déjà utilisé') ||
      lowerError.includes('duplicate')
    ) {
      error.value = 'Ce numéro RPPS ou cet email est déjà utilisé.'
    } else if (lowerError.includes('serveur') || lowerError.includes('backend')) {
      error.value = errorMessage
    } else {
      error.value = errorMessage || "Erreur lors de l'inscription. Veuillez réessayer."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="space-y-5" @submit="handleSubmit" novalidate>
    <FieldError v-if="error" :errors="[error]" />

    <div class="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel for="first-name" required>Prénom</FieldLabel>
        <Input
          id="first-name"
          v-model="firstName"
          type="text"
          name="firstName"
          autocomplete="given-name"
          placeholder="Claire"
          required
          :disabled="loading"
        />
      </Field>
      <Field>
        <FieldLabel for="last-name" required>Nom</FieldLabel>
        <Input
          id="last-name"
          v-model="lastName"
          type="text"
          name="lastName"
          autocomplete="family-name"
          placeholder="Reynaud"
          required
          :disabled="loading"
        />
      </Field>
    </div>

    <Field>
      <FieldLabel for="rpps-number" required>Numéro RPPS</FieldLabel>
      <Input
        id="rpps-number"
        v-model="rpps"
        type="text"
        inputmode="numeric"
        name="rppsNumber"
        autocomplete="off"
        placeholder="10003456789"
        pattern="\d{11}"
        required
        :disabled="loading"
      />
      <p class="text-[12.5px] text-[var(--color-muted-strong)]">
        11 chiffres — vérifié auprès de l'annuaire des professionnels de santé.
      </p>
    </Field>

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

    <div class="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel for="password" required>Mot de passe</FieldLabel>
        <Input
          id="password"
          v-model="password"
          type="password"
          name="password"
          autocomplete="new-password"
          placeholder="••••••••"
          minlength="8"
          required
          :disabled="loading"
        />
      </Field>
      <Field>
        <FieldLabel for="confirm-password" required>Confirmation</FieldLabel>
        <Input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          name="confirmPassword"
          autocomplete="new-password"
          placeholder="••••••••"
          minlength="8"
          required
          :disabled="loading"
        />
      </Field>
    </div>

    <label class="flex items-start gap-2.5 text-[13.5px] text-[var(--color-ink-2)] cursor-pointer select-none">
      <input
        v-model="accept"
        type="checkbox"
        class="mt-0.5 size-4 rounded border-[var(--color-line-2)] accent-primary"
      />
      <span>
        J'accepte les
        <RouterLink to="/conditions-utilisation" class="text-primary hover:underline">CGU</RouterLink>
        et la
        <RouterLink to="/confidentialite" class="text-primary hover:underline">politique de confidentialité</RouterLink>.
      </span>
    </label>

    <Button type="submit" :block="true" :disabled="loading">
      {{ loading ? 'Création…' : 'Créer le compte' }}
    </Button>

    <p class="text-center text-[13.5px] text-[var(--color-ink-2)]">
      Vous avez déjà un compte&nbsp;?
      <RouterLink to="/login" class="font-medium text-primary hover:underline">
        Se connecter
      </RouterLink>
    </p>
  </form>
</template>
