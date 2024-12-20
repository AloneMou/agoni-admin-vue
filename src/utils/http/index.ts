import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import {stringify} from "qs";
import NProgress from "../progress";
import {getToken, formatToken} from "@/utils/auth";
import {useUserStoreHook} from "@/store/modules/user";
import {AxiosRequestHeaders} from "axios";
// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  baseURL: import.meta.env.VITE_APP_BASE_API + '/admin-api/',
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** token过期后，暂存待执行的请求 */
  private static requests = [];

  /** 防止重复刷新token */
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前Axios实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        config.headers["Authorization"] = formatToken(token);
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 开启进度条动画
        NProgress.start();
        // 是否需要设置 token
        let isToken = (config!.headers || {}).isToken === false
        if (getToken()?.accessToken && !isToken) {
          ;(config as Recordable).headers.Authorization = 'Bearer ' + getToken().accessToken // 让每个请求携带自定义token
        }
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        config.headers["Tenant-Id"] = 1;

        /** 请求白名单，放置一些不需要token的接口（通过设置请求白名单，防止token过期后再请求造成的死循环问题） */
        const whiteList = ["/auth/refresh-token", "/auth/login"];
        whiteList.some((v) => {
          if (config.url) {
            config.url.indexOf(v) > -1
            return (isToken = false)
          }
        })
        const params = config.params || {}
        const data = config.data || false
        if (
          config.method?.toUpperCase() === 'POST' &&
          (config.headers as AxiosRequestHeaders)['Content-Type'] ===
          'application/x-www-form-urlencoded'
        ) {
          config.data = qs.stringify(data)
        }
        // get参数编码
        if (config.method?.toUpperCase() === 'GET' && params) {
          let url = config.url + '?'
          for (const propName of Object.keys(params)) {
            const value = params[propName]
            if (value !== void 0 && value !== null && typeof value !== 'undefined') {
              if (typeof value === 'object') {
                for (const val of Object.keys(value)) {
                  const params = propName + '[' + val + ']'
                  const subPart = encodeURIComponent(params) + '='
                  url += subPart + encodeURIComponent(value[val]) + '&'
                }
              } else {
                url += `${propName}=${encodeURIComponent(value)}&`
              }
            }
          }
          // 给 get 请求加上时间戳参数，避免从缓存中拿数据
          // const now = new Date().getTime()
          // params = params.substring(0, url.length - 1) + `?_t=${now}`
          url = url.slice(0, -1)
          config.params = {}
          config.url = url
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const {data, config} = response

        // 关闭进度条动画
        NProgress.done();
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeResponseCallback === "function") {
          config.beforeResponseCallback(response);
          return data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          return data;
        }
        return data;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 关闭进度条动画
        NProgress.done();
        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: undefined) => {
          resolve(response);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的post工具函数 */
  public async post<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    const res = await this.request<P>("post", url, params, config);
    return res.data as unknown as T
  }

  /** 单独抽离的get工具函数 */
  public async get<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    const res = await this.request<P>("get", url, params, config);
    return res.data as unknown as T
  }

  /** 单独抽离的get工具函数 */
  public async put<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    const res = await this.request<P>("put", url, params, config);
    return res.data as unknown as T
  }

  /** 单独抽离的get工具函数 */
  public async delete<T, P>(
    url: string,
    params?: AxiosRequestConfig<T>,
    config?: PureHttpRequestConfig
  ): Promise<P> {
    const res = await this.request<P>("delete", url, params, config);
    return res.data as unknown as T
  }
}

export const http = new PureHttp();
