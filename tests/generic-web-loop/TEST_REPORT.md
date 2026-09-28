# Two-Page Copy/Paste Loop Test Report

## Scope

ทดสอบ Generic Web แบบ 2 หน้า/2 Tab ก่อนเชื่อมต่อ GPT/Gemini โดยเน้น:

- Web A ↔ Web B
- Tab activation/switch
- Copy → Paste → Copy → Paste
- Response readiness ก่อน Copy
- Loop จำนวน 10 รอบ
- การคงลำดับข้อมูลจากรอบก่อนหน้าเข้าสู่รอบถัดไป

## Test Model

`A → Copy → B → Paste → Copy → A → Paste`

ทำซ้ำทั้งหมด 10 รอบ

แต่ละรอบมี:

- 3 ครั้งของ tab activation: A, B, A
- 2 native Copy actions
- 3 Paste operations
- 2 response-generation cycles

รวมทั้งการทดสอบ:

- 30 tab activations
- 20 Copy actions
- 30 Paste operations
- 10 completed loops

## Results

### Deterministic Loop Test

**PASS**

ตรวจด้วย `tests/generic-web-loop/aicc-two-page-loop.js` และ mock page adapters:

- ครบ 10/10 รอบ
- ลำดับรอบ 1 → 10 ถูกต้อง
- Copy ของ A ถูกส่งไป B
- Copy ของ B ถูกส่งกลับ A
- Payload ของแต่ละรอบถูกนำไปเป็น input ของรอบถัดไป
- tab activation ครบ 30 ครั้ง

### Browser Two-Tab Integration

**PASS**

รันด้วย Chromium Headless ผ่าน Chrome DevTools Protocol โดยสร้าง 2 browser targets จริง แล้วสลับ A/B ระหว่างการทำงาน

ผลสุดท้าย:

- A sequence = 10
- B sequence = 10
- รอบที่ 10 กลับมาที่ A สำเร็จ
- Native Copy action ของ fixture ผ่านทุกครั้งหลัง response พร้อม
- ไม่มี timeout ระหว่าง 10 รอบ
- ไม่มีการข้ามรอบ

## Important Limitation

รอบนี้ทดสอบ **Copy/Paste semantics และ native Copy action ใน Generic Web fixture** แต่ยังไม่ได้ยืนยัน OS/browser clipboard จริงแบบ `navigator.clipboard` บน runtime ที่มีข้อจำกัดด้าน permission/secure context

ดังนั้นผลนี้ยืนยันว่า:

`Workflow Copy → Handoff → Paste → Continue`

ทำงานครบ 10 รอบ

แต่ยังไม่ถือว่าเป็นการรับรองว่า clipboard จริงของทุก runtime เช่น Safari/iOS/Tampermonkey จะทำงานเหมือนกัน

## Status

| รายการ | สถานะ |
|---|---|
| 2 Web pages | PASS |
| Tab switching | PASS |
| Response readiness | PASS |
| Native Copy gate | PASS |
| Copy → Paste | PASS |
| Paste → Submit | PASS |
| 10-loop execution | PASS |
| Loop state propagation | PASS |
| GPT/Gemini | NOT TESTED |
| Real OS clipboard across all runtimes | NOT VERIFIED |
| Refresh/Recovery during loop | NOT TESTED |

## Conclusion

Generic two-page loop ผ่าน 10 รอบตาม Workflow ที่กำหนดแล้ว

ขั้นถัดไปควรแยกเป็นสองงาน:

1. เพิ่ม Checkpoint + Recovery/Refresh ระหว่าง Loop
2. ทำ Runtime Clipboard Adapter สำหรับ runtime จริง แล้วค่อยทดสอบ GPT/Gemini
