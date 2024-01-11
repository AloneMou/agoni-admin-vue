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
  <div class="bg-bg_color w-[99/100] pl-8 pt-0 pb-8 pr-8 mt-2 mb-15px">
    <slot></slot>
  </div>
</template>
