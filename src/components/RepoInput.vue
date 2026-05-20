<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{ add: [fullName: string] }>();
const input = ref("");
const error = ref("");

function submit() {
  const val = input.value.trim();
  if (!val) return;

  const match = val.match(/^(?:https?:\/\/github\.com\/)?([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) {
    error.value = 'Invalid format. Use "owner/repo" or a GitHub URL.';
    return;
  }

  error.value = "";
  emit("add", `${match[1]}/${match[2]}`);
  input.value = "";
}
</script>

<template>
  <var-space direction="column" size="4">
    <div class="input-row">
      <var-input
        v-model="input"
        placeholder="owner/repo  or  https://github.com/owner/repo"
        clearable
        size="small"
        variant="outlined"
        class="repo-field"
        @keydown.enter="submit"
      />
      <var-button type="primary" size="small" @click="submit">Add</var-button>
    </div>
    <p v-if="error" class="input-error">{{ error }}</p>
  </var-space>
</template>

<style scoped>
.input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.repo-field {
  flex: 1;
  max-width: 480px;
}
.input-error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  margin: 0;
}
</style>
