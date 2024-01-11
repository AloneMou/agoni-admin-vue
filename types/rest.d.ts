type CommonResult<T extends any> = {
  code: number,
  message: string,
  data: T,
}

type PageResult<T extends any> = {
  list: T[],
  total: number
}


interface CommonPageResult<T extends any> {
  code: number,
  message: string,
  data: PageResult<T>,
}

type PageParam = {
  pageNo: number,
  pageSize: number,
}

type BaseVO = {
  createTime: Date,
  updateTime: Date,
  creator: string,
  updator: string,
  id: string,
}
