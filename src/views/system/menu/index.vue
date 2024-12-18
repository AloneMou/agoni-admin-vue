<template>
  <div class="main">
    <el-form
      ref="queryFormRef"
      :inline="true"
      :model="queryParams"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px]"
      label-width="68px"
    >
      <el-form-item label="菜单名称" prop="name">
        <el-input
          v-model="queryParams.name"
          class="!w-240px"
          clearable
          placeholder="请输入菜单名称"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          class="!w-240px"
          clearable
          placeholder="请选择菜单状态"
        >
          <!--          <el-option-->
          <!--            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"-->
          <!--            :key="dict.value"-->
          <!--            :label="dict.label"-->
          <!--            :value="dict.value"-->
          <!--          />-->
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery">
          <Icon class="mr-5px" icon="ep:search"/>
          搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon class="mr-5px" icon="ep:refresh"/>
          重置
        </el-button>

      </el-form-item>
    </el-form>


    <ContentWrap>
      <TableTool>
        <el-button plain type="danger" @click="toggleExpandAll">
          <Icon class="mr-5px" icon="ep:sort"/>
          展开/折叠
        </el-button>
        <el-button plain @click="refreshMenu">
          <Icon class="mr-5px" icon="ep:refresh"/>
          刷新菜单缓存
        </el-button>
      </TableTool>

      <el-table
        adaptive
        v-if="refreshTable"
        v-loading="loading"
        :data="list"
        :default-expand-all="isExpandAll"
        :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)'
          }"
        row-key="id"
      >
        <el-table-column :show-overflow-tooltip="true" label="菜单名称" prop="name" width="250"/>
        <el-table-column align="center" label="图标" prop="icon" width="100">
          <template #default="scope">
            <Icon :icon="scope.row.icon"/>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sort" width="60"/>
        <el-table-column :show-overflow-tooltip="true" label="权限标识" prop="permission"/>
        <el-table-column :show-overflow-tooltip="true" label="组件路径" prop="component"/>
        <el-table-column :show-overflow-tooltip="true" label="组件名称" prop="componentName"/>
        <el-table-column label="状态" prop="status" width="80">
          <!--        <template #default="scope">-->
          <!--          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status"/>-->
          <!--        </template>-->
        </el-table-column>
        <el-table-column align="center" label="操作">
          <template #default="scope">
            <el-button
              v-hasPermi="['system:menu:update']"
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['system:menu:create']"
              link
              type="primary"
              @click="openForm('create', undefined, scope.row.id)"
            >
              新增
            </el-button>
            <el-button
              v-hasPermi="['system:menu:delete']"
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </ContentWrap>

    <!-- 表单弹窗：添加/修改 -->
    <MenuForm ref="formRef" @success="getList" />
  </div>
</template>
<script setup lang="ts">
import {nextTick, onMounted, reactive, ref} from "vue";
import {deleteMenu, getMenuList} from "@/api/menu";
import {handleTree} from "@/utils/tree";
import MenuForm from './form.vue'
import {ContentWrap} from '@/components/ContentWrap'
import {TableTool} from '@/components/TableTool'
import {useMessage} from "@/hooks/web/useMessage";

const message = useMessage()
const queryFormRef = ref() // 搜索的表单

const loading = ref(false) // 列表的加载中
const list = ref<any>([]) // 列表的数据
const queryParams = reactive({
  name: undefined,
  status: undefined
})

const isExpandAll = ref(false) // 是否展开，默认全部折叠
const refreshTable = ref(true) // 重新渲染表格状态

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getMenuList(queryParams)
    list.value = handleTree(data)
    console.log(list.value)
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number, parentId?: number) => {
  formRef.value.open(type, id, parentId)
}

/** 展开/折叠操作 */
const toggleExpandAll = () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
}

/** 刷新菜单缓存按钮操作 */
const refreshMenu = async () => {
  try {
    await message.confirm('即将更新缓存刷新浏览器！', '刷新菜单缓存')
    // 清空，从而触发刷新
    // wsCache.delete(CACHE_KEY.USER)
    // wsCache.delete(CACHE_KEY.ROLE_ROUTERS)
    // 刷新浏览器
    location.reload()
  } catch {
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await deleteMenu(id)
    message.success('common.delSuccess')
    // 刷新列表
    await getList()
  } catch {
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
