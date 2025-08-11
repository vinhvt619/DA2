import React from "react";
import { SocialIcon } from "react-social-icons/component";
import "react-social-icons/facebook";
import "react-social-icons/twitter";
import "react-social-icons/email";
import "react-social-icons/linkedin";

export default function Terms() {
  return (
    <div className="mt-4 text-gray-400  text-[10px]">
      <div className="flex justify-between">
        <div>Giới thiệu</div>
        <div>Liên hệ</div>
        <div>Hỏi đáp</div>
        <div>Tuyển dụng</div>
      </div>
      <div className="flex">
        <div className="mr-5">Chính sách</div>
        <div>Điều khoản dịch vụ</div>
      </div>
      <div className="">Quy chế hoạt động</div>
      <div className="flex justify-around mt-5">
        <SocialIcon
          network="facebook"
          style={{ height: 30, width: 30 }}
          url="https://fb.com"
        />
        <SocialIcon
          network="twitter"
          style={{ height: 30, width: 30 }}
          url="https://x.com"
        />
        <SocialIcon
          network="email"
          bgColor="red"
          style={{ height: 30, width: 30 }}
          url="https://gmail.com"
        />
        <SocialIcon
          network="linkedin"
          style={{ height: 30, width: 30 }}
          url="https://linkedin.com"
        />
      </div>
    </div>
  );
}
