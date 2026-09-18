<template>
  <div class="page-wrap">
    <div class="toolbar no-print">
      <button class="btn secondary" @click="goBack">← Quay lại</button>
      <div v-if="loading" class="muted">Đang tải dữ liệu khách hàng...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <button class="btn primary" :disabled="loading || !!error" @click="doPrint">🖨️ In phiếu</button>
    </div>

    <div class="paper" v-if="!loading && !error">
      <div class="stt">STT:……………<span class="fill">{{ citizen.id }}</span></div>

      <div class="header-logos">
        <img class="logo logo-clinic" :src="logoClinic" alt="Bệnh viện Mắt Á Châu" />
        <img class="logo logo-institute" :src="logoInstitute" alt="Viện Y dược học dân tộc TP.HCM" />
      </div>

      <div class="hospital-header">
        <div class="hospital-name">BỆNH VIỆN MẮT Á CHÂU</div>
        <div><b>Địa chỉ:</b> 141 Tôn Thất Đạm, P. Sài Gòn, TP.HCM</div>
        <div><b>Hotline:</b> 1900 633 433 – 0768 734 677 &nbsp;&nbsp;&nbsp;&nbsp;<b>Website:</b> matachau.com</div>
      </div>

      <div class="program-title">CHƯƠNG TRÌNH KHÁM MẮT VÀ PHÁT THUỐC MIỄN PHÍ*</div>
      <div class="co-org">VIỆN Y DƯỢC HỌC DÂN TỘC TP. HỒ CHÍ MINH</div>

      <div class="exam-date">
        Ngày
        <input class="dotted-input tiny" v-model="examDate.day" />
        tháng
        <input class="dotted-input tiny" v-model="examDate.month" />
        năm
        <input class="dotted-input small" v-model="examDate.year" />
      </div>

      <div class="info-line inline-row">
        <b>Họ tên:</b> <input class="dotted-input grow" v-model="citizen.ho_ten" />
        <b>D.O.B:</b> <input class="dotted-input medium" v-model="dob" />
        <b>Giới tính:</b>
        <label class="checkbox"><input type="checkbox" v-model="isMale" @change="isFemale = !isMale" /> Nam</label>
        <label class="checkbox"><input type="checkbox" v-model="isFemale" @change="isMale = !isFemale" /> Nữ</label>
      </div>

      <div class="info-line"><b>Căn cước công dân/Căn cước:</b> <input class="dotted-input grow" v-model="cccd" /></div>
      <div class="info-line"><b>Điện thoại liên hệ:</b> <input class="dotted-input grow" v-model="citizen.sodt" /></div>
      <div class="info-line"><b>Nghề nghiệp:</b> <input class="dotted-input grow" v-model="citizen.nghe_nghiep" /></div>
      <div class="info-line"><b>Địa chỉ cụ thể:</b> <input class="dotted-input grow" v-model="citizen.dia_chi" /></div>

      <table class="exam-table">
        <tbody>
          <tr>
            <td>TL:</td>
            <td>MP: <input class="dotted-input tiny" v-model="exam.tlMP" />/10</td>
            <td class="center"><b>KÍNH LỖ</b></td>
            <td>MP: <input class="dotted-input tiny" v-model="exam.klMP" />/10</td>
          </tr>
          <tr>
            <td></td>
            <td>MT: <input class="dotted-input tiny" v-model="exam.tlMT" />/10</td>
            <td></td>
            <td>MT: <input class="dotted-input tiny" v-model="exam.klMT" />/10</td>
          </tr>
        </tbody>
      </table>

      <!-- Chẩn đoán: khung "Bác sĩ chỉ định" thả nổi bên phải, giống text-wrap trong file Word gốc -->
      <div class="diagnosis-row">
        <div class="bacsi-box">
          <b>Bác sĩ chỉ định</b>
          <textarea class="bacsi-input" v-model="exam.bacSi" rows="5"></textarea>
        </div>
        <div class="section-title">Chẩn đoán:</div>
        <div class="dots-line" v-for="n in 4" :key="'cd' + n">
          <input class="dotted-input full-dots" v-model="exam.chanDoan[n - 1]" />
        </div>
      </div>
      <div class="clearfix"></div>

      <div class="section">
        <div class="section-title">Chỉ định điều trị:</div>
        <div class="dots-line" v-for="n in 3" :key="'dt' + n">
          <input class="dotted-input full-dots" v-model="exam.chiDinh[n - 1]" />
        </div>
      </div>

      <div class="mat-dieu-tri-row">
        <b>Mắt điều trị</b>
        <label class="checkbox"><input type="checkbox" v-model="exam.matPhai" /> Phải</label>
        <label class="checkbox"><input type="checkbox" v-model="exam.matTrai" /> Trái</label>
      </div>

      <p class="thanks">
        Bệnh viện Mắt Á Châu xin trân trọng cảm ơn <b>Viên chức/Người lao động/Người thân của Viện Y dược học dân tộc
        TP. Hồ Chí Minh và người dân</b> đã tham gia Chương trình <b>KHÁM MẮT VÀ PHÁT THUỐC MIỄN PHÍ</b>.
      </p>
      <p class="thanks">
        Sự hiện diện và đồng hành của Quý khách hàng là nguồn động lực để chương trình tiếp tục lan tỏa ý nghĩa
        nhân văn, góp phần nâng cao ý thức chăm sóc sức khỏe mắt và chất lượng cuộc sống cho cộng đồng.
      </p>

      <div class="signature-line"><b>CHỮ KÝ KHÁCH HÀNG</b></div>
      <div class="signature-space"></div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { citizensApi } from "../api/client";
