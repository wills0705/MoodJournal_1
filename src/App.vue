<template>
  <div class="mood-journal-app">
    <div class="mood-journal-app-content">
      <!-- Auth screens -->
      <div v-if="!isAuthenticated">
        <Signup v-if="showSignup" @switch-auth="toggleAuthForm" />
        <Login v-else @switch-auth="toggleAuthForm" />
      </div>

      <!-- First-login policy gate (only when authenticated and not yet accepted) -->
      <PolicyGate
        v-if="isAuthenticated && mustShowPolicies"
        :docs="POLICY_DOCS"
        @accepted="onPolicyAccepted"
      />

      <!-- Main App (only after policies accepted) -->
      <div class="app-container" v-else-if="isAuthenticated && !mustShowPolicies">
        <div class="mood-journal-app-content-header">
          <div
            v-for="(item, index) in tabList"
            :key="index"
            :class="['tab-item', activeIndex === index ? 'active-item' : '']"
            @click="handleClick(index)"
          >
            {{ item.name }}
          </div>
          <button @click="logout" class="logout-button">Log Out</button>
        </div>

        <div class="mood-journal-app-content-content">
          <keep-alive exclude="analysis">
            <component
              :is="currentComponent"
              :journalList="journalList"
              @updateJournal="handleUpdate"
            />
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
import PolicyGate from './components/PolicyGate.vue';

import { auth, db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// bump this when you update policy docs to force re-acceptance
const CURRENT_POLICY_VERSION = 1;

const POLICY_DOCS = [
  { title: 'List of Mental Health Services Available 1',        url: '/policies/mentalhealth.pdf' },
  { title: 'Research Consent',      url: '/policies/REB_Informed_Consent.pdf' }
];

export default {
  components: { Write, Journal, Analysis, Signup, Login, PolicyGate },

  data() {
    return {
      journalList: [],
      tabList: [
        { name: 'Write new',    componentName: 'write' },
        { name: 'Prev Journal', componentName: 'journal' },
        { name: 'Analytics',    componentName: 'analysis' },
      ],
      activeIndex: 0,
      currentComponent: 'write',
      isAuthenticated: false,
      showSignup: false,
      _unsub: null,

      // policy gate
      mustShowPolicies: false,
      POLICY_DOCS,
    };
  },

  created() {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        this.isAuthenticated = false;
        this.mustShowPolicies = false;
        this.journalList = [];
        this.stopRealtime();
        return;
      }

      this.isAuthenticated = true;

      // check acceptance status
      try {
        const metaRef = doc(db, 'userMeta', user.uid);
        const snap = await getDoc(metaRef);
        const acceptedVersion = snap.exists() ? (snap.data().acceptedPoliciesVersion || 0) : 0;
        this.mustShowPolicies = acceptedVersion < CURRENT_POLICY_VERSION;
      } catch (e) {
        console.error('Failed to read policy meta:', e);
        // if check fails, be conservative and show gate
        this.mustShowPolicies = true;
      }

      if (!this.mustShowPolicies) {
        this.startRealtime();
      } else {
        this.stopRealtime();
      }
    });
  },

  beforeUnmount() {
    this.stopRealtime();
  },

  methods: {
    // ---- policy gate accept ----
    async onPolicyAccepted() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const metaRef = doc(db, 'userMeta', user.uid);
        await setDoc(
          metaRef,
          {
            acceptedPoliciesVersion: CURRENT_POLICY_VERSION,
            acceptedAt: serverTimestamp(),
          },
          { merge: true }
        );
        this.mustShowPolicies = false;
        this.startRealtime();
      } catch (e) {
        console.error('Failed to save policy acceptance:', e);
        this.$message?.error('Could not save acceptance, please try again.');
      }
    },

    toggleAuthForm() { this.showSignup = !this.showSignup; },

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

    // ---- data streaming ----
    startRealtime() {
      this.stopRealtime();
      const q = query(collection(db, 'journalList'), orderBy('timestamp', 'desc'));
      this._unsub = onSnapshot(
        q,
        (snap) => {
          const uid = auth.currentUser?.uid;
          const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          this.journalList = uid ? rows.filter((r) => r.userId === uid) : [];
        },
        (err) => {
          console.error('onSnapshot error:', err);
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
        obj.userId = user.uid;
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
    },
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

    .app-container { height: 100%; display: flex; flex-direction: column; }

    &-header {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: space-around;

      .tab-item { padding: 4px 20px; border-radius: 12px; transition: font-size .1s ease; cursor: pointer; }
      .active-item { font-size: 18px; font-weight: bold; color: green; background-color: #99CC99; }
    }

    &-content { flex: auto; overflow: hidden; margin-top: 20px; }
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
