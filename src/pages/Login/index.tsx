//+ 导入React和Nutui组件
import React from "react";
import { Form, Button, Input } from '@nutui/nutui-react';
//+ 导入NutUI组件库样式
import '@nutui/nutui-react/dist/style.css';
import '@nutui/nutui-biz/dist/style.css';
//+ 导入页面样式文件
import './index.less';
//+ 导入Redux相关
import { useDispatch } from "react-redux";
import Taro from '@tarojs/taro';
import { fetchLogin } from '@/store/modules/user';
import type { AppDispatch } from '@/store'
const Login = () => {
  const dispatch: AppDispatch = useDispatch<AppDispatch>();

  //+ 登录表单提交
  const onFinish = async (values: { phone: string; password: string }) => {
    try {
      //+ 调用登录Action
      const result: any = await dispatch(fetchLogin({
        phone: values.phone,
        password: values.password
      }));

      //+ 登录成功后跳转到首页
      if (result.type === 'user/fetchLogin/fulfilled') {
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        });
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/Home/index' });
        }, 1500);
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="logo">
        <img src='http://192.168.10.7:89/logo.png' alt="logo" />
        <p>探索自然，结伴前行</p>
      </div>
      <Form
        className="login-form"
        onFinish={onFinish}
        footer={
          <div className="form-footer">
            <Button type="primary" nativeType="submit" block className="button">
              登录
            </Button>
          </div>
        }
      >
        <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]} className="form-item">
          <Input placeholder="请输入手机号" type="tel" className="phone input" />
        </Form.Item>
        <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} className="form-item">
          <Input placeholder="请输入密码" type="password" className="password input" />
        </Form.Item>
      </Form>
      <div className="register-link">
        还没有账号？
        <a href="/register">立即注册</a>
      </div>
    </div>
  );
};

export default Login;
