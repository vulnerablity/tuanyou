import React from "react";
import { Form, Button, Input } from '@nutui/nutui-react';
import { ArrowLeft } from '@nutui/icons-react';
import { useDispatch } from "react-redux";
import Taro from '@tarojs/taro';
import { fetchRegister } from '@/store/modules/user';
import type { AppDispatch } from '@/store'
import './index.less';

const Register = () => {
  const dispatch: AppDispatch = useDispatch<AppDispatch>();

  //+ 注册表单提交
  const onFinish = async (values: { phone: string; nickname: string; password: string; confirmPassword: string }) => {
    try {
      //+ 调用注册Action
      const result:any = await dispatch(fetchRegister({
        phone: values.phone,
        password: values.password,
        nickname: values.nickname
      }));

      //+ 注册成功后跳转到首页
      if (result.type === 'user/fetchRegister/fulfilled') {
        Taro.showToast({
          title: '注册成功',
          icon: 'success'
        });
        setTimeout(() => {
          Taro.redirectTo({ url: '/pages/Home/index' });
        }, 1500);
      }
    } catch (error) {
      console.error('注册失败:', error);
    }
  };

  //+ 返回登录页
  const handleBack = () => {
    Taro.navigateBack();
  };

  return (
    <div className="register-container">
      {/* 顶部注册字样和返回登录箭头 */}
      <div className="register-header">
        <ArrowLeft className='arrow-left' onClick={handleBack} />
        <span>注册</span>
      </div>

      {/* logo */}
      <div className="logo">
        <img src='http://192.168.10.7:89/logo.png' alt="logo" />
        <p>探索自然，结伴前行</p>
      </div>

      {/* 表单区域 */}
      <Form className="register-form" onFinish={onFinish}>
        {/* 手机号输入框 */}
        <Form.Item
          className='form-item'
          name="phone"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
          ]}
        >
          <Input placeholder="请输入手机号" type="tel" className='input' />
        </Form.Item>

        {/* 昵称输入框 */}
        <Form.Item
          className='form-item'
          name="nickname"
          rules={[
            { required: true, message: '请输入昵称' },
            { min: 2, max: 20, message: '昵称长度为2-20个字符' }
          ]}
        >
          <Input placeholder="请输入昵称" className='input' />
        </Form.Item>

        {/* 请设置密码（至少六位） */}
        <Form.Item
          className='form-item'
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少6位' }
          ]}
        >
          <Input placeholder="请设置密码（至少六位）" type="password" className='input' />
        </Form.Item>

        {/* 请确认密码 */}
        <Form.Item
          className='form-item'
          name="confirmPassword"
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              }
            })
          ]}
        >
          <Input placeholder="请确认密码" type="password" className='input' />
        </Form.Item>

        {/* 注册按钮 */}
        <Button type="primary" block className="register-btn" nativeType="submit">
          注册
        </Button>
      </Form>

      {/* 已有账号？去登录 */}
      <div className="register-link">
        已有账号？
        <a href="/login">去登录</a>
      </div>
    </div>
  );
};

export default Register;
