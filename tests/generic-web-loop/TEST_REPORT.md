# Two-Page Copy/Paste Loop Test Report

## Scope

ทดสอบ Generic Web แบบ 2 หน้า/2 Tab ก่อนเชื่อมต่อ GPT/Gemini โดยเน้น:

- Web A ↔ Web B
- Tab activation/switch
- Copy → Paste → Copy → Paste
- Response readiness ก่อน Copy
- Loop จำนวน 10 รอบ
- การคงลำดับข้อมูลจากรอบก่อนหน้าเข้าสู่รอบถัดไป
- Runtime verification ของ response lifecycle, transport-safe handoff และ checkpoint/recovery

## Existing Results

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

**PASS — historical evidence**

รายงานเดิมระบุการรัน Chromium Headless ผ่าน Chrome DevTools Protocol ด้วย 2 browser targets จริง

ผลที่บันทึกไว้:

- A sequence = 10
- B sequence = 10
- รอบที่ 10 กลับมาที่ A สำเร็จ
- Native Copy action ของ fixture ผ่านหลัง response พร้อม
- ไม่มี timeout ระหว่าง 10 รอบ
- ไม่มีการข้ามรอบ

### Important Limitation

ผลข้างต้นยังไม่ใช่หลักฐานว่า OS/browser clipboard จริงทำงานเหมือนกันทุก runtime เช่น Safari/iOS/Tampermonkey

ดังนั้น:

`Workflow Copy → Handoff → Paste → Continue` = VERIFIED สำหรับ Generic Harness ตามหลักฐานเดิม

`Real OS clipboard across all runtimes` = NOT VERIFIED

## Runtime Verification Work Added

เพิ่ม `tests/generic-web-loop/runtime-verification.spec.mjs` เพื่อปิดช่องว่างที่สามารถตรวจได้ใน Browser Harness:

1. **Response Lifecycle**
   - Copy ต้อง disabled ระหว่าง PROCESSING
   - Copy เปิดเมื่อ READY_TO_COPY
   - response ต้องมี payload ก่อนเข้าสู่ capture

2. **Cross-Page Handoff**
   - payload ต้องผ่าน JSON serialization ได้
   - `from_participant != to_participant`
   - ไม่ส่ง live DOM/runtime object ผ่าน transport

3. **Checkpoint Durability**
   - checkpoint ถูกเก็บเป็น serializable data
   - checkpoint ที่ semantic boundary รอดผ่าน page reload
   - live DOM/runtime references ถูกปฏิเสธ

4. **Recovery**
   - recovery อ่าน checkpoint เดิม
   - resume จาก semantic step เดิม
   - ไม่สร้างความหมายว่า run ถูก restart ใหม่

**สถานะ: IMPLEMENTED / EXECUTION PENDING**

## Native Copy Gate

ไฟล์ `native-copy-gate.spec.mjs` มีอยู่แล้วและถูกกำหนดให้รันเฉพาะเมื่อ `AICC_NATIVE_COPY_RUNTIME=1`

Gate นี้ต้องตรวจ:

- secure browser context
- Clipboard API
- native Copy control
- Copy-click evidence
- user-activation evidence
- clipboard write completion
- clipboard readback
- exact payload match

**สถานะ: IMPLEMENTED / REAL-BROWSER EXECUTION PENDING**

ผล Node/headless ก่อนหน้านี้ที่ไม่มี OS Clipboard ยังคงเป็น **BLOCKED** และไม่ถูกนับเป็น PASS

## Current Gate Matrix

| Gate | Status |
|---|---|
| Generic 2-page loop | PASS (historical evidence) |
| Response lifecycle browser coverage | IMPLEMENTED / EXECUTION PENDING |
| Transport-safe handoff browser coverage | IMPLEMENTED / EXECUTION PENDING |
| Checkpoint persistence/reload coverage | IMPLEMENTED / EXECUTION PENDING |
| Recovery-from-checkpoint coverage | IMPLEMENTED / EXECUTION PENDING |
| Native Copy + OS clipboard | IMPLEMENTED / EXECUTION PENDING |
| GPT adapter | NOT TESTED |
| Gemini adapter | NOT TESTED |
| Real GPT/Gemini handoff | NOT TESTED |
| Cross-runtime Safari/iOS clipboard | NOT VERIFIED |
| Production userscript packaging | NOT VERIFIED |

## Next Gate

เมื่อมี Browser Runtime ที่เข้าถึง clipboard จริง ให้รัน:

`AICC_NATIVE_COPY_RUNTIME=1 npm run test:native-copy`

และรัน Browser Runtime coverage:

`npm run test:browser-runtime`

ห้ามเลื่อนสถานะเป็น PASS จนกว่าจะมี execution evidence จาก runtime จริง
