<script setup lang="ts">
interface Props {
  image: string
  alt?: string
  widthClass?: string
  heightClass?: string
}

const {
  image,
  alt = "",
  widthClass = 'w-fit',
  heightClass = 'h-fit',
} = defineProps<Props>()

const images = import.meta.glob<{ default: string }>('../../assets/images/*.{png,jpg,webp}', {
  query: '?url',
  eager: true,
})

const importedImage = () => {
  const extensions = ['png', 'jpg', 'webp']
  for (const ext of extensions) {
    const imagePath = `../../assets/images/${image}.${ext}`
    if (images[imagePath]) {
      return images[imagePath].default
    }
  }
  console.warn('No image found for:', image)
  return ''
}
</script>

<template>
  <img
    v-if="importedImage()"
    :src="importedImage()"
    :alt="alt"
    :class="[widthClass, heightClass]"
    class="inline-block object-contain"
  />
</template>
