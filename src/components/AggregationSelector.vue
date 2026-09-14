<script setup>
import { computed } from 'vue'

// props
const props = defineProps({
  mode: { type: String, default: 'CUSTOM' }
})

// 父组件双向绑定 v-model
const modelValue = defineModel({ type: Array, default: () => ['mean'] })

// 两组聚合函数
const customAggs = [
  'mean', 'median', 'max', 'min', 'sum',
  'derivative', 'nonnegative derivative',
  'distinct', 'count', 'increase', 'skew',
  'spread', 'stddev', 'first', 'last', 'unique', 'sort'
]

const autoAggs = ['mean', 'median', 'last']

// 根据模式切换列表
const aggList = computed(() =>
  props.mode === 'CUSTOM' ? customAggs : autoAggs
)
</script>

<template>
  <div class="agg-select-wrapper">
    <el-select
      v-model="modelValue"
      multiple
      placeholder="Select aggregate functions"
      class="agg-select"
      collapse-tags
      collapse-tags-tooltip
    >
      <el-option
        v-for="item in aggList"
        :key="item"
        :label="item"
        :value="item"
      />
    </el-select>
  </div>
</template>

<style scoped>
.agg-select-wrapper {
  margin-top: 8px;
}

.agg-select {
  width: 240px;
}

.el-select-dropdown__item.is-selected {
  font-weight: 600;
  color: #409eff;
}
</style>
