/**
 * 티니핑 미니게임 T1: 샤랄라 구름길 점프런 (tp-runner.js)
 * - 6~7세 맞춤 하트 3개 무한 달리기 & 점프/숙이기 액션 게임
 * - 주인공 티니핑 DOM 퍼펫(.tp-runner-hero + 양쪽 마법 날개 .tp-wing)과
 *   파스텔 무지개 구름길 <canvas> 배경의 하이브리드 렌더링
 */
(function (global) {
  'use strict';

  var GROUND_OBSTACLES = [
    { icon: '⛈️', name: '심술 먹구름', badge: '⬆️점프!', kind: 'ground' },
    { icon: '🍄', name: '통통 독버섯', badge: '⬆️점프!', kind: 'ground' },
    { icon: '📦', name: '장난꾸러기 상자', badge: '⬆️점프!', kind: 'ground' }
  ];

  var AIR_OBSTACLES = [
    { icon: '☄️', name: '슈팅 별똥별', badge: '⬇️숙이기!', kind: 'air' },
    { icon: '🦇', name: '심술 박쥐구름', badge: '⬇️숙이기!', kind: 'air' },
    { icon: '🌪️', name: '회오리 바람', badge: '⬇️숙이기!', kind: 'air' }
  ];

  var SWEET_ICONS = ['🍰', '🍬', '🍓'];

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildRunnerStyles() {
    return [
      '.tp-runner-wrap {',
      '  position: relative; width: 100%; max-width: 680px; margin: 0 auto;',
      '  display: flex; flex-direction: column; gap: 10px;',
      '  font-family: "Pretendard", "Malgun Gothic", sans-serif; user-select: none;',
      '}',
      '.tp-runner-hud {',
      '  display: flex; align-items: center; justify-content: space-between; gap: 8px;',
      '  background: rgba(255, 255, 255, 0.92); border: 2px solid #FFB6D9;',
      '  border-radius: 18px; padding: 8px 14px; box-shadow: 0 4px 12px rgba(255, 105, 180, 0.15);',
      '}',
      '.tp-runner-hearts { font-size: 1.35rem; letter-spacing: 2px; min-width: 90px; }',
      '.tp-runner-guide-badge {',
      '  padding: 5px 12px; border-radius: 999px; font-weight: 800; font-size: 0.95rem;',
      '  background: linear-gradient(135deg, #FFF0F6, #F3E5F5); color: #D81B60;',
      '  border: 2px solid #F48FB1; transition: transform 0.2s ease;',
      '}',
      '.tp-runner-guide-badge.is-alert { transform: scale(1.06); background: #FFF8E1; border-color: #FFB300; color: #E65100; }',
      '.tp-runner-score-box { text-align: right; font-weight: 800; color: #AD1457; font-size: 1rem; }',
      '.tp-runner-score-box small { display: block; font-size: 0.75rem; color: #8E24AA; font-weight: 700; }',
      '.tp-runner-viewport {',
      '  position: relative; width: 100%; height: 290px; border-radius: 22px; overflow: hidden;',
      '  border: 3px solid #FF9EBB; background: linear-gradient(180deg, #E1F5FE 0%, #FCE4EC 72%, #FFF9C4 100%);',
      '  box-shadow: inset 0 0 24px rgba(255, 182, 193, 0.35), 0 8px 20px rgba(255, 105, 180, 0.18);',
      '}',
      '.tp-runner-canvas { width: 100%; height: 100%; display: block; }',
      '.tp-runner-hero {',
      '  position: absolute; left: 68px; bottom: 54px; width: 84px; height: 84px;',
      '  display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 5;',
      '  transform-origin: center bottom; will-change: transform, filter;',
      '}',
      '.tp-runner-puppet {',
      '  position: relative; width: 76px; height: 76px; display: flex; align-items: center; justify-content: center;',
      '}',
      '.tp-wing {',
      '  position: absolute; top: 18px; font-size: 1.7rem; line-height: 1; pointer-events: none;',
      '  filter: drop-shadow(0 2px 4px rgba(255, 105, 180, 0.35)); transition: transform 0.06s linear;',
      '}',
      '.tp-wing-left { left: -16px; transform-origin: right center; }',
      '.tp-wing-right { right: -16px; transform-origin: left center; }',
      '.tp-runner-avatar {',
      '  width: 68px; height: 68px; border-radius: 50%; border: 3px solid #FFFFFF;',
      '  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.45); overflow: hidden;',
      '  display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.5rem; color: #FFF;',
      '  background: #FF69B4; position: relative; z-index: 2;',
      '}',
      '.tp-runner-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }',
      '.tp-runner-avatar .tp-runner-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }',
      '.tp-runner-bubble {',
      '  position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%);',
      '  white-space: nowrap; background: #FFFFFF; color: #D81B60; font-weight: 800; font-size: 0.82rem;',
      '  padding: 5px 11px; border-radius: 14px; border: 2px solid #FF80AB;',
      '  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12); z-index: 8;',
      '}',
      '.tp-runner-controls {',
      '  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;',
      '}',
      '.tp-runner-btn {',
      '  display: flex; flex-direction: column; align-items: center; justify-content: center;',
      '  padding: 14px 10px; border-radius: 20px; border: 3px solid transparent; cursor: pointer;',
      '  font-family: inherit; font-weight: 900; font-size: 1.15rem; transition: transform 0.1s ease, box-shadow 0.1s ease;',
      '  box-shadow: 0 6px 0 rgba(0,0,0,0.12), 0 8px 16px rgba(255, 105, 180, 0.22);',
      '}',
      '.tp-runner-btn:active, .tp-runner-btn.is-active { transform: translateY(3px) scale(0.98); }',
      '.tp-runner-btn-jump {',
      '  background: linear-gradient(180deg, #FF80AB 0%, #EC407A 100%); color: #FFFFFF; border-color: #FCE4EC;',
      '}',
      '.tp-runner-btn-duck {',
      '  background: linear-gradient(180deg, #BA68C8 0%, #8E24AA 100%); color: #FFFFFF; border-color: #F3E5F5;',
      '}',
      '.tp-runner-btn small { font-size: 0.76rem; font-weight: 700; opacity: 0.92; margin-top: 3px; }'
    ].join('\n');
  }

  function defaultComputeRunTransform(state, tick) {
    var yOffset = Number(state && state.yOffset) || 0;
    var isJumping = Boolean(state && state.isJumping);
    var isDucking = Boolean(state && state.isDucking);
    var isHit = Boolean(state && state.isHit);
    var t = Number(tick) || 0;

    var bounceY = isJumping ? yOffset : Math.sin(t * 0.35) * 4;
    var scaleX = isDucking ? 1.24 : (isJumping ? 0.94 : 1 + Math.sin(t * 0.35) * 0.04);
    var scaleY = isDucking ? 0.62 : (isJumping ? 1.08 : 1 - Math.sin(t * 0.35) * 0.04);
    var rot = isDucking ? 8 : (isJumping ? -6 : Math.sin(t * 0.25) * 4);
    var flap = Math.sin(t * (isJumping ? 0.7 : 0.4)) * (isJumping ? 28 : 16);

    var bodyTransform = 'translateY(' + bounceY.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg) scale(' + scaleX.toFixed(2) + ', ' + scaleY.toFixed(2) + ')';
    var bodyFilter = isHit && (Math.floor(t / 4) % 2 === 0)
      ? 'brightness(1.5) drop-shadow(0 0 10px #FF1744)'
      : 'drop-shadow(0 4px 8px rgba(255, 105, 180, 0.35))';

    return {
      transform: bodyTransform,
      bodyTransform: bodyTransform,
      filter: bodyFilter,
      bodyFilter: bodyFilter,
      leftWingTransform: 'rotate(' + (-15 - flap).toFixed(1) + 'deg) scale(' + (isDucking ? 0.85 : 1) + ')',
      rightWingTransform: ' scaleX(-1) rotate(' + (-15 - flap).toFixed(1) + 'deg) scale(' + (isDucking ? 0.85 : 1) + ')',
      wingLeft: 'rotate(' + (-15 - flap).toFixed(1) + 'deg)',
      wingRight: 'scaleX(-1) rotate(' + (-15 - flap).toFixed(1) + 'deg)'
    };
  }

  var gameDef = {
    id: 'runner',
    title: '샤랄라 구름길 점프런',
    subtitle: '폴짝 점프하고 납작 숙여서 구름길을 달려요!',
    icon: '🌈',
    badgeColor: '#FF69B4',

    mount: function (stageEl, charCtx, helpers) {
      if (!stageEl) {
        return function () {};
      }

      var ctxChar = Object.assign({
        name: '하츄핑',
        nameEn: 'Heartsping',
        image: '',
        color: '#FF69B4',
        grade: '로열',
        emotion: '사랑',
        gender: '여',
        mainSeason: 1,
        seasonTheme: '샤랄라 하트',
        seasonEmoji: '🍓',
        pool: []
      }, charCtx || {});

      var safeHelpers = Object.assign({
        playSfx: function () {},
        playCry: function () {},
        computeRunTransform: defaultComputeRunTransform,
        getHighScore: function () { return 0; },
        saveHighScore: function () {},
        rewardCharacter: function () {},
        createHeartExplosion: function () {},
        renderAvatarHtml: null,
        showResultOverlay: function () {}
      }, helpers || {});

      var initialChar = escapeHtml((ctxChar.name || '핑').charAt(0));
      var heroColor = escapeHtml(ctxChar.color || '#FF69B4');
      var highScore = Number(safeHelpers.getHighScore('runner')) || 0;

      var avatarInnerHtml = ctxChar.image
        ? '<img src="' + escapeHtml(ctxChar.image) + '" alt="' + escapeHtml(ctxChar.name) + '" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'flex\';" />' +
          '<span class="tp-runner-fallback" style="display:none;background:' + heroColor + ';">' + initialChar + '</span>'
        : '<span class="tp-runner-fallback" style="background:' + heroColor + ';">' + initialChar + '</span>';

      stageEl.innerHTML = [
        '<style class="tp-runner-style">' + buildRunnerStyles() + '</style>',
        '<div class="tp-runner-wrap" data-game="runner">',
        '  <div class="tp-runner-hud">',
        '    <div class="tp-runner-hearts" aria-label="남은 하트">💖💖💖</div>',
        '    <div class="tp-runner-guide-badge">🌈 ' + escapeHtml(ctxChar.name) + '과 구름길 출발!</div>',
        '    <div class="tp-runner-score-box">',
        '      <span class="tp-runner-score-val">0점</span>',
        '      <small class="tp-runner-high-val">👑 최고 ' + highScore + '점</small>',
        '    </div>',
        '  </div>',
        '  <div class="tp-runner-viewport">',
        '    <canvas class="tp-runner-canvas" width="640" height="290"></canvas>',
        '    <div class="tp-runner-hero">',
        '      <div class="tp-runner-bubble" style="display:none;">앗! 깜짝이야~ 츄!</div>',
        '      <div class="tp-runner-puppet">',
        '        <span class="tp-wing tp-wing-left">🪽</span>',
        '        <div class="tp-runner-avatar" style="background:' + heroColor + ';">' + avatarInnerHtml + '</div>',
        '        <span class="tp-wing tp-wing-right">🪽</span>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div class="tp-runner-controls">',
        '    <button type="button" class="tp-runner-btn tp-runner-btn-jump" aria-label="폴짝 점프">',
        '      <span>⬆️ 폴짝 점프!</span>',
        '      <small>공중에서 한 번 더 누르면 2단 점프!</small>',
        '    </button>',
        '    <button type="button" class="tp-runner-btn tp-runner-btn-duck" aria-label="납작 숙이기">',
        '      <span>⬇️ 납작 숙이기!</span>',
        '      <small>날아오는 공중 장애물을 피해요!</small>',
        '    </button>',
        '  </div>',
        '</div>'
      ].join('\n');

      var heartsEl = stageEl.querySelector('.tp-runner-hearts');
      var guideBadgeEl = stageEl.querySelector('.tp-runner-guide-badge');
      var scoreValEl = stageEl.querySelector('.tp-runner-score-val');
      var highValEl = stageEl.querySelector('.tp-runner-high-val');
      var canvasEl = stageEl.querySelector('.tp-runner-canvas');
      var heroEl = stageEl.querySelector('.tp-runner-hero');
      var wingLeftEl = stageEl.querySelector('.tp-wing-left');
      var wingRightEl = stageEl.querySelector('.tp-wing-right');
      var bubbleEl = stageEl.querySelector('.tp-runner-bubble');
      var jumpBtn = stageEl.querySelector('.tp-runner-btn-jump');
      var duckBtn = stageEl.querySelector('.tp-runner-btn-duck');

      var canvasCtx = (canvasEl && typeof canvasEl.getContext === 'function')
        ? canvasEl.getContext('2d')
        : null;

      var CANVAS_W = 640;
      var CANVAS_H = 290;
      var GROUND_Y = 236;
      var HERO_X = 110;

      var tick = 0;
      var score = 0;
      var lives = 3;
      var maxLives = 3;
      var speed = 4.6;
      var isGameOver = false;
      var isCleanedUp = false;
      var rafId = null;

      var player = {
        y: 0,
        vy: 0,
        gravity: 0.62,
        isJumping: false,
        isDucking: false,
        duckHold: false,
        duckTimer: 0,
        jumpCount: 0,
        maxJumpCount: 2,
        jumpProgress: 0,
        invincibleTimer: 0,
        bubbleTimer: 0,
        bubbleText: ''
      };

      var obstacles = [];
      var items = [];
      var particles = [];
      var floatingTexts = [];
      var clouds = [
        { x: 90, y: 55, r: 28, speed: 0.6 },
        { x: 280, y: 42, r: 34, speed: 0.45 },
        { x: 490, y: 68, r: 25, speed: 0.75 }
      ];

      var nextObstacleTick = 55;
      var nextItemTick = 28;

      function showBubble(text, durationFrames) {
        player.bubbleText = text;
        player.bubbleTimer = durationFrames || 65;
        if (bubbleEl) {
          bubbleEl.textContent = text;
          bubbleEl.style.display = 'block';
        }
      }

      function updateHud() {
        if (heartsEl) {
          var full = '';
          for (var i = 0; i < maxLives; i++) {
            full += i < lives ? '💖' : '🤍';
          }
          heartsEl.textContent = full;
        }
        if (scoreValEl) {
          scoreValEl.textContent = score + '점';
        }
        if (highValEl) {
          var best = Math.max(highScore, score);
          highValEl.textContent = '👑 최고 ' + best + '점';
        }
      }

      function spawnFootParticles(count, extraEmoji) {
        for (var i = 0; i < count; i++) {
          particles.push({
            x: HERO_X - 18 + Math.random() * 20,
            y: GROUND_Y + player.y - 6 + Math.random() * 8,
            vx: -1.5 - Math.random() * 2.2,
            vy: -0.8 - Math.random() * 2.0,
            size: 4 + Math.random() * 5,
            alpha: 1,
            color: ctxChar.color || '#FF69B4',
            emoji: extraEmoji || (Math.random() < 0.35 ? '✨' : (Math.random() < 0.5 ? '💖' : ''))
          });
        }
        if (particles.length > 50) {
          particles.splice(0, particles.length - 50);
        }
      }

      function applyPuppetTransform() {
        var statePayload = {
          yOffset: player.y,
          isJumping: player.isJumping,
          isDucking: player.isDucking,
          isHit: player.invincibleTimer > 0,
          jumpProgress: player.jumpProgress
        };
        var computed = null;
        try {
          if (typeof safeHelpers.computeRunTransform === 'function') {
            computed = safeHelpers.computeRunTransform(statePayload, tick);
          }
        } catch (err) {
          computed = null;
        }
        var fallback = defaultComputeRunTransform(statePayload, tick);
        var bodyTransform = fallback.bodyTransform;
        var bodyFilter = fallback.bodyFilter;
        var leftWingTransform = fallback.leftWingTransform;
        var rightWingTransform = fallback.rightWingTransform;

        if (typeof computed === 'string') {
          bodyTransform = computed;
        } else if (computed && typeof computed === 'object') {
          bodyTransform = computed.transform || computed.bodyTransform || bodyTransform;
          bodyFilter = computed.filter || computed.bodyFilter || bodyFilter;
          leftWingTransform = computed.leftWingTransform || computed.wingLeftTransform || computed.wingLeft || leftWingTransform;
          rightWingTransform = computed.rightWingTransform || computed.wingRightTransform || computed.wingRight || rightWingTransform;
        }

        if (heroEl && heroEl.style) {
          heroEl.style.transform = bodyTransform;
          heroEl.style.filter = bodyFilter;
          heroEl.style.opacity = (player.invincibleTimer > 0 && Math.floor(tick / 4) % 2 === 1) ? '0.55' : '1';
        }
        if (wingLeftEl && wingLeftEl.style) {
          wingLeftEl.style.transform = leftWingTransform;
        }
        if (wingRightEl && wingRightEl.style) {
          wingRightEl.style.transform = rightWingTransform;
        }
      }

      function jump() {
        if (isGameOver || isCleanedUp) return false;
        if (player.jumpCount >= player.maxJumpCount) return false;

        player.isDucking = false;
        player.duckHold = false;
        player.duckTimer = 0;
        player.isJumping = true;
        player.jumpCount += 1;
        player.vy = player.jumpCount === 1 ? -11.6 : -10.2;
        player.jumpProgress = 0.05;

        if (duckBtn && duckBtn.classList) {
          duckBtn.classList.remove('is-active');
        }
        if (jumpBtn && jumpBtn.classList) {
          jumpBtn.classList.add('is-active');
        }

        safeHelpers.playSfx('jump', player.jumpCount);
        spawnFootParticles(6, player.jumpCount === 2 ? '🌟' : '✨');
        if (player.jumpCount === 2) {
          showBubble('샤랄라 2단 점프~! 🪽', 40);
        }
        applyPuppetTransform();
        return true;
      }

      function duck(active, autoMaintainMs) {
        if (isGameOver || isCleanedUp) return false;
        var shouldDuck = active === undefined ? true : Boolean(active);

        if (shouldDuck) {
          player.isDucking = true;
          player.duckHold = !autoMaintainMs;
          // 0.65초(약 40프레임) 자동 숙이기 유지
          player.duckTimer = Math.max(player.duckTimer, 40);
          if (player.isJumping && player.vy < 4) {
            player.vy = 5.5;
          }
          if (duckBtn && duckBtn.classList) {
            duckBtn.classList.add('is-active');
          }
          safeHelpers.playSfx('pop', 0);
        } else {
          player.duckHold = false;
          player.isDucking = false;
          player.duckTimer = 0;
          if (duckBtn && duckBtn.classList) {
            duckBtn.classList.remove('is-active');
          }
        }
        applyPuppetTransform();
        return player.isDucking;
      }

      function tapDuck() {
        if (isGameOver || isCleanedUp) return;
        player.isDucking = true;
        player.duckHold = false;
        player.duckTimer = 40; // 약 0.65초(650ms) 동안 유지
        if (player.isJumping && player.vy < 4) {
          player.vy = 5.5;
        }
        if (duckBtn && duckBtn.classList) {
          duckBtn.classList.add('is-active');
        }
        safeHelpers.playSfx('pop', 0);
        applyPuppetTransform();
      }

      function spawnObstacle() {
        var isAir = Math.random() < 0.42;
        var pool = isAir ? AIR_OBSTACLES : GROUND_OBSTACLES;
        var chosen = pool[Math.floor(Math.random() * pool.length)];
        obstacles.push({
          x: CANVAS_W + 40,
          y: isAir ? (GROUND_Y - 62) : (GROUND_Y - 22),
          width: 44,
          height: 42,
          kind: chosen.kind,
          icon: chosen.icon,
          name: chosen.name,
          badge: chosen.badge,
          passed: false
        });
      }

      function spawnItem() {
        var roll = Math.random();
        var itemType = 'sweet';
        var icon = SWEET_ICONS[Math.floor(Math.random() * SWEET_ICONS.length)];
        var pts = 15;

        if (roll < 0.14) {
          itemType = 'crown';
          icon = '👑';
          pts = 50;
        } else if (roll < 0.55) {
          itemType = 'season';
          icon = ctxChar.seasonEmoji || '🍓';
          pts = 20;
        }

        var highLane = Math.random() < 0.45;
        items.push({
          x: CANVAS_W + 30,
          y: highLane ? (GROUND_Y - 92) : (GROUND_Y - 30),
          radius: 18,
          type: itemType,
          icon: icon,
          points: pts,
          collected: false
        });
      }

      function finishGame() {
        if (isGameOver) return;
        isGameOver = true;
        if (rafId != null && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        var best = Math.max(highScore, score);
        highScore = best;
        safeHelpers.playCry();
        safeHelpers.saveHighScore('runner', score);
        safeHelpers.rewardCharacter();
        updateHud();

        safeHelpers.showResultOverlay(stageEl, {
          gameId: 'runner',
          title: '샤랄라 구름길 달리기 완료!',
          score: score,
          highScore: best,
          charCtx: ctxChar,
          message: ctxChar.name + ' 친구가 무지개 구름길에서 ' + score + '점을 모았어요! 💖'
        });
      }

      function handleObstacleHit(obs) {
        if (player.invincibleTimer > 0 || isGameOver) return;
        lives = Math.max(0, lives - 1);
        player.invincibleTimer = 90; // 90프레임(약 1.5초) 무적 깜빡임
        safeHelpers.playSfx('hit', 0);
        showBubble('앗! 깜짝이야~ 츄!', 80);
        floatingTexts.push({
          x: HERO_X,
          y: GROUND_Y + player.y - 55,
          text: '앗! 깜짝이야~ 💔',
          color: '#E91E63',
          life: 40
        });
        updateHud();

        if (lives <= 0) {
          finishGame();
        }
      }

      function stepFrame() {
        if (isGameOver || isCleanedUp) return getState();

        tick += 1;
        speed = Math.min(7.5, 4.6 + Math.floor(tick / 360) * 0.25);

        if (tick % 18 === 0) {
          score += 1;
        }

        // 플레이어 점프 물리 업데이트
        if (player.isJumping) {
          player.y += player.vy;
          player.vy += player.gravity;
          var normalized = Math.min(1, Math.max(0.05, (player.vy + 12) / 24));
          player.jumpProgress = Number(normalized.toFixed(2));

          if (player.y >= 0) {
            player.y = 0;
            player.vy = 0;
            player.isJumping = false;
            player.jumpCount = 0;
            player.jumpProgress = 0;
            if (jumpBtn && jumpBtn.classList) {
              jumpBtn.classList.remove('is-active');
            }
            spawnFootParticles(4);
          }
        } else {
          player.y = 0;
          player.jumpProgress = 0;
          if (tick % 6 === 0) {
            spawnFootParticles(1);
          }
        }

        // 플레이어 숙이기 타이머 업데이트
        if (player.isDucking && !player.duckHold) {
          player.duckTimer -= 1;
          if (player.duckTimer <= 0) {
            player.isDucking = false;
            player.duckTimer = 0;
            if (duckBtn && duckBtn.classList) {
              duckBtn.classList.remove('is-active');
            }
          }
        }

        // 무적 타이머 및 말풍선 타이머 감소
        if (player.invincibleTimer > 0) {
          player.invincibleTimer -= 1;
        }
        if (player.bubbleTimer > 0) {
          player.bubbleTimer -= 1;
          if (player.bubbleTimer <= 0 && bubbleEl) {
            bubbleEl.style.display = 'none';
          }
        }

        // 스폰 처리
        if (tick >= nextObstacleTick) {
          spawnObstacle();
          nextObstacleTick = tick + Math.max(58, 95 - Math.floor(speed * 4));
        }
        if (tick >= nextItemTick) {
          spawnItem();
          nextItemTick = tick + 36 + Math.floor(Math.random() * 25);
        }

        // 아이템 이동 및 수집 판정
        var heroCenterY = GROUND_Y + player.y - (player.isDucking ? 18 : 34);
        for (var i = items.length - 1; i >= 0; i--) {
          var item = items[i];
          item.x -= speed;
          var dx = Math.abs(item.x - HERO_X);
          var dy = Math.abs(item.y - heroCenterY);

          if (!item.collected && dx < 38 && dy < 42) {
            item.collected = true;
            score += item.points;
            if (item.type === 'crown') {
              if (lives < maxLives) {
                lives += 1;
              }
              safeHelpers.playSfx('fanfare', 2);
              safeHelpers.createHeartExplosion(HERO_X, heroCenterY);
              showBubble('와아! 로열 왕관별! 💖+1', 55);
              floatingTexts.push({
                x: HERO_X,
                y: heroCenterY - 24,
                text: '+50점 👑하트회복!',
                color: '#FF8F00',
                life: 36
              });
            } else {
              safeHelpers.playSfx('coin', 1);
              floatingTexts.push({
                x: HERO_X,
                y: heroCenterY - 20,
                text: '+' + item.points + '점 ' + item.icon,
                color: '#D81B60',
                life: 28
              });
            }
            items.splice(i, 1);
            continue;
          }
          if (item.x < -50) {
            items.splice(i, 1);
          }
        }

        // 장애물 이동 및 충돌 판정
        var nearestUpcoming = null;
        for (var j = obstacles.length - 1; j >= 0; j--) {
          var obs = obstacles[j];
          obs.x -= speed;

          if (obs.x + obs.width >= HERO_X - 24 && (!nearestUpcoming || obs.x < nearestUpcoming.x)) {
            nearestUpcoming = obs;
          }

          var horizOverlap = Math.abs(obs.x - HERO_X) < 30;
          if (horizOverlap) {
            if (obs.kind === 'ground') {
              // 바닥 장애물은 점프 높이(|player.y| >= 36)로 회피
              var jumpedOver = Math.abs(player.y) >= 36;
              if (!jumpedOver) {
                handleObstacleHit(obs);
              }
            } else if (obs.kind === 'air') {
              // 공중 장애물은 납작 숙이기(isDucking === true && 낮은 위치)로 회피
              var duckedUnder = player.isDucking && Math.abs(player.y) < 25;
              if (!duckedUnder) {
                handleObstacleHit(obs);
              }
            }
          }

          if (!obs.passed && obs.x < HERO_X - 34) {
            obs.passed = true;
            score += 10;
          }

          if (obs.x < -70) {
            obstacles.splice(j, 1);
          }
        }

        // 상단 친절 안내 배지 업데이트
        if (guideBadgeEl) {
          if (nearestUpcoming && nearestUpcoming.x - HERO_X < 260) {
            guideBadgeEl.textContent = nearestUpcoming.badge + ' (' + nearestUpcoming.icon + ' ' + nearestUpcoming.name + ')';
            if (guideBadgeEl.classList) guideBadgeEl.classList.add('is-alert');
          } else {
            guideBadgeEl.textContent = '🌈 ' + ctxChar.seasonEmoji + ' 보석을 모으며 달려요!';
            if (guideBadgeEl.classList) guideBadgeEl.classList.remove('is-alert');
          }
        }

        // 파티클 및 플로팅 텍스트 업데이트
        for (var p = particles.length - 1; p >= 0; p--) {
          var pt = particles[p];
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.alpha -= 0.04;
          if (pt.alpha <= 0) {
            particles.splice(p, 1);
          }
        }
        for (var f = floatingTexts.length - 1; f >= 0; f--) {
          var ft = floatingTexts[f];
          ft.y -= 1.1;
          ft.life -= 1;
          if (ft.life <= 0) {
            floatingTexts.splice(f, 1);
          }
        }

        applyPuppetTransform();
        updateHud();
        renderCanvas();

        return getState();
      }

      function renderCanvas() {
        if (!canvasCtx) return;
        try {
          canvasCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

          // 배경 구름
          canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.78)';
          for (var c = 0; c < clouds.length; c++) {
            var cl = clouds[c];
            cl.x -= cl.speed;
            if (cl.x < -60) cl.x = CANVAS_W + 50;
            canvasCtx.beginPath();
            canvasCtx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
            canvasCtx.arc(cl.x + cl.r * 0.75, cl.y + 4, cl.r * 0.8, 0, Math.PI * 2);
            canvasCtx.fill();
          }

          // 파스텔 무지개 구름길 바닥
          var rainbowColors = ['#FFCDD2', '#FFE0B2', '#FFF9C4', '#C8E6C9', '#B3E5FC', '#E1BEE7'];
          for (var r = 0; r < rainbowColors.length; r++) {
            canvasCtx.fillStyle = rainbowColors[r];
            canvasCtx.fillRect(0, GROUND_Y + r * 6, CANVAS_W, 6);
          }

          // 몽글몽글 구름 바닥 장식
          canvasCtx.fillStyle = '#FFFFFF';
          var cloudOffset = (tick * speed * 0.6) % 48;
          for (var gx = -48; gx < CANVAS_W + 48; gx += 48) {
            canvasCtx.beginPath();
            canvasCtx.arc(gx - cloudOffset, GROUND_Y + 4, 20, 0, Math.PI * 2);
            canvasCtx.fill();
          }

          // 발밑 반짝이 먼지 파티클
          for (var p = 0; p < particles.length; p++) {
            var pt = particles[p];
            canvasCtx.save();
            canvasCtx.globalAlpha = Math.max(0, pt.alpha);
            if (pt.emoji) {
              canvasCtx.font = '14px sans-serif';
              canvasCtx.fillText(pt.emoji, pt.x, pt.y);
            } else {
              canvasCtx.fillStyle = pt.color;
              canvasCtx.beginPath();
              canvasCtx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
              canvasCtx.fill();
            }
            canvasCtx.restore();
          }

          // 보석/간식 아이템 렌더링
          canvasCtx.textAlign = 'center';
          canvasCtx.textBaseline = 'middle';
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var bob = Math.sin((tick + i * 10) * 0.15) * 4;
            canvasCtx.font = '26px sans-serif';
            canvasCtx.fillText(item.icon, item.x, item.y + bob);
          }

          // 장애물 + 친절한 안내 배지(⬆️점프! / ⬇️숙이기!) 렌더링
          for (var j = 0; j < obstacles.length; j++) {
            var obs = obstacles[j];
            canvasCtx.font = '34px sans-serif';
            canvasCtx.fillText(obs.icon, obs.x, obs.y);

            // 안내 배지 캡슐
            var badgeY = obs.y - 34;
            canvasCtx.fillStyle = obs.kind === 'ground' ? '#FF4081' : '#7B1FA2';
            canvasCtx.fillRect(obs.x - 34, badgeY - 12, 68, 22);
            canvasCtx.fillStyle = '#FFFFFF';
            canvasCtx.font = 'bold 12px sans-serif';
            canvasCtx.fillText(obs.badge, obs.x, badgeY);
          }

          // 플로팅 텍스트
          for (var f = 0; f < floatingTexts.length; f++) {
            var ft = floatingTexts[f];
            canvasCtx.fillStyle = ft.color;
            canvasCtx.font = 'bold 15px sans-serif';
            canvasCtx.fillText(ft.text, ft.x, ft.y);
          }
        } catch (err) {
          // 캔버스 모킹 환경 안전 무시
        }
      }

      function loop() {
        if (isGameOver || isCleanedUp) return;
        stepFrame();
        if (!isGameOver && !isCleanedUp && typeof requestAnimationFrame === 'function') {
          rafId = requestAnimationFrame(loop);
        }
      }

      function onKeyDown(e) {
        if (isGameOver || isCleanedUp) return;
        var key = e && (e.code || e.key);
        if (key === 'Space' || key === ' ' || key === 'ArrowUp') {
          if (e.preventDefault) e.preventDefault();
          jump();
        } else if (key === 'ArrowDown') {
          if (e.preventDefault) e.preventDefault();
          duck(true);
        }
      }

      function onKeyUp(e) {
        if (isGameOver || isCleanedUp) return;
        var key = e && (e.code || e.key);
        if (key === 'ArrowDown') {
          duck(false);
        }
      }

      function onJumpButtonClick(e) {
        if (e && e.preventDefault) e.preventDefault();
        jump();
      }

      function onDuckPointerDown(e) {
        if (e && e.preventDefault) e.preventDefault();
        tapDuck();
      }

      if (jumpBtn && jumpBtn.addEventListener) {
        jumpBtn.addEventListener('click', onJumpButtonClick);
      }
      if (duckBtn && duckBtn.addEventListener) {
        duckBtn.addEventListener('click', onDuckPointerDown);
        duckBtn.addEventListener('pointerdown', onDuckPointerDown);
      }
      if (global.addEventListener) {
        global.addEventListener('keydown', onKeyDown);
        global.addEventListener('keyup', onKeyUp);
      }

      function getState() {
        return {
          score: score,
          highScore: Math.max(highScore, score),
          lives: lives,
          maxLives: maxLives,
          tick: tick,
          speed: speed,
          isJumping: player.isJumping,
          isDucking: player.isDucking,
          isHit: player.invincibleTimer > 0,
          invincibleTimer: player.invincibleTimer,
          jumpCount: player.jumpCount,
          jumpProgress: player.jumpProgress,
          y: player.y,
          yOffset: player.y,
          obstacles: obstacles.slice(),
          items: items.slice(),
          isGameOver: isGameOver,
          isCleanedUp: isCleanedUp
        };
      }

      // 테스트 훅 노출
      stageEl._tpRunnerGame = {
        jump: jump,
        duck: duck,
        stepFrame: stepFrame,
        getState: getState,
        spawnObstacle: spawnObstacle,
        spawnItem: spawnItem
      };

      applyPuppetTransform();
      updateHud();
      renderCanvas();

      if (typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(loop);
      }

      return function cleanup() {
        isCleanedUp = true;
        isGameOver = true;
        if (rafId != null && typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        if (jumpBtn && jumpBtn.removeEventListener) {
          jumpBtn.removeEventListener('click', onJumpButtonClick);
        }
        if (duckBtn && duckBtn.removeEventListener) {
          duckBtn.removeEventListener('click', onDuckPointerDown);
          duckBtn.removeEventListener('pointerdown', onDuckPointerDown);
        }
        if (global.removeEventListener) {
          global.removeEventListener('keydown', onKeyDown);
          global.removeEventListener('keyup', onKeyUp);
        }
      };
    }
  };

  if (global.TpMiniGames && typeof global.TpMiniGames.register === 'function') {
    global.TpMiniGames.register(gameDef.id, gameDef);
  }
  global.TpGameRunner = gameDef;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameDef;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