import logoClinic from "../assets/logo-clinic.png";
import logoInstitute from "../assets/logo-institute.png";

const props = defineProps({ id: { type: [String, Number], required: true } });
const router = useRouter();

const loading = ref(true);
const error = ref("");
const citizen = ref({});

const now = new Date();
const examDate = reactive({
  day: String(now.getDate()).padStart(2, "0"),
  month: String(now.getMonth() + 1).padStart(2, "0"),
  year: String(now.getFullYear()),
});

const isMale = ref(false);
const isFemale = ref(false);

const exam = reactive({
  tlMP: "", tlMT: "", klMP: "", klMT: "",
  chanDoan: ["", "", "", ""],
  chiDinh: ["", "", ""],
  bacSi: "",
  matPhai: false,
  matTrai: false,
});

const dob = computed({
  get() {
    if (!citizen.value.ngay_sinh) return "";
    const s = String(citizen.value.ngay_sinh).slice(0, 10);
    const [y, m, d] = s.split("-");
    return y && m && d ? `${d}/${m}/${y}` : s;
  },
  set(v) {
    citizen.value.ngay_sinh = v;
  },
});

const cccd = computed({
  get() { return citizen.value.cccd || citizen.value.cmnd || ""; },
  set(v) { citizen.value.cccd = v; },
});

function goBack() {
  router.push({ name: "citizens-list" });
}

function doPrint() {
  window.print();
}

onMounted(async () => {
  try {
    const j = await citizensApi.get(props.id);
    citizen.value = j.data;
    const g = String(j.data.gioi_tinh || "").trim().toLowerCase();
    isMale.value = ["nam", "male", "m"].includes(g);
    isFemale.value = ["nữ", "nu", "female", "f"].includes(g);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.page-wrap {
  max-width: 800px;
  margin: 20px auto;
  font-family: "Times New Roman", Times, serif;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-family: Arial, sans-serif;
}
.btn { border: 0; border-radius: 7px; height: 38px; padding: 0 15px; cursor: pointer; font-weight: 600; }
.primary { background: #2563eb; color: #fff; }
.secondary { background: #e5e7eb; }
.muted { color: #6b7280; }
.error { color: #b91c1c; font-weight: 600; }

.paper {
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 10px #00000014;
  padding: 32px 40px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
}

.stt { position: absolute; top: 12px; right: 40px; font-weight: 600; font-size: 12px; }
.fill { font-weight: 700; }

.header-logos {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  margin-bottom: 8px;
}
.logo { display: block; }
.logo-clinic { height: 46px; width: auto; }
.logo-institute { height: 64px; width: auto; }

.hospital-header { margin: 6px 0 10px; font-size: 13px; }
.hospital-name { font-size: 16px; font-weight: 700; margin-bottom: 2px; }

.program-title, .co-org {
  text-align: center;
  font-weight: 700;
  font-size: 17px;
  color: #005951;
}
.program-title { margin-top: 10px; }
.co-org { margin-bottom: 10px; }

.exam-date { text-align: center; margin: 10px 0; }
.info-line { margin: 8px 0; display: flex; align-items: baseline; gap: 6px; }
.inline-row { flex-wrap: wrap; }

.dotted-input {
  border: none;
  border-bottom: 1px dotted #444;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  padding: 1px 3px;
}
.dotted-input:focus { outline: none; border-bottom: 1px solid #2563eb; }
.tiny { width: 40px; }
.small { width: 60px; }
.medium { width: 140px; }
.grow { flex: 1; min-width: 80px; }
.full-dots { width: 100%; }

.checkbox { margin-left: 4px; font-weight: 400; white-space: nowrap; }
.checkbox input { margin-right: 4px; }

.exam-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #444;
  margin: 14px 0;
}
.exam-table td { padding: 8px; }
.exam-table .center { text-align: center; }

/* Chẩn đoán + khung Bác sĩ chỉ định thả nổi bên phải, chữ chảy vòng quanh như file Word gốc */
.diagnosis-row { margin: 12px 0 0; }
.bacsi-box {
  float: right;
  width: 190px;
  min-height: 130px;
  border: 1px solid #444;
  padding: 6px 8px;
  margin-left: 12px;
  text-align: center;
}
.bacsi-input {
  width: 100%;
  height: 100px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  resize: none;
  margin-top: 4px;
}
.bacsi-input:focus { outline: none; }
.clearfix { clear: both; }

.section { margin: 14px 0; }
.section-title { font-weight: 700; margin-bottom: 4px; }
.dots-line { margin: 6px 0; }

.mat-dieu-tri-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin: 14px 0;
  padding-left: 40px;
}

.thanks { font-size: 12.5px; margin: 10px 0; text-align: justify; }

.signature-line { text-align: right; margin-top: 10px; }
.signature-space { height: 90px; }

@media print {
  .no-print { display: none !important; }
  .page-wrap { max-width: none; margin: 0; }
  .paper {
    border: none;
    box-shadow: none;
    padding: 0;
  }
  .dotted-input { border-bottom: 1px dotted #444 !important; }
  @page {
    size: A4;
    margin: 15mm;
  }
}
</style>
