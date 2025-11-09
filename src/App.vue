<template>
  <div class="mood-journal-app">
    <div class="mood-journal-app-content">
      <!-- Authentication Components -->
      <div v-if="!isAuthenticated">
        <Signup v-if="showSignup" @switch-auth="toggleAuthForm" />
        <Login v-else @switch-auth="toggleAuthForm" />
      </div>

      <!-- Main App Components -->
      <div class="app-container" v-else>
        <div class="mood-journal-app-content-header">
          <div :class="['tab-item', activeIndex === index ? 'active-item' : '']" v-for="(item, index) in tabList"
            :key="index" @click="handleClick(index)">
            {{ item.name }}
          </div>
          <!-- Logout Button -->
          <button @click="logout" class="logout-button">Log Out</button>
        </div>
        <div class="mood-journal-app-content-content">
          <keep-alive exclude="analysis">
            <component :is="currentComponent" :journalList="journalList" @updateJournal="handleUpdate">
            </component>
          </keep-alive>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Write from './views/Write';
import Journal from './views/Journal';
import Analysis from './views/Analysis';

import Signup from './components/Signup.vue';
import Login from './components/Login.vue';

import { auth, db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default {
  components: {
    Write,
    Journal,
    Analysis,
    Signup,
    Login,
  },
  data() {
    return {
      journalList: [],
      tabList: [
        {
          name: 'Write new',
          componentName: 'write',
        },
        {
          name: 'Prev Journal',
          componentName: 'journal',
        },
        {
          name: 'Analytics',
          componentName: 'analysis',
        },
      ],
      activeIndex: 0,
      currentComponent: 'write',
      isAuthenticated: false,
      showSignup: false,
      _unsub: null,
    };
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.isAuthenticated = true;
        this.startRealtime();
      } else {
        this.isAuthenticated = false;
        this.journalList = [];
        this.stopRealtime();
      }
    });
  },
  beforeUnmount() {
    this.stopRealtime();
  },
  methods: {
    toggleAuthForm() {
      this.showSignup = !this.showSignup;
    },
    async logout() {
      try {
        await signOut(auth);
        this.$message?.success('Logged out successfully');
      } catch (error) {
        console.error('Error logging out:', error);
        this.$message?.error('Failed to log out');
      }
    },
    handleClick(index) {
      this.activeIndex = index;
      this.currentComponent = this.tabList[index].componentName;
    },

    startRealtime() {
      this.stopRealtime();
      const q = query(collection(db, 'journalList'), orderBy('timestamp', 'desc'));
      this._unsub = onSnapshot(
        q,
        (snap) => {
          const uid = auth.currentUser?.uid;
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          // keep only current user's entries (no composite index required)
          this.journalList = uid ? rows.filter((r) => r.userId === uid) : [];
        },
        (err) => {
          console.error('onSnapshot error:', err);
          // fallback once if snapshot fails
          this.fetchJournalList();
        }
      );
    },
    stopRealtime() {
      if (this._unsub) {
        this._unsub();
        this._unsub = null;
      }
    },

    async fetchJournalList() {
      try {
        const uid = auth.currentUser?.uid;
        const q = query(collection(db, 'journalList'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        this.journalList = uid ? rows.filter((r) => r.userId === uid) : [];
      } catch (error) {
        console.error('Error fetching journalList:', error);
        this.journalList = [];
      }
    },

    async handleUpdate(obj) {
      try {
        const user = auth.currentUser;
        if (!user) {
          this.$message?.error('You must be logged in.');
          return;
        }
        const userId = user.uid;
        obj.userId = userId;
        obj.userEmail = user.email;
        obj.timestamp = Date.now();
        obj.mood = 2;
        obj.sdImage = "";
        const docRef = await addDoc(collection(db, 'journalList'), obj);
        obj.id = docRef.id;
        this.journalList.unshift(obj);
        this.$message?.success('Journal entry saved successfully');
      } catch (error) {
        console.error('Error adding document:', error);
        this.$message?.error('Failed to save journal entry');
      }
    }
  },
};
</script>

<style lang="less" scoped>
.mood-journal-app {
  height: 100%;
  background: #fff;
  display: flex;
  justify-content: center;

  &-content {
    width: 80%;
    background: #f3f4f6;
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;

    .app-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    &-header {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: space-around;

      .tab-item {
        padding: 4px 20px;
        border-radius: 12px;
        transition: font-size 0.1s ease;
        cursor: pointer;
      }

      .active-item {
        font-size: 18px;
        font-weight: bold;
        color: green;
        background-color: #99CC99;
      }
    }

    &-content {
      flex: auto;
      overflow: hidden;
      margin-top: 20px;
    }
  }
}

.logout-button {
  margin-left: auto;
  padding: 4px 12px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
