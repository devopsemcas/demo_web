<template>
  <div class="wrap">
    <div class="header">
      <div>
        <h1>Quản lý thông tin khách hàng</h1>
        <div class="muted">Tra cứu, chỉnh sửa và in phiếu khám tuyến</div>
      </div>
      <button class="btn green" @click="openCreate">+ Thêm khách</button>
    </div>

    <div class="card">
      <div class="filters">
        <div class="field"><label>Từ ngày</label><input type="date" v-model="filters.from" /></div>
        <div class="field"><label>Đến ngày</label><input type="date" v-model="filters.to" /></div>
        <div class="field"><label>Tên khách</label><input v-model="filters.ho_ten" placeholder="Nhập tên khách..." /></div>
        <div class="field"><label>Số điện thoại</label><input v-model="filters.sodt" placeholder="Nhập số điện thoại..." /></div>
        <button class="btn primary" @click="load(1)">Tìm kiếm</button>
        <button class="btn secondary" @click="resetFilter">Xóa lọc</button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>STT</th><th>Ngày</th><th>Họ tên</th><th>CCCD</th><th>Ngày sinh</th>
              <th>Giới tính</th><th>SĐT</th><th>Nghề nghiệp</th><th>Địa chỉ</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="10" class="muted">Đang tải...</td></tr>
            <tr v-else-if="!items.length"><td colspan="10" class="muted">Không tìm thấy dữ liệu</td></tr>
            <tr v-else v-for="(x, i) in items" :key="x.id">
              <td>{{ (page - 1) * 20 + i + 1 }}</td>
              <td>{{ fmtDate(x.created_at) }}</td>
              <td><b>{{ x.ho_ten }}</b></td>
              <td>{{ x.cccd || x.cmnd }}</td>
              <td>{{ fmtDate(x.ngay_sinh) }}</td>
              <td>{{ x.gioi_tinh }}</td>
              <td>{{ x.sodt }}</td>
              <td>{{ x.nghe_nghiep }}</td>
              <td>{{ x.dia_chi }}</td>
              <td>
                <div class="actions">
                  <button class="btn secondary" @click="edit(x.id)">Sửa</button>
                  <button class="btn primary" @click="goPrint(x.id)">In phiếu</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <span class="muted">Tổng {{ total }} khách</span>
        <div>
          <button class="btn secondary" @click="prevPage">‹</button>
          <span> Trang {{ page }}/{{ totalPages }} </span>
          <button class="btn secondary" @click="nextPage">›</button>
        </div>
      </div>
    </div>

    <CitizenFormModal :show="modalOpen" :citizen="editingCitizen" @close="modalOpen = false" @save="onSave" />
    <div class="toast" :class="{ show: toast.show, error: toast.error }">{{ toast.msg }}</div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { citizensApi } from "../api/client";
import CitizenFormModal from "../components/CitizenFormModal.vue";

const router = useRouter();

const items = ref([]);
const loading = ref(false);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const filters = reactive({ from: "", to: "", ho_ten: "", sodt: "" });

const modalOpen = ref(false);
const editingId = ref(null);
const editingCitizen = ref(null);

const toast = reactive({ show: false, msg: "", error: false });
function showToast(msg, error = false) {
  toast.msg = msg;
  toast.error = error;
  toast.show = true;
  setTimeout(() => (toast.show = false), 3500);
}

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function load(p = 1) {
  page.value = p;
  loading.value = true;
  try {
    const j = await citizensApi.list({
      page: p,
      limit: 20,
      from: filters.from,
      to: filters.to,
      ho_ten: filters.ho_ten,
      sodt: filters.sodt,
    });
    items.value = j.data;
    total.value = j.pagination.total;
    totalPages.value = j.pagination.total_pages || 1;
  } catch (e) {
    showToast(e.message, true);
  } finally {
    loading.value = false;
  }
}

function prevPage() { if (page.value > 1) load(page.value - 1); }
function nextPage() { if (page.value < totalPages.value) load(page.value + 1); }
function resetFilter() {
  filters.from = ""; filters.to = ""; filters.ho_ten = ""; filters.sodt = "";
  load(1);
}

function openCreate() {
  editingId.value = null;
  editingCitizen.value = null;
  modalOpen.value = true;
}

async function edit(id) {
  try {
    const j = await citizensApi.get(id);
    editingId.value = id;
    editingCitizen.value = j.data;
    modalOpen.value = true;
  } catch (e) {
    showToast(e.message, true);
  }
}

async function onSave(data) {
  try {
    const j = editingId.value ? await citizensApi.update(editingId.value, data) : await citizensApi.create(data);
    showToast(j.message);
    modalOpen.value = false;
    load(page.value);
  } catch (e) {
    showToast(e.message, true);
  }
}

function goPrint(id) {
  // Mở trang phiếu khám (đã tự điền dữ liệu) ở tab mới để in
  const routeData = router.resolve({ name: "print-form", params: { id } });
  window.open(routeData.href, "_blank");
}

onMounted(() => load(1));
</script>

<style scoped>
.wrap { max-width: 1400px; margin: 28px auto; padding: 0 18px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.header h1 { margin: 0; font-size: 25px; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 2px 8px #0000000b; padding: 18px; margin-bottom: 18px; }
.filters { display: grid; grid-template-columns: repeat(4, 1fr) auto auto; gap: 12px; align-items: end; }
.field label { display: block; font-weight: 600; margin-bottom: 6px; }
.field input, .field select { width: 100%; height: 38px; border: 1px solid #d1d5db; border-radius: 7px; padding: 0 10px; background: #fff; }
.btn { border: 0; border-radius: 7px; height: 38px; padding: 0 15px; cursor: pointer; font-weight: 600; }
.primary { background: #2563eb; color: #fff; }
.secondary { background: #e5e7eb; }
.green { background: #059669; color: #fff; }
.table-wrap { overflow: auto; }
.table { width: 100%; border-collapse: collapse; min-width: 1050px; }
.table th, .table td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; vertical-align: middle; }
.table th { background: #f8fafc; white-space: nowrap; }
.actions { display: flex; gap: 6px; }
.actions .btn { height: 32px; padding: 0 10px; font-size: 12px; }
.pager { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
.toast { position: fixed; right: 20px; bottom: 20px; background: #111827; color: white; padding: 12px 16px; border-radius: 8px; display: none; max-width: 420px; }
.toast.show { display: block; }
.toast.error { background: #b91c1c; }
.muted { color: #6b7280; }
@media (max-width: 900px) {
  .filters { grid-template-columns: 1fr 1fr; }
}
</style>
