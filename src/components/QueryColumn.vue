<!-- INFLUX-UI-PG-1/frontend/influx-web-app/src/components/QueryColumn.vue -->
<template>
  <el-card class="qcol" shadow="never">
    <!-- 列头Column Header：FROM / Filter -->
    <div class="qcol-head">{{ column.type === 'from' ? 'FROM' : 'Filter' }}</div>
    <!-- 子标题Subtitle：Bucket / Measurement / Field / Tag Key / Tag Value -->
    <div class="qcol-sublabel">{{ column.label }}</div>

    <!-- 输入框Input Box：FROM 下面才是 Search buckets / 其它列的搜索框 -->
    <el-select
      v-if="!column.multi"
      v-model="local"
      filterable
      clearable
      :placeholder="column.placeholder || ('Search ' + (column.label || ''))"
      class="qcol-input"
      @change="emit"
    >
      <el-option
        v-for="opt in normalizedOptions"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <el-select
      v-else
      v-model="local"
      multiple
      collapse-tags
      collapse-tags-tooltip
      filterable
      clearable
      :placeholder="column.placeholder || ('Select ' + (column.label || ''))"
      class="qcol-input"
      @change="emit"
    >
      <el-option
        v-for="opt in normalizedOptions"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  queryId: { type: String, required: true },
  column:  { type: Object, required: true },
  onSelect:{ type: Function, required: true },
})

const local = ref(props.column.value)

// 兼容后端返回 ['str'] 或 [{name:'a'},{label:'b',value:'b'}] 等格式
//Compatible with backends returning formats such as ['str'] or [{name:'a'},{label:'b',value:'b'}]
const normalizedOptions = computed(() => {
  const list = Array.isArray(props.column.options) ? props.column.options : []
  return list.map(o => {
    if (typeof o === 'string') return { label: o, value: o }
    const label = o.label ?? o.name ?? o.text ?? o.value
    const value = o.value ?? o.name ?? o.label ?? o.text
    return { label, value }
  })
})

watch(() => props.column.value, v => { local.value = v })

function emit(v) {
  props.onSelect(props.queryId, props.column.key, v)
}
</script>

<style scoped>
.qcol {
  width: 280px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  position: relative;
}
.qcol::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, #60a5fa, #bfdbfe);
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  opacity: .85;
}
.qcol:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,.06); border-color: #dbe3f0; }

.qcol-head {
  font-weight: 800;
  font-size: 11px;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: #334155;
  opacity: .9;
  display: inline-block;
  background: #eef2ff;
  padding: 4px 8px;
  border-radius: 8px;
}

.qcol-sublabel {
  font-weight: 600;
  font-size: 12px;
  color: #475569;
  letter-spacing: .02em;
  margin-top: -2px;
}

.qcol-input { width: 100%; }

/* Tweak Element Plus inside card */
:deep(.el-card__body) { padding: 14px; }
:deep(.el-select .el-input__wrapper) {
  border-radius: 10px;
  padding: 2px 10px;
  transition: box-shadow .18s ease, border-color .18s ease;
}
:deep(.el-input__wrapper.is-focus),
:deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
:deep(.el-select__tags) { margin-left: 6px; }
:deep(.el-tag) { border-radius: 8px; }
:deep(.el-select-dropdown__item) { font-size: 13px; }

/* Placeholder & dropdown polish */
:deep(.el-input__inner::placeholder) { color: #94a3b8; }
:deep(.el-select__tags .el-tag) { background: #eff6ff; color: #1d4ed8; border-color: transparent; }
:deep(.el-select__tags .el-tag .el-tag__close) { color: #1d4ed8; }
:deep(.el-select-dropdown) { border-radius: 10px; box-shadow: 0 10px 22px rgba(0,0,0,.08); overflow: hidden; }
:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) { background: #f1f5f9; }
:deep(.el-select-dropdown__item.selected) { background: #e0f2fe; color: #075985; font-weight: 600; }
</style>
