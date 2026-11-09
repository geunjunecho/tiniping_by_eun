/**
 * 티니핑 미니게임 T5: 샤랄라! 마법 판 뒤집기! (tp-flipbattle.js)
 * 6~7세 아이들을 위한 유치원 운동회 스타일 4x4 마법 보석 판 뒤집기 대결 놀이
 */
(function (global) {
  'use strict';

  var GAME_ID = 'flipbattle';
  var TOTAL_TILES = 16;
  var GRID_SIZE = 4;
  var INITIAL_TIME_SEC = 25;
  var VILLAIN_INTERVAL_MS = 1150;
  var WAND_SPAWN_INTERVAL_MS = 4200;
  var SOLFEGE_NAMES = ['도', '레', '미', '파', '솔', '라', '시', '높은 도'];

  function injectFlipBattleStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById('tp-flipbattle-inline-styles')) return;

    var styleEl = document.createElement('style');
    styleEl.id = 'tp-flipbattle-inline-styles';
    styleEl.textContent = [
      '.tp-flipbattle-wrap {',
      '  position: relative; width: 100%; height: 100%; min-height: 440px;',
      '  display: flex; flex-direction: column; justify-content: space-between;',
      '  background: linear-gradient(180deg, #FDF2F8 0%, #F3E8FF 55%, #FEF3C7 100%);',
      '  border-radius: 22px; padding: 12px 14px; box-sizing: border-box;',
      '  user-select: none; -webkit-user-select: none; touch-action: none;',
      '  font-family: "Jua", "Pretendard", "Malgun Gothic", sans-serif;',
      '}'
    ].join('\n');
    document.head.appendChild(styleEl);
  }

  function safeRenderAvatar(helpers, tp, sizeClass) {
    if (helpers && typeof helpers.renderAvatarHtml === 'function') {
      try {
        var html = helpers.renderAvatarHtml(tp, sizeClass || 'tp-mg-avatar-sm');
        if (html) return html;
      } catch (_e) {
        // fallback below
      }
    }
    var name = (tp && tp.name) ? tp.name : '하츄핑';
    var img = (tp && tp.image) ? tp.image : '';
    var emoji = (tp && tp.seasonEmoji) ? tp.seasonEmoji : '💖';
    if (img) {
      return '<img src="' + img + '" alt="' + name + '" style="width:38px;height:38px;object-fit:contain;pointer-events:none;" />';
    }
    return '<span style="font-size:26px;line-height:1;">' + emoji + '</span>';
  }

  var gameDef = {
    id: GAME_ID,
    title: '샤랄라! 마법 판 뒤집기!',
    subtitle: '악동핑보다 먼저 카드를 내 티니핑 빛깔로 뒤집어요!',
    icon: '⚡',
    badge: '스피드 판 뒤집기',
    badgeColor: '#EC4899',

    mount: function (stageEl, charCtx, helpers) {
      if (!stageEl) {
        return function () {};
      }

      injectFlipBattleStyles();

      var ctx = Object.assign({
        name: '하츄핑',
        nameEn: 'Heartsping',
        image: '',
        color: '#EC4899',
        grade: '로열',
        emotion: '사랑',
        gender: '여',
        mainSeason: 1,
        seasonTheme: '큐브',
        seasonEmoji: '💖'
      }, charCtx || {});

      var h = Object.assign({
        playSfx: function () {},
        playCry: function () {},
        computeRunTransform: function () { return ''; },
        getHighScore: function () { return 0; },
        saveHighScore: function () {},
        rewardCharacter: function () {},
        createHeartExplosion: function () {},
        renderAvatarHtml: null,
        showResultOverlay: function () {}
      }, helpers || {});

      var state = {
        score: 0,
        highScore: Number(h.getHighScore(GAME_ID)) || 0,
        timeLeft: INITIAL_TIME_SEC,
        comboCount: 0,
        maxCombo: 0,
        heroCount: 8,
        villainCount: 8,
        magicWandCount: 0,
        isPointerDown: false,
        isGameOver: false,
        bannerMessage: '⚡ 보라색 심술핑 카드를 터치하거나 손가락으로 쓱~ 문질러 뒤집어요!'
      };

      // 4x4 (16장) 초기 보드 생성: 8장 hero, 8장 villain (체커보드 교차 배치로 0번은 villain)
      var tiles = [];
      for (var i = 0; i < TOTAL_TILES; i++) {
        var r = Math.floor(i / GRID_SIZE);
        var c = i % GRID_SIZE;
        var isHeroStart = (r + c) % 2 === 1;
        tiles.push({
          index: i,
          owner: isHeroStart ? 'hero' : 'villain',
          hasMagicWand: i === 5, // 시작 시 5번 타일에 첫 로열 마법봉 배지 반짝!
          flipCount: 0,
          justFlipped: false,
          el: null
        });
      }

      var villainTimerId = null;
      var secondTimerId = null;
      var wandTimerId = null;
      var docPointerUpHandler = null;

      stageEl.innerHTML = [
        '<div class="tp-flipbattle-wrap" data-role="wrap" style="--hero-color: ' + (ctx.color || '#EC4899') + ';">',
        '  <div class="tp-flipbattle-hud">',
        '    <div class="tp-flipbattle-top-row">',
        '      <div class="tp-flipbattle-timer-pill" data-role="timer">⏰ 25초</div>',
        '      <div class="tp-flipbattle-score-pill" data-role="score">💖 0점</div>',
        '      <button type="button" class="tp-flipbattle-finish-btn" data-role="finish-btn">🏁 지금 결과 보기!</button>',
        '    </div>',
        '    <div class="tp-flipbattle-tug">',
        '      <div class="tp-flipbattle-tug-labels">',
        '        <span class="tp-tug-hero-label" data-role="hero-label">💖 ' + ctx.name + ' 8장</span>',
        '        <span class="tp-tug-vs">⚡ 줄다리기 대결 ⚡</span>',
        '        <span class="tp-tug-villain-label" data-role="villain-label">😈 심술핑 8장</span>',
        '      </div>',
        '      <div class="tp-flipbattle-tug-bar">',
        '        <div class="tp-flipbattle-tug-fill-hero" data-role="tug-fill" style="width: 50%;"></div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div class="tp-flipbattle-banner" data-role="banner">' + state.bannerMessage + '</div>',
        '  <div class="tp-flipbattle-grid" data-role="grid"></div>',
        '</div>'
      ].join('');

      var timerEl = stageEl.querySelector ? stageEl.querySelector('[data-role="timer"]') : null;
      var scoreEl = stageEl.querySelector ? stageEl.querySelector('[data-role="score"]') : null;
      var heroLabelEl = stageEl.querySelector ? stageEl.querySelector('[data-role="hero-label"]') : null;
      var villainLabelEl = stageEl.querySelector ? stageEl.querySelector('[data-role="villain-label"]') : null;
      var tugFillEl = stageEl.querySelector ? stageEl.querySelector('[data-role="tug-fill"]') : null;
      var bannerEl = stageEl.querySelector ? stageEl.querySelector('[data-role="banner"]') : null;
      var gridEl = stageEl.querySelector ? stageEl.querySelector('[data-role="grid"]') : null;
      var finishBtnEl = stageEl.querySelector ? stageEl.querySelector('[data-role="finish-btn"]') : null;

      function recountTiles() {
        var hCnt = 0;
        var vCnt = 0;
        for (var idx = 0; idx < tiles.length; idx++) {
          if (tiles[idx].owner === 'hero') hCnt += 1;
          else vCnt += 1;
        }
        state.heroCount = hCnt;
        state.villainCount = vCnt;
      }

      function updateHud() {
        recountTiles();
        if (timerEl) {
          timerEl.textContent = '⏰ ' + state.timeLeft + '초';
        }
        if (scoreEl) {
          scoreEl.textContent = '💖 ' + state.score + '점';
        }
        if (heroLabelEl) {
          heroLabelEl.textContent = '💖 ' + ctx.name + ' ' + state.heroCount + '장';
        }
        if (villainLabelEl) {
          villainLabelEl.textContent = '😈 심술핑 ' + state.villainCount + '장';
        }
        if (tugFillEl && tugFillEl.style) {
          var heroPct = Math.round((state.heroCount / TOTAL_TILES) * 100);
          tugFillEl.style.width = heroPct + '%';
        }
        if (bannerEl) {
          bannerEl.textContent = state.bannerMessage;
        }
      }

      function buildTileInnerHtml(tile) {
        var wandBadge = tile.hasMagicWand
          ? '<span class="tp-flipbattle-wand-badge" data-role="wand-badge">👑 로열 마법봉!</span>'
          : '';
        if (tile.owner === 'hero') {
          return (
            wandBadge +
            '<div class="tp-flipbattle-tile-inner tp-tile-hero">' +
            '  <div class="tp-flipbattle-avatar-wrap">' + safeRenderAvatar(h, ctx, 'tp-mg-avatar-sm') + '</div>' +
            '  <span class="tp-flipbattle-tile-name">💖 ' + ctx.name + '</span>' +
            '</div>'
          );
        }
        return (
          wandBadge +
          '<div class="tp-flipbattle-tile-inner tp-tile-villain">' +
          '  <span class="tp-flipbattle-villain-icon">😈☁️</span>' +
          '  <span class="tp-flipbattle-tile-name">심술핑</span>' +
          '</div>'
        );
      }

      function updateSingleTileDom(tile) {
        if (!tile || !tile.el) return;
        var cls = ['tp-flipbattle-tile'];
        cls.push(tile.owner === 'hero' ? 'is-hero' : 'is-villain');
        if (tile.hasMagicWand) cls.push('has-magic-wand');
        if (tile.justFlipped) cls.push('is-flipping');
        tile.el.className = cls.join(' ');
        tile.el.setAttribute('data-owner', tile.owner);
        tile.el.setAttribute('data-wand', tile.hasMagicWand ? 'true' : 'false');
        tile.el.innerHTML = buildTileInnerHtml(tile);
      }

      function renderBoard() {
        updateHud();
        if (!gridEl) return;
        gridEl.innerHTML = '';

        for (var i = 0; i < tiles.length; i++) {
          (function (tile) {
            if (typeof document === 'undefined' || !document.createElement) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('data-tile-index', String(tile.index));
            tile.el = btn;
            updateSingleTileDom(tile);

            if (btn.addEventListener) {
              btn.addEventListener('pointerdown', function (ev) {
                if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
                state.isPointerDown = true;
                handleUserTileInteract(tile.index);
              });
              btn.addEventListener('pointerenter', function () {
                if (!state.isPointerDown) return;
                handleUserTileSwipe(tile.index);
              });
              btn.addEventListener('click', function () {
                // pointerdown에서 이미 뒤집힌 경우 중복 점수 방지
                if (tile.hasMagicWand) {
                  triggerMagicWand(tile.index);
                } else if (tile.owner !== 'hero') {
                  flipTile(tile.index);
                }
              });
            }

            if (gridEl.appendChild) {
              gridEl.appendChild(btn);
            }
          })(tiles[i]);
        }
      }

      function handleUserTileInteract(index) {
        if (state.isGameOver) return;
        var tile = tiles[index];
        if (!tile) return;
        if (tile.hasMagicWand) {
          triggerMagicWand(index);
        } else {
          flipTile(index);
        }
      }

      function handleUserTileSwipe(index) {
        if (state.isGameOver) return;
        var tile = tiles[index];
        if (!tile) return;
        if (tile.hasMagicWand) {
          triggerMagicWand(index);
        } else if (tile.owner !== 'hero') {
          flipTile(index);
        }
      }

      function flipTile(index) {
        if (state.isGameOver) return false;

        var targetIdx = index;
        if (targetIdx === undefined || targetIdx === null) {
          targetIdx = -1;
          for (var i = 0; i < tiles.length; i++) {
            if (tiles[i].owner === 'villain') {
              targetIdx = i;
              break;
            }
          }
          if (targetIdx === -1) targetIdx = 0;
        }

        var idx = Number(targetIdx);
        if (isNaN(idx) || idx < 0 || idx >= tiles.length) return false;

        var tile = tiles[idx];
        if (!tile) return false;

        tile.owner = 'hero';
        tile.flipCount += 1;
        tile.justFlipped = true;

        state.score += 15;
        state.comboCount += 1;
        if (state.comboCount > state.maxCombo) {
          state.maxCombo = state.comboCount;
        }

        var noteIdx = (state.comboCount - 1) % SOLFEGE_NAMES.length;
        var solfege = SOLFEGE_NAMES[noteIdx];
        h.playSfx('note', noteIdx);

        state.bannerMessage = '💖 샤랄라 뒤집기! +15점 (🎵' + solfege + ' · ' + state.comboCount + '연속!)';
        updateSingleTileDom(tile);
        updateHud();
        return true;
      }

      function triggerMagicWand(index) {
        if (state.isGameOver) return [];

        var targetIdx = index;
        if (targetIdx === undefined || targetIdx === null) {
          targetIdx = -1;
          for (var w = 0; w < tiles.length; w++) {
            if (tiles[w].hasMagicWand) {
              targetIdx = w;
              break;
            }
          }
          if (targetIdx === -1) targetIdx = 5;
        }

        var idx = Number(targetIdx);
        if (isNaN(idx) || idx < 0 || idx >= tiles.length) return [];

        var centerRow = Math.floor(idx / GRID_SIZE);
        var centerCol = idx % GRID_SIZE;
        var affectedIndices = [];

        for (var i = 0; i < tiles.length; i++) {
          var r = Math.floor(i / GRID_SIZE);
          var c = i % GRID_SIZE;
          tiles[i].hasMagicWand = false;
          if (r === centerRow || c === centerCol) {
            tiles[i].owner = 'hero';
            tiles[i].flipCount += 1;
            tiles[i].justFlipped = true;
            affectedIndices.push(i);
          }
          updateSingleTileDom(tiles[i]);
        }

        state.score += 80;
        state.magicWandCount += 1;
        state.comboCount += 1;
        if (state.comboCount > state.maxCombo) {
          state.maxCombo = state.comboCount;
        }

        h.playSfx('sparkle');
        h.playSfx('note', (state.comboCount - 1) % SOLFEGE_NAMES.length);
        h.createHeartExplosion(50, 50);

        state.bannerMessage = '👑 로열 마법봉 십자(+) 대폭발!! 가로·세로 줄 변신! (+80점 보너스!)';
        updateHud();
        return affectedIndices;
      }

      function villainFlip(forcedIndex) {
        if (state.isGameOver) return -1;

        var targetTile = null;
        if (forcedIndex !== undefined && forcedIndex !== null) {
          var fIdx = Number(forcedIndex);
          if (!isNaN(fIdx) && fIdx >= 0 && fIdx < tiles.length) {
            targetTile = tiles[fIdx];
          }
        }

        if (!targetTile) {
          var heroTiles = [];
          for (var i = 0; i < tiles.length; i++) {
            if (tiles[i].owner === 'hero' && !tiles[i].hasMagicWand) {
              heroTiles.push(tiles[i]);
            }
          }
          if (heroTiles.length === 0) {
            for (var j = 0; j < tiles.length; j++) {
              if (tiles[j].owner === 'hero') {
                heroTiles.push(tiles[j]);
              }
            }
          }
          if (heroTiles.length === 0) return -1;
          targetTile = heroTiles[Math.floor(Math.random() * heroTiles.length)];
        }

        targetTile.owner = 'villain';
        targetTile.justFlipped = true;
        updateSingleTileDom(targetTile);

        state.bannerMessage = '😈 앗! 심술핑이 카드를 보라색 먹구름으로 뒤집었어요! 다시 뒤집어봐요!';
        updateHud();
        return targetTile.index;
      }

      function spawnMagicWand(forcedIndex) {
        if (state.isGameOver) return -1;

        for (var i = 0; i < tiles.length; i++) {
          if (tiles[i].hasMagicWand) return tiles[i].index;
        }

        var idx = (forcedIndex !== undefined && forcedIndex !== null)
          ? Number(forcedIndex)
          : Math.floor(Math.random() * tiles.length);
        if (isNaN(idx) || idx < 0 || idx >= tiles.length) idx = 5;

        tiles[idx].hasMagicWand = true;
        updateSingleTileDom(tiles[idx]);
        state.bannerMessage = '👑 반짝반짝! 보드에 [로열 마법봉]이 나타났어요! 터치해보세요!';
        updateHud();
        return idx;
      }

      function stepSecond() {
        if (state.isGameOver) return state.timeLeft;
        state.timeLeft = Math.max(0, state.timeLeft - 1);
        if (state.timeLeft > 0 && state.timeLeft % 5 === 0) {
          spawnMagicWand();
        }
        updateHud();
        if (state.timeLeft <= 0) {
          finishGame('time_up');
        }
        return state.timeLeft;
      }

      function stopAllTimers() {
        if (villainTimerId) {
          clearInterval(villainTimerId);
          villainTimerId = null;
        }
        if (secondTimerId) {
          clearInterval(secondTimerId);
          secondTimerId = null;
        }
        if (wandTimerId) {
          clearInterval(wandTimerId);
          wandTimerId = null;
        }
      }

      function finishGame(reason) {
        if (state.isGameOver) return;
        state.isGameOver = true;
        state.isPointerDown = false;
        stopAllTimers();
        recountTiles();

        var isHeroWin = state.heroCount > state.villainCount;
        var bonusScore = isHeroWin ? 100 : 50;
        state.score += bonusScore;

        var resultMessage = isHeroWin
          ? '🎉 샤랄라 대승리! 마법 판을 사랑으로 가득 채웠어요~ 츄! (+100점 승리 보너스)'
          : '💖 우와~ 손가락이 번개처럼 빨랐어요! 참 잘했어요~ (+50점 격려 보너스)';

        state.bannerMessage = resultMessage;
        updateHud();

        if (state.score > state.highScore) {
          state.highScore = state.score;
        }
        h.saveHighScore(GAME_ID, state.score);
        h.rewardCharacter();

        h.showResultOverlay(stageEl, {
          gameId: GAME_ID,
          title: isHeroWin ? '샤랄라 마법 판 뒤집기 대승리! ⚡💖' : '샤랄라 마법 판 뒤집기 완료! 💖',
          score: state.score,
          highScore: state.highScore,
          stars: isHeroWin ? 3 : 2,
          message: resultMessage,
          summary: resultMessage,
          reason: reason || 'finished',
          charCtx: ctx,
          onRestart: function () {
            cleanup();
            gameDef.mount(stageEl, charCtx, helpers);
          }
        });
      }

      if (finishBtnEl && finishBtnEl.addEventListener) {
        finishBtnEl.addEventListener('click', function () {
          finishGame('user_finish');
        });
      }

      if (gridEl && gridEl.addEventListener) {
        gridEl.addEventListener('pointermove', function (ev) {
          if (!state.isPointerDown || state.isGameOver) return;
          if (!ev || typeof document === 'undefined' || typeof document.elementFromPoint !== 'function') return;
          if (typeof ev.clientX !== 'number' || typeof ev.clientY !== 'number') return;
          var hitEl = document.elementFromPoint(ev.clientX, ev.clientY);
          while (hitEl && hitEl !== gridEl) {
            if (hitEl.getAttribute && hitEl.getAttribute('data-tile-index') !== null) {
              var hitIdx = Number(hitEl.getAttribute('data-tile-index'));
              if (!isNaN(hitIdx)) {
                handleUserTileSwipe(hitIdx);
              }
              break;
            }
            hitEl = hitEl.parentNode;
          }
        });
      }

      docPointerUpHandler = function () {
        state.isPointerDown = false;
      };
      if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('pointerup', docPointerUpHandler);
        document.addEventListener('pointercancel', docPointerUpHandler);
      }

      renderBoard();

      villainTimerId = setInterval(function () {
        villainFlip();
      }, VILLAIN_INTERVAL_MS);

      secondTimerId = setInterval(function () {
        stepSecond();
      }, 1000);

      wandTimerId = setInterval(function () {
        spawnMagicWand();
      }, WAND_SPAWN_INTERVAL_MS);

      var api = {
        flipTile: flipTile,
        villainFlip: villainFlip,
        triggerMagicWand: triggerMagicWand,
        spawnMagicWand: spawnMagicWand,
        stepSecond: stepSecond,
        finishGame: finishGame,
        getState: function () {
          recountTiles();
          var wandIdx = -1;
          for (var i = 0; i < tiles.length; i++) {
            if (tiles[i].hasMagicWand) {
              wandIdx = i;
              break;
            }
          }
          return {
            score: state.score,
            highScore: state.highScore,
            timeLeft: state.timeLeft,
            combo: state.comboCount,
            comboCount: state.comboCount,
            maxCombo: state.maxCombo,
            heroCount: state.heroCount,
            villainCount: state.villainCount,
            magicWandIndex: wandIdx,
            magicWandCount: state.magicWandCount,
            isGameOver: state.isGameOver,
            bannerMessage: state.bannerMessage,
            lastMessage: state.bannerMessage,
            tiles: tiles.map(function (t) {
              return {
                index: t.index,
                owner: t.owner,
                hasMagicWand: t.hasMagicWand,
                flipCount: t.flipCount
              };
            })
          };
        }
      };

      stageEl._tpFlipBattleGame = api;

      function cleanup() {
        state.isGameOver = true;
        state.isPointerDown = false;
        stopAllTimers();
        if (typeof document !== 'undefined' && document.removeEventListener && docPointerUpHandler) {
          document.removeEventListener('pointerup', docPointerUpHandler);
          document.removeEventListener('pointercancel', docPointerUpHandler);
          docPointerUpHandler = null;
        }
        if (stageEl._tpFlipBattleGame === api) {
          delete stageEl._tpFlipBattleGame;
        }
      }

      return cleanup;
    }
  };

  global.TpGameFlipBattle = gameDef;
  if (global.TpMiniGames && typeof global.TpMiniGames.register === 'function') {
    global.TpMiniGames.register(gameDef.id, gameDef);
  }
})(typeof window !== 'undefined' ? window : globalThis);
