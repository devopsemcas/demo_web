<template>
  <div class="modal" :class="{ show }">
    <div class="modal-box">
      <div class="modal-head">
        <strong>{{ isEditing ? "Chỉnh sửa thông tin" : "Thêm khách hàng" }}</strong>
        <button class="btn secondary" @click="$emit('close')">Đóng</button>
      </div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="field">
            <label>Họ tên *</label>
            <input v-model="form.ho_ten" />
          </div>
          <div class="field">
            <label>CCCD</label>
            <input v-model="form.cccd" />
          </div>
          <div class="field">
            <label>CMND</label>
            <input v-model="form.cmnd" />
          </div>
          <div class="field">
            <label>Giới tính</label>
            <select v-model="form.gioi_tinh">
              <option value="">-- Chọn --</option>
              <option>Nam</option>
              <option>Nữ</option>
            </select>
          </div>
          <div class="field">
            <label>Ngày sinh</label>
            <input type="date" v-model="form.ngay_sinh" />
          </div>
          <div class="field">
            <label>Ngày cấp</label>
            <input type="date" v-model="form.ngay_cap" />
          </div>
          <div class="field">
            <label>Số điện thoại</label>
            <input v-model="form.sodt" />
          </div>
          <div class="field">
            <label>Nghề nghiệp</label>
            <input v-model="form.nghe_nghiep" />
          </div>
          <div class="field full">
            <label>Địa chỉ</label>
            <input v-model="form.dia_chi" />
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn secondary" @click="$emit('close')">Hủy</button>
        <button class="btn primary" @click="save">Lưu thông tin</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from "vue";

const props = defineProps({
  show: { type: Boolean, default: false },
  citizen: { type: Object, default: null },
});
const emit = defineEmits(["close", "save"]);

const isEditing = computed(() => !!props.citizen);

const emptyForm = () => ({
  ho_ten: "",
  cccd: "",
  cmnd: "",
  gioi_tinh: "",
  ngay_sinh: "",
  ngay_cap: "",
  sodt: "",
  nghe_nghiep: "",
  dia_chi: "",
});

const form = reactive(emptyForm());

watch(
  () => props.citizen,
  (c) => {
    const base = emptyForm();
    if (c) {
      base.ho_ten = c.ho_ten || "";
      base.cccd = c.cccd || "";
      base.cmnd = c.cmnd || "";
      base.gioi_tinh = c.gioi_tinh || "";
      base.ngay_sinh = (c.ngay_sinh || "").slice(0, 10);
      base.ngay_cap = (c.ngay_cap || "").slice(0, 10);
      base.sodt = c.sodt || "";
      base.nghe_nghiep = c.nghe_nghiep || "";
      base.dia_chi = c.dia_chi || "";
    }
    Object.assign(form, base);
  },
  { immediate: true }
);

function save() {
  if (!form.ho_ten.trim()) {
    alert("Họ tên là bắt buộc");
    return;
  }
  emit("save", { ...form });
}
</script>

<style scoped>
.modal { display: none; position: fixed; inset: 0; background: #0008; align-items: center; justify-content: center; padding: 20px; z-index: 50; }
.modal.show { display: flex; }
.modal-box { background: #fff; border-radius: 10px; width: min(800px, 100%); max-height: 90vh; overflow: auto; }
.modal-head { padding: 16px 18px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
.modal-body { padding: 18px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.full { grid-column: 1 / -1; }
.field label { display: block; font-weight: 600; margin-bottom: 6px; }
.field input, .field select { width: 100%; height: 38px; border: 1px solid #d1d5db; border-radius: 7px; padding: 0 10px; background: #fff; }
.modal-foot { padding: 14px 18px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 8px; }
.btn { border: 0; border-radius: 7px; height: 38px; padding: 0 15px; cursor: pointer; font-weight: 600; }
.primary { background: #2563eb; color: #fff; }
.secondary { background: #e5e7eb; }
@media (max-width: 900px) {
  .form-grid { grid-template-columns: 1fr; }
  .full { grid-column: auto; }
}
</style>
