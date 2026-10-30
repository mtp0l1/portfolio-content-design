/* Avatar com balão de fala em pixel art que toca a playlist.
 *
 * Estado:  isPinned = false
 *   mouseenter (avatar)  -> se !isPinned: toca e mostra o balão
 *   mouseleave (avatar)  -> se !isPinned: pausa e esconde o balão (se isPinned, segue tocando)
 *   click      (avatar)  -> !isPinned: fixa (isPinned = true) | isPinned: desfixa, pausa e esconde
 *
 * Dois motores com a mesma interface { play(), pause(), onTrack(cb), onFail(cb) }:
 *   - PreviewEngine : HTMLAudioElement com as prévias de 30 s (play/pause instantâneo)
 *   - SpotifyEngine : Spotify IFrame API, controlada por código, iframe invisível
 * O PreviewEngine é o padrão. Se uma prévia falhar, troca sozinho para o Spotify.
 */
(function () {
  "use strict";

  var CONFIG = {
    engine: "preview", // "preview" | "spotify"
    playlistId: "6ZJb7zsFDa3L7acRCyCYdl",
    volume: 0.7,
    // Faixas da playlist (lidas do embed público). previewUrl = prévia de 30 s do Spotify.
    tracks: [
      { artist: "Khruangbin", song: "Right", uri: "spotify:track:3ezJklJWZRm6pWI3DQjW9e", previewUrl: "https://p.scdn.co/mp3-preview/ce61667a09a919c3d879445ad9c848a182f126f1" },
      { artist: "Parcels", song: "Exotica", uri: "spotify:track:2eC43PWHMbUnwqCRZcbGfo", previewUrl: "https://p.scdn.co/mp3-preview/d208427331f890231ff5ff6cf81b8117b08dc1a1" },
      { artist: "Fruit Bats", song: "The Saddest Part of the Song", uri: "spotify:track:0G3la950nVoDeqKhfMooOw", previewUrl: "https://p.scdn.co/mp3-preview/4fcba82d811b384d8617a16693f64defef70ace3" }
    ]
  };

  /* ---------- Motor 1: HTMLAudioElement ---------- */
  function PreviewEngine(cfg) {
    var tracks = cfg.tracks, i = 0, trackCb = function () {}, failCb = function () {};
    var audio = new Audio();
    audio.preload = "auto";
    audio.volume = cfg.volume;
    function load(n) {
      i = (n + tracks.length) % tracks.length;
      audio.src = tracks[i].previewUrl;
      trackCb(tracks[i]);
    }
    audio.addEventListener("ended", function () { load(i + 1); audio.play().catch(function () {}); });
    audio.addEventListener("error", function () { failCb(); });
    load(0);
    return {
      name: "preview",
      current: function () { return tracks[i]; },
      play: function () { return audio.play(); },
      pause: function () { audio.pause(); },
      onTrack: function (cb) { trackCb = cb; cb(tracks[i]); },
      onFail: function (cb) { failCb = cb; },
      destroy: function () { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    };
  }

  /* ---------- Motor 2: Spotify IFrame API ---------- */
  function SpotifyEngine(cfg) {
    var ctrl = null, ready = false, wantPlay = false, cur = cfg.tracks[0];
    var trackCb = function () {}, failCb = function () {};
    var host = document.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden";
    var mount = document.createElement("div");
    host.appendChild(mount);
    document.body.appendChild(host);

    function byUri(uri) {
      for (var k = 0; k < cfg.tracks.length; k++) if (cfg.tracks[k].uri === uri) return cfg.tracks[k];
      return null;
    }
    function init(IFrameAPI) {
      IFrameAPI.createController(mount, { uri: "spotify:playlist:" + cfg.playlistId, width: 1, height: 1 }, function (c) {
        ctrl = c;
        ctrl.addListener("ready", function () { ready = true; if (wantPlay) ctrl.resume(); });
        ctrl.addListener("playback_update", function (e) {
          var d = (e && e.data) || {};
          var t = d.playingURI && byUri(d.playingURI);
          if (t && t !== cur) { cur = t; trackCb(t); }
        });
        ctrl.addListener("account_error", function () { failCb(); });
      });
    }
    if (window.__spIframeApi) init(window.__spIframeApi);
    else {
      window.onSpotifyIframeApiReady = function (api) { window.__spIframeApi = api; init(api); };
      var s = document.createElement("script");
      s.src = "https://open.spotify.com/embed/iframe-api/v1";
      s.async = true;
      s.onerror = function () { failCb(); };
      document.head.appendChild(s);
    }
    return {
      name: "spotify",
      current: function () { return cur; },
      play: function () { wantPlay = true; if (ctrl && ready) ctrl.resume(); return Promise.resolve(); },
      pause: function () { wantPlay = false; if (ctrl && ready) ctrl.pause(); },
      onTrack: function (cb) { trackCb = cb; cb(cur); },
      onFail: function (cb) { failCb = cb; },
      destroy: function () { try { if (ctrl) ctrl.destroy(); } catch (e) {} host.remove(); }
    };
  }

  /* ---------- Controlador da interface ---------- */
  function AvatarPlayer(root, cfg) {
    var btn = root.querySelector(".sp-av-btn");
    var bubble = root.querySelector(".sp-bubble");
    var label = root.querySelector(".sp-bubble-text");
    var isPinned = false, engine = null;

    function render(t) { if (t) label.textContent = t.artist + " - " + t.song; }
    function setEngine(name) {
      if (engine) engine.destroy();
      engine = name === "spotify" ? SpotifyEngine(cfg) : PreviewEngine(cfg);
      engine.onTrack(render);
      engine.onFail(function () { if (engine.name === "preview") { var live = bubble.classList.contains("on"); setEngine("spotify"); if (live) engine.play(); } });
    }
    function show() { bubble.classList.add("on"); }
    function hide() { bubble.classList.remove("on"); }
    function start() {
      show();
      var p = engine.play();
      if (p && p.catch) p.catch(function () { /* o navegador só libera som depois de um clique na página */ });
    }
    function stop() { engine.pause(); hide(); }
    function sync() { btn.setAttribute("aria-pressed", String(isPinned)); }

    btn.addEventListener("mouseenter", function () { if (!isPinned) start(); });
    btn.addEventListener("mouseleave", function () { if (!isPinned) stop(); });
    btn.addEventListener("click", function () {
      if (!isPinned) { isPinned = true; start(); }
      else { isPinned = false; stop(); }
      sync();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isPinned) { isPinned = false; stop(); sync(); } });

    setEngine(cfg.engine);
    sync();
    return { get isPinned() { return isPinned; } };
  }

  function boot() {
    var root = document.querySelector("[data-avatar-player]");
    if (!root) return;
    window.avatarPlayer = AvatarPlayer(root, CONFIG);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
