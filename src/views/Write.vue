<template>
  <div class="journal-write">
    <!-- Date line -->
    <div class="journal-write-date">
      {{ displayDate }}
    </div>

    <!-- Textarea card -->
    <div class="journal-write-card">
      <a-input
        v-model:value="journalTitle"
        placeholder="Journal title (e.g., Warm soup made my day)"
        class="journal-title-input"
      />

      <a-textarea
        v-model:value="journalContent"
        placeholder="Click here to start write your new journal"
      />
    </div>

    <!-- Footer: instruction + styles + save -->
    <div class="journal-write-footer">

      <div class="footer-row">
        <div class="footer-right">
          <a-button
            class="save-btn"
            size="large"
            :loading="isLoading"
            :disabled="!canSave"
            aria-disabled="!canSave"
            @click="saveText"
          >
            Save
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDate, monthMap, dayMap } from '../lib/util';
import { getDatabase, ref, set } from 'firebase/database';

const SAVE_DELAY = 1000;

export default {
  name: 'write',
  props: {
    journalList: { type: Array, default: [] },
    saveStatus: { type: String, default: 'idle' }
  },
  data() {
    return {
      journalTitle: '',
      journalContent: '',
      currentDate: formatDate(new Date()),
      isLoading: false,
      activeButton: null
    }
  },
  computed: {
    canSave() {
      return !!this.journalContent.trim() && !!this.journalTitle.trim();
    },
    displayDate() {
      const d = new Date();
      const monthFull = monthMap[d.getMonth()] || '';
      const monthAbbrev = monthFull ? monthFull.slice(0, 3) + '.' : '';
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      const weekday = dayMap[d.getDay()] || '';
      return `${monthAbbrev}${day}.${year} (${weekday})`;
    }
  },
  watch: {
    saveStatus(newVal) {
      if (newVal === 'success' || newVal === 'error' || newVal === 'idle') {
        this.isLoading = false;
      }
    }
  },
  methods: {
    clearText() { 
      this.journalContent = '';
      this.journalTitle = '';
    },

    saveText() {
      // Hard guard: require content and style selection
      if (!this.journalContent.trim()) {
        this.$message?.warning?.('Please write something first.');
        return;
      }
      
      this.isLoading = true;
      setTimeout(() => {
        const d = new Date();
        const textObj = {
          title: this.journalTitle.trim(),
          currentDate: formatDate(d),
          currentTime: d,
          content: this.journalContent.trim(),
          isApproved: false,
          buttonNumber: this.activeButton
        };
        this.$emit('updateJournal', textObj);
        this.clearText();
      }, SAVE_DELAY);
    },
    showModal(buttonNumber) {
      this.modalVisible[buttonNumber] = true;
      this.activeButton = buttonNumber;
    },
    async handleModalCancel(i) {
      this.modalVisible[i] = false;
      if (this.activeButton === i) this.activeButton = null;
    },
    async handleModalOk(buttonNumber) {
      this.modalVisible[buttonNumber] = false;
      this.activeButton = buttonNumber;
      try {
        const db = getDatabase();
        const buttonRef = ref(db, 'buttonSelections/' + new Date().getTime());
        await set(buttonRef, { buttonNumber, timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Error saving button selection:', error);
      }
    }
  },
};
</script>

<style lang="less" scoped>
::v-deep(.ant-modal-body) { max-height: 70vh; overflow: auto; }
::v-deep(.ant-modal) { width: auto !important; max-width: 90vw; top: 24px; }
::v-deep(.ant-modal-content) { max-width: 90vw; }

.modal-preview {
  max-width: 100%;
  max-height: 60vh;
  height: auto;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  border-radius: 8px;
}

.journal-write {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.journal-write-date {
  font-size: 18px;
  font-weight: 700;
  padding: 2px 2px;
}

.journal-write-card {
  flex: 1 1 auto;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  overflow: hidden;
  padding: 10px;

  textarea {
    border: none;
    box-shadow: none;
    resize: none;
    height: 100%;
    min-height: 420px;
    padding: 14px;
    font-size: 14px;
    line-height: 1.5;
  }

  ::v-deep(.ant-input:focus),
  ::v-deep(.ant-input-focused) {
    box-shadow: none;
  }
}

.journal-write-footer {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-instruction {
  color: #4b5563;
  font-size: 14px;
}

.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.footer-left {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  ::v-deep(.ant-btn) {
    border-radius: 12px;
    height: 40px;
    padding: 0 18px;
    border-color: #d1d5db;
    color: #111827;
    background: #ffffff;
  }

  ::v-deep(.ant-btn:hover),
  ::v-deep(.ant-btn:focus),
  ::v-deep(.ant-btn:active) {
    border-color: #111827 !important;
    color: #111827 !important;
    background: #ffffff !important;
  }

  ::v-deep(.ant-btn-primary) {
    background: #111827 !important;
    border-color: #111827 !important;
    color: #ffffff !important;
  }

  ::v-deep(.ant-btn-primary:hover),
  ::v-deep(.ant-btn-primary:focus),
  ::v-deep(.ant-btn-primary:active) {
    background: #000000 !important;
    border-color: #000000 !important;
    color: #ffffff !important;
  }
}

/* ✅ MOVE THESE OUTSIDE footer-left */
::v-deep(.ant-modal-footer .ant-btn) {
  border-radius: 10px;
  border-color: #d1d5db !important;
  color: #111827 !important;
  background: #ffffff !important;
}

::v-deep(.ant-modal-footer .ant-btn:hover),
::v-deep(.ant-modal-footer .ant-btn:focus),
::v-deep(.ant-modal-footer .ant-btn:active) {
  border-color: #111827 !important;
  color: #111827 !important;
  background: #ffffff !important;
}

::v-deep(.ant-modal-footer .ant-btn-primary) {
  background: #111827 !important;
  border-color: #111827 !important;
  color: #ffffff !important;
}

::v-deep(.ant-modal-footer .ant-btn-primary:hover),
::v-deep(.ant-modal-footer .ant-btn-primary:focus),
::v-deep(.ant-modal-footer .ant-btn-primary:active) {
  background: #000000 !important;
  border-color: #000000 !important;
  color: #ffffff !important;
}

/* Optional: kill the blue focus ring */
::v-deep(.ant-btn:focus-visible) {
  outline: none !important;
  box-shadow: none !important;
}

.footer-right {
  flex: none;
}

.save-btn {
  margin-left: 1020px;
  width: 140px;
  height: 50px;
  border-radius: 14px;
  border: none;
  background: #111827;
  color: #fff;
  font-weight: 700;
}

.save-btn:hover {
  background: #0b1220;
  color: #fff;
}

.save-btn[disabled] {
  background: #e5e7eb !important;
  color: #9ca3af !important;
}
</style>
