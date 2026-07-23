//+ 导入React和NutuiLogin组件
import React, { useState, useEffect } from "react";
import { Form,Button,Input} from '@nutui/nutui-react';
//+ 导入NutUI组件库样式
import '@nutui/nutui-react/dist/style.css';
import '@nutui/nutui-biz/dist/style.css';
//+ 导入页面样式文件
import './index.less';


const Login = () => {
  const logoImg =
    "https://img10.360buyimg.com/imagetools/jfs/t1/187998/28/32123/16333/63e346b8F0bff354b/c95da99ea108c463.png";
 




  //+ 页面加载时自动测试
  useEffect(() => {
   
  }, []);


  return (
    <div className="login-container">
      <div className="logo">
        <img src={logoImg} alt="logo" />
        <p>探索自然，结伴前行</p>
      </div>
    <Form
      className="login-form"
      footer={
        <div className="form-footer">
          <Button type="primary" nativeType="submit" block className="button">
            登录
          </Button>
        </div>
      }
    >
      <Form.Item name="phone" rules={[{ required: true, message: '请输入手机号' }]} className="form-item">
        <Input placeholder="请输入手机号" type="tel" className="phone input"/>
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]} className="form-item">
        <Input placeholder="请输入密码" type="password" className="password input"/>
      </Form.Item>
    </Form>
    <div className="register-link">
              还没有账号？
              <a href="#/register">立即注册</a>
            </div>
      </div>
      
  );
};

export default Login;