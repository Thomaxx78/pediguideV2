<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils.ts'
import RegisterForm from '@/components/forms/RegisterForm.vue'

</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle as="h1">Créer un compte</CardTitle>
      <CardDescription>
        Entrez vos informations pour créer votre compte.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <RegisterForm />
    </CardContent>
  </Card>
</template>
