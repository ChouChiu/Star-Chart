<script setup lang="ts">
defineProps<{ modelValue: string }>();
defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<template>
  <details class="token-input">
    <summary class="token-summary">GitHub Token (optional — increases rate limit)</summary>
    <input
      type="password"
      class="token-field"
      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p class="token-hint">Paste a GitHub Personal Access Token to raise the API limit from 60 to 5,000 req/hr.</p>
  </details>
</template>

<style scoped>
.token-input {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}
.token-summary {
  cursor: pointer;
  user-select: none;
}
.token-field {
  margin-top: 6px;
  width: 100%;
  max-width: 360px;
  padding: 6px 10px;
  font-family: monospace;
  font-size: 13px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}
.token-field:focus {
  border-color: #2563eb;
}
.token-hint {
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}
</style>
