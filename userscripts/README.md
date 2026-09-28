# AI Conversation Controller — Tampermonkey test

ทดลองแนวคิด GPT ↔ Gemini แบบ browser-side userscript แยกจากโปรเจกต์ Network Configuration

## Design

- Userscript เดียว
- GPT และ Gemini เป็น page instances ของ script เดียวกัน
- Shared state ผ่าน Tampermonkey storage
- Native response Copy button เป็น completion gate
- หลัง Copy ใช้ response payload เป็นข้อมูลส่งต่อ และวางลงใน input ของอีกฝั่ง
- Reload เป็น recovery mechanism
- State/checkpoint ถูกบันทึกก่อน/หลัง step สำคัญ
- Error → reload → ตรวจ state ใหม่
- เกิน reload limit → STOP
- ไม่มี API, OpenRouter, server หรือ database

## Current test boundary

ทดสอบได้ใน repository ด้วย state-machine test และ syntax check

การทดสอบบนหน้า ChatGPT/Gemini จริงยังต้องเปิด Safari/iPad ที่มี Tampermonkey และล็อกอินทั้งสองบริการ เพราะ DOM จริงและสิทธิ์ browser ไม่สามารถจำลองจาก Node ได้

## Known platform constraint

Tampermonkey มี persistent values และ change listeners สำหรับสื่อสารระหว่าง script instances/แท็บได้ แต่ browser security ไม่รับประกันว่าผู้ใช้สคริปต์จะสามารถควบคุมการสลับแท็บ Safari และอ่าน system clipboard ได้โดยอัตโนมัติทุกกรณี ดังนั้น prototype นี้ใช้ shared state สำหรับการส่งต่อข้อมูล และใช้ native Copy action เป็น gate

อ้างอิง:
- https://www.tampermonkey.net/documentation.php
- https://www.tampermonkey.net/index.php?browser=safari
