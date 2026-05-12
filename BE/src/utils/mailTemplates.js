/**
 * Template email dùng chung dựa trên phong cách tối giản của Cloudinary
 * @param {string} title - Tiêu đề chính (Ví dụ: Here's the confirmation code)
 * @param {string} value - Giá trị tiêu điểm (OTP hoặc Link)
 * @param {string} name - Tên người nhận
 * @param {string} description - Mô tả thêm (Ví dụ: Thời gian hết hạn)
 */

import { configDotenv } from "dotenv";
configDotenv();




export const baseEmailTemplate = (title, value, name = "User", description = "") => {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; text-align: left;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background-color: #f4f4f4; padding: 15px; border-radius: 50%;">
           <img src="${process.env.LOGO_URL}" width="40" alt="Lock Icon" />
        </div>
      </div>
      
      <p style="font-size: 16px;">Hi ${name},</p>
      <p style="font-size: 16px; margin-bottom: 5px;">${title}:</p>
      
      <div style="font-size: 32px; font-weight: bold; margin: 20px 0; letter-spacing: 2px;">
        ${value}
      </div>
      
      ${description ? `<p style="font-size: 14px; color: #666;">${description}</p>` : ""}
      
      <p style="font-size: 14px; color: #666; margin-top: 30px;">
        If you didn't request this, you can ignore this email or let us know.
      </p>
      
      <p style="font-size: 16px; margin-top: 40px;">
        Thanks,<br>
        <strong>The OG Management Team</strong>
      </p>
    </div>
  `;
};