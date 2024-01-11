<script lang="ts" setup>
import propTypes from '@/utils/propTypes'
import {useDesign} from '@/hooks/web/useDesign'

defineOptions({name: 'ContentWrap'})

const {getPrefixCls} = useDesign()

const prefixCls = getPrefixCls('content-wrap')

defineProps({
  title: propTypes.string.def(''),
  message: propTypes.string.def('')
})
</script>

<template>
  <div class="flex justify-between w-full h-[60px] p-4 pr-0 pl-0">
    <div class="flex">
      <slot></slot>
    </div>
    <div class="flex">
      <slot></slot>
    </div>
  </div>

</template>
