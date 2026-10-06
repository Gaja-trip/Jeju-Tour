(function () {
  "use strict";

  window.JejuLiveLocation = { attach };

  function loadClient() {
    if (window.supabase?.createClient) return Promise.resolve(window.supabase.createClient);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js";
      script.onload = () => window.supabase?.createClient
        ? resolve(window.supabase.createClient) : reject(new Error("sdk"));
      script.onerror = () => reject(new Error("sdk"));
      document.head.append(script);
    });
  }

  function attach({ map, L }) {
    const root = document.querySelector("[data-live-location]");
    if (!root) return;
    const config = window.JEJU_LIVE_CONFIG || {};
    const inviteLogin = config.authMode === "invite";
    const deviceLogin = config.authMode === "device" || inviteLogin;
    const { LocationPublisher, freshLocation } = window.JejuLocationCore;
    const field = (name) => root.querySelector(`[data-live-${name}]`);
    const status = field("status");
    const loginForm = field("login");
    const joinForm = field("join");
    const controls = field("controls");
    const list = field("participants");
    const shareButton = field("share");
    const logoutButton = field("logout");
    const consent = field("consent");
    let inviteToken = inviteLogin ? window.JejuInvitation.takeFromLocation(window.location, window.history) : "";
    field("invite-label").hidden = !inviteLogin;
    field("invite").hidden = !inviteLogin;
    field("invite").required = inviteLogin;
    field("password-label").hidden = inviteLogin;
    field("password").hidden = inviteLogin;
    field("password").required = !inviteLogin;
    field("invite").value = inviteToken;
    joinForm.querySelector("button").textContent = inviteLogin ? "초대 등록" : "참가자 인증";
    logoutButton.textContent = inviteLogin ? "기기 연결 해제" : "로그아웃";
    const layer = L.layerGroup().addTo(map);
    const markers = new Map();
    let client, session, member, publisher, channel, poll;
    let watchId = null;
    let busy = false;
    let refreshPending = false;
    let refreshing = false;
    let version = 0;
    let participants = [];
    let locations = [];
    let connected = false;
    let closing = false;
    let emailCooldown = 0;
    const reasons = {
      invalid_invitation: "개인 초대 링크 또는 QR을 확인해 주세요.",
      invitation_required: "운영자에게 받은 개인 초대 QR을 열거나 링크를 입력해 주세요.",
      expired: "초대 이용 기간이 만료되었습니다. 운영자에게 재발급을 요청해 주세요.",
      revoked: "초대 연결이 해제되었습니다. 운영자에게 재발급을 요청해 주세요.",
      already_used: "다른 브라우저에 등록된 초대입니다. 처음 등록한 브라우저를 사용하거나 재발급을 요청해 주세요.",
      already_registered: "이 브라우저에는 이미 다른 초대가 등록되어 있습니다.",
      invalid_password: "참가 암호를 확인해 주세요.", invalid_name: "이름은 1~30자로 입력해 주세요.",
      name_taken: "이미 등록된 이름입니다. 구분할 수 있는 이름을 입력해 주세요.",
      rate_limited: "확인 횟수를 초과했습니다. 15분 후 다시 시도해 주세요.", disabled: "참가 권한이 중지되었습니다."
    };
    const joinPrompt = () => inviteLogin ? (inviteToken ? "초대를 확인했습니다. 참가 이름을 등록해 주세요." : reasons.invitation_required)
      : deviceLogin ? "참가 이름과 접속 암호를 입력해 주세요." : "이메일 인증 후 참가 암호를 입력해 주세요.";

    function message(text, error = false) {
      status.textContent = text;
      status.classList.toggle("is-error", error);
    }

    function updateControls() {
      loginForm.hidden = deviceLogin || Boolean(session);
      joinForm.hidden = Boolean(member) || (!deviceLogin && !session);
      joinForm.querySelector("button").disabled = busy || !client;
      controls.hidden = !member;
      logoutButton.hidden = !session || (inviteLogin && !member);
      shareButton.textContent = watchId === null ? "위치 공유 시작" : "위치 공유 중지";
      shareButton.disabled = busy || !member || (watchId === null && !consent.checked);
      consent.disabled = watchId !== null || busy;
      logoutButton.disabled = busy;
      field("identity").textContent = member ? `${member.display_name}님` : "참가자 인증";
      field("connection").textContent = !member ? "미연결" : connected ? "실시간 연결" : "연결 확인 중";
    }

    function clearTracking() {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      watchId = null;
      updateControls();
    }

    function clearMap() {
      participants = [];
      locations = [];
      markers.clear();
      layer.clearLayers();
      list.replaceChildren();
      field("count").textContent = "0명 공유 중";
    }

    function renderParticipants() {
      const active = new Map(locations.filter((row) => freshLocation(row)).map((row) => [row.user_id, row]));
      const enabled = participants.filter((p) => p.enabled);
      const nameCounts = new Map();
      const nameOrder = new Map();
      const nameKey = (person) => person.display_name.trim().toLowerCase();
      for (const person of enabled) nameCounts.set(nameKey(person), (nameCounts.get(nameKey(person)) || 0) + 1);
      const visible = new Set();
      const items = enabled.map((person) => {
        const row = active.get(person.user_id);
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "live-participant";
        button.disabled = !row;
        const name = document.createElement("strong");
        const key = nameKey(person);
        nameOrder.set(key, (nameOrder.get(key) || 0) + 1);
        name.textContent = person.display_name + (nameCounts.get(key) > 1 ? ` (${nameOrder.get(key)})` : "")
          + (person.user_id === session?.user.id ? " (나)" : "");
        const detail = document.createElement("span");
        detail.textContent = row
          ? `${new Date(row.updated_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · 정확도 ${Math.round(row.accuracy)}m`
          : "공유 안 함 / 위치 갱신 대기";
        button.append(name, detail);
        item.append(button);
        if (row) {
          visible.add(person.user_id);
          let marker = markers.get(person.user_id);
          if (!marker) {
            marker = L.circleMarker([row.latitude, row.longitude], {
              radius: 9, color: "#ffffff", weight: 3, fillOpacity: 1,
              fillColor: person.user_id === session?.user.id ? "#159d84" : "#2768d0",
              bubblingMouseEvents: false
            }).addTo(layer);
            markers.set(person.user_id, marker);
          }
          marker.setLatLng([row.latitude, row.longitude]);
          const popup = document.createElement("div");
          const title = document.createElement("strong");
          title.textContent = name.textContent;
          const info = document.createElement("p");
          info.textContent = detail.textContent;
          popup.append(title, info);
          marker.bindPopup(popup);
          button.addEventListener("click", () => {
            map.setView(marker.getLatLng(), Math.max(map.getZoom(), 14));
            marker.openPopup();
          });
        }
        return item;
      });
      for (const [id, marker] of markers) {
        if (!visible.has(id)) { layer.removeLayer(marker); markers.delete(id); }
      }
      list.replaceChildren(...items);
      field("count").textContent = `${visible.size}명 공유 중 · 참가자 ${enabled.length}명`;
      field("fit").disabled = visible.size === 0;
    }

    async function refresh() {
      if (!client || !session || closing) return;
      if (refreshing) { refreshPending = true; return; }
      refreshing = true;
      const stamp = version;
      try {
        if (inviteLogin) {
          const access = await client.rpc("jeju_invitation_status", { p_trip_id: config.tripId });
          if (stamp !== version) return;
          if (access.error) throw access.error;
          if (!access.data?.ok) {
            member = null;
            clearTracking();
            publisher.cancel();
            clearMap();
            message(reasons[access.data?.reason] || reasons.invitation_required, Boolean(access.data?.slot));
            updateControls();
            return;
          }
        }
        const people = await client.from("jeju_participants").select("user_id,display_name,enabled")
          .eq("trip_id", config.tripId).order("joined_at");
        if (stamp !== version) return;
        if (people.error) throw people.error;
        const own = people.data.find((person) => person.user_id === session.user.id);
        if (!own?.enabled) {
          member = null;
          clearTracking();
          publisher.cancel();
          clearMap();
          if (own) message("참가 권한이 중지되었습니다. 운영자에게 확인해 주세요.", true);
          updateControls();
          return;
        }
        member = own;
        participants = people.data;
        const result = await client.from("jeju_live_locations")
          .select("user_id,latitude,longitude,accuracy,sharing,updated_at")
          .eq("trip_id", config.tripId);
        if (stamp !== version) return;
        if (result.error) throw result.error;
        locations = result.data;
        renderParticipants();
        updateControls();
      } catch {
        if (stamp === version) {
          renderParticipants();
          message("참가자 위치를 갱신하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.", true);
        }
      } finally {
        refreshing = false;
        if (refreshPending) { refreshPending = false; void refresh(); }
      }
    }

    async function stopSharing() {
      clearTracking();
      const result = await publisher.stop();
      message(result?.error
        ? "이 기기의 위치 전송을 중지했습니다. 연결이 끊겨 마지막 위치는 최대 2분간 남을 수 있습니다."
        : "위치 공유를 중지했습니다.", Boolean(result?.error));
      void refresh();
    }

    async function syncSession(next) {
      if (session?.user.id === next?.user.id && session) { session = next; return; }
      version += 1;
      session = next;
      member = null;
      connected = false;
      clearTracking();
      publisher.cancel();
      clearMap();
      clearInterval(poll);
      if (channel) { void client.removeChannel(channel); channel = null; }
      updateControls();
      if (!session) {
        message(joinPrompt());
        return;
      }
      message("참가 정보를 확인하고 있습니다.");
      const stamp = version;
      await refresh();
      if (!session || stamp !== version) return;
      channel = client.channel(`jeju-location-${config.tripId}`)
        .on("system", {}, (payload) => {
          if (stamp !== version || payload.extension !== "postgres_changes") return;
          connected = payload.status === "ok";
          updateControls();
          if (connected) void refresh();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "jeju_live_locations", filter: `trip_id=eq.${config.tripId}` }, () => void refresh())
        .on("postgres_changes", { event: "*", schema: "public", table: "jeju_participants", filter: `trip_id=eq.${config.tripId}` }, () => void refresh())
        .subscribe((state) => {
          if (stamp !== version) return;
          if (state !== "SUBSCRIBED") connected = false;
          updateControls();
          if (connected) void refresh();
        });
      poll = setInterval(() => { renderParticipants(); void refresh(); }, 15000);
      if (member) message("참가자 인증이 완료되었습니다.");
      else if (!inviteLogin) message(joinPrompt());
    }

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client || busy) return;
      if (Date.now() < emailCooldown) { message("잠시 후 인증 메일을 다시 요청해 주세요.", true); return; }
      busy = true;
      const button = loginForm.querySelector("button");
      button.disabled = true;
      try {
        const callback = new URL("course.html?panel=participants", window.location.href);
        const { error } = await client.auth.signInWithOtp({ email: field("email").value.trim(),
          options: { emailRedirectTo: callback.href } });
        if (error) throw error;
        emailCooldown = Date.now() + 60000;
        message("이메일의 로그인 링크를 열어 인증을 완료해 주세요.");
      } catch { message("인증 메일을 보내지 못했습니다. 이메일 주소와 연결 상태를 확인해 주세요.", true); }
      finally { busy = false; button.disabled = false; updateControls(); }
    });

    joinForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client || busy || (!deviceLogin && !session)) return;
      busy = true;
      const button = joinForm.querySelector("button");
      button.disabled = true;
      try {
        if (inviteLogin) {
          inviteToken = window.JejuInvitation.tokenFrom(field("invite").value, window.location.origin);
          if (!inviteToken) { message(reasons.invalid_invitation, true); return; }
        }
        if (!session) {
          const result = await client.auth.signInAnonymously();
          if (result.error || !result.data?.session) throw result.error || new Error("device_login");
          await syncSession(result.data.session);
        }
        const { data, error } = await client.rpc(inviteLogin ? "jeju_claim_invitation" : "jeju_join_trip", {
          p_trip_id: config.tripId, p_name: field("name").value.trim(),
          ...(inviteLogin ? { p_token: inviteToken } : { p_password: field("password").value })
        });
        field("password").value = "";
        if (error) throw error;
        if (!data?.ok) {
          message(reasons[data?.reason] || "참가자 등록을 완료하지 못했습니다.", true);
          return;
        }
        if (inviteLogin) { inviteToken = ""; field("invite").value = ""; }
        await refresh();
        if (member) message("참가자 인증이 완료되었습니다.");
      } catch { message("참가자 인증을 완료하지 못했습니다. 연결을 확인해 주세요.", true); }
      finally { busy = false; button.disabled = false; updateControls(); }
    });

    consent.addEventListener("change", updateControls);
    shareButton.addEventListener("click", async () => {
      if (busy || !member) return;
      if (watchId === null && !consent.checked) return;
      busy = true;
      updateControls();
      try {
        if (watchId !== null) { await stopSharing(); return; }
        if (!window.isSecureContext || !navigator.geolocation) {
          message("위치 공유는 HTTPS 접속과 기기의 위치 기능이 필요합니다.", true);
          return;
        }
        const stamp = version;
        const { data, error } = await client.rpc("jeju_start_sharing", { p_trip_id: config.tripId });
        if (error) throw error;
        if (stamp !== version || !member || closing) return;
        publisher.activate(data);
        watchId = navigator.geolocation.watchPosition((position) => publisher.enqueue(position), (error) => {
          if (error.code === 1) {
            clearTracking();
            void publisher.stop();
            message("위치 권한이 허용되지 않아 공유를 중지했습니다.", true);
          } else message("현재 위치를 확인하지 못했습니다. 위치 신호를 기다리고 있습니다.", true);
        }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
        message("위치 공유를 시작했습니다. 현재 위치를 확인하고 있습니다.");
      } catch { message("위치 공유를 변경하지 못했습니다. 다시 시도해 주세요.", true); }
      finally { busy = false; updateControls(); }
    });

    logoutButton.addEventListener("click", async () => {
      if (busy || !client) return;
      if (inviteLogin && !window.confirm("기기 연결을 해제하면 이 초대는 다시 사용할 수 없습니다. 재참가하려면 운영자의 재발급이 필요합니다. 연결을 해제할까요?")) return;
      busy = true;
      updateControls();
      try {
        await stopSharing();
        if (inviteLogin || session?.user.is_anonymous) {
          const leave = await client.rpc("jeju_leave_trip", { p_trip_id: config.tripId });
          if (leave.error) throw leave.error;
        }
        const { error } = await client.auth.signOut({ scope: "local" });
        if (error) throw error;
        await syncSession(null);
      } catch { message("로그아웃을 완료하지 못했습니다. 연결을 확인해 주세요.", true); }
      finally { busy = false; updateControls(); }
    });

    field("refresh").addEventListener("click", () => void refresh());
    field("fit").addEventListener("click", () => {
      const points = [...markers.values()].map((marker) => marker.getLatLng());
      if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
    });
    window.addEventListener("online", () => { if (session) void refresh(); });
    window.addEventListener("offline", () => {
      connected = false;
      updateControls();
      if (member) message("인터넷 연결이 끊겼습니다. 위치가 갱신되지 않고 있습니다.", true);
    });
    window.addEventListener("pagehide", () => {
      closing = true;
      clearTracking();
      if (publisher) void publisher.stop();
      clearInterval(poll);
    });
    window.addEventListener("pageshow", (event) => {
      if (!event.persisted) return;
      closing = false;
      if (session) { poll = setInterval(() => { renderParticipants(); void refresh(); }, 15000); void refresh(); }
    });

    async function init() {
      loginForm.querySelector("button").disabled = true;
      updateControls();
      if (!config.publishableKey || !config.supabaseUrl || !config.tripId) {
        message("참가자 위치 공유 연결을 준비 중입니다.");
        return;
      }
      try {
        const key = config.publishableKey;
        const isAnon = key.startsWith("eyJ") && JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role === "anon";
        if (!key.startsWith("sb_publishable_") && !isAnon) throw new Error("invalid_key");
        const createClient = await loadClient();
        client = createClient(config.supabaseUrl, key, {
          auth: { storageKey: "jeju-gaja-auth-v1", flowType: "pkce", detectSessionInUrl: true },
          global: { fetch: (url, options = {}) => fetch(url, { ...options,
            signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }) }
        });
        publisher = new LocationPublisher({ rpc: (name, args) => client.rpc(name, args), tripId: config.tripId,
          onResult: ({ data, error }) => {
            if (error?.code === "42501" || (!error && data === false)) {
              clearTracking();
              publisher.cancel();
              message("공유 세션이 종료되었습니다. 참가 상태를 확인한 후 다시 시작해 주세요.", true);
              void refresh();
            } else if (error) message("위치를 전송하지 못했습니다. 연결을 확인해 주세요.", true);
            else { message("내 위치를 공유하고 있습니다."); void refresh(); }
          }
        });
        client.auth.onAuthStateChange((_event, next) => { setTimeout(() => void syncSession(next), 0); });
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        await syncSession(data.session);
        loginForm.querySelector("button").disabled = false;
      } catch { message("참가자 인증에 연결하지 못했습니다. 잠시 후 새로고침해 주세요.", true); }
    }
    void init();
  }
})();
