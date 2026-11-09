/**
 * 티니핑 미니게임 T4: 숨바꼭질! 내 티니핑 짝꿍 찾기 (tp-memory.js)
 * 6~7세 아이들을 위한 2.5초 앞면 미리보기 + 마법 힌트 카드 짝맞추기 놀이
 */
(function (global) {
  'use strict';

  var GAME_ID = 'memory';
  var PREVIEW_DURATION_MS = 2500;
  var MISMATCH_HOLD_MS = 800;
  var HINT_DURATION_MS = 1500;

  var DEFAULT_FRIENDS = [
    { name: '방글핑', color: '#BA68C8', emotion: '기쁨', seasonEmoji: '✨' },
    { name: '조아핑', color: '#FFB74D', emotion: '친절', seasonEmoji: '💛' },
    { name: '믿어핑', color: '#4FC3F7', emotion: '믿음', seasonEmoji: '💙' },
    { name: '차차핑', color: '#81C784', emotion: '희망', seasonEmoji: '🍀' },
    { name: '라라핑', color: '#F06292', emotion: '노래', seasonEmoji: '🎵' },
    { name: '해피핑', color: '#FF8A65', emotion: '행복', seasonEmoji: '🌈' },
    { name: '샤샤핑', color: '#4DD0E1', emotion: '시원함', seasonEmoji: '🍦' },
    { name: '포실핑', color: '#F48FB1', emotion: '포근함', seasonEmoji: '☁️' }
  ];

  function injectMemoryStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById('tp-memory-game-styles')) return;

    var styleEl = document.createElement('style');
    styleEl.id = 'tp-memory-game-styles';
    styleEl.textContent = [
      '.tp-memory-wrap {',
      '  position: relative; width: 100%; height: 100%; min-height: 440px;',
      '  display: flex; flex-direction: column; justify-content: space-between;',
      '  background: linear-gradient(180deg, #FFF8E1 0%, #FCE4EC 60%, #F3E5F5 100%);',
      '  border-radius: 20px; padding: 12px; box-sizing: border-box;',
      '  user-select: none; -webkit-user-select: none;',
      '  font-family: "Pretendard", "Malgun Gothic", sans-serif;',
      '}',
      '.tp-memory-hud {',
      '  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;',
      '  gap: 8px; padding: 10px 14px; background: rgba(255, 255, 255, 0.9);',
      '  border-radius: 16px; border: 2px solid rgba(255, 167, 38, 0.35);',
      '  margin-bottom: 10px;',
      '}',
      '.tp-memory-info {',
      '  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;',
      '}',
      '.tp-memory-stage-badge {',
      '  background: #FFA726; color: #fff; font-weight: 900; font-size: 13px;',
      '  padding: 4px 10px; border-radius: 999px;',
      '}',
      '.tp-memory-score-badge {',
      '  background: #FCE4EC; color: #C2185B; font-weight: 900; font-size: 14px;',
      '  padding: 4px 12px; border-radius: 999px; border: 1.5px solid #F48FB1;',
      '}',
      '.tp-memory-pairs-badge {',
      '  background: #E8F5E9; color: #2E7D32; font-weight: 800; font-size: 13px;',
      '  padding: 4px 10px; border-radius: 999px; border: 1.5px solid #A5D6A7;',
      '}',
      '.tp-memory-hint-btn {',
      '  cursor: pointer; border: none; border-radius: 999px;',
      '  background: linear-gradient(135deg, #FFD54F, #FFA000);',
      '  color: #4E342E; font-weight: 900; font-size: 13px; padding: 7px 14px;',
      '  box-shadow: 0 3px 10px rgba(255, 160, 0, 0.35); transition: transform 0.15s;',
      '}',
      '.tp-memory-hint-btn:active { transform: scale(0.95); }',
      '.tp-memory-banner {',
      '  text-align: center; font-weight: 800; font-size: 14px; color: #6A1B9A;',
      '  background: rgba(255, 255, 255, 0.82); padding: 7px 12px; border-radius: 12px;',
      '  margin-bottom: 10px; border: 1.5px dashed #CE93D8;',
      '}',
      '.tp-memory-grid {',
      '  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;',
      '  flex: 1; align-content: center; max-width: 540px; width: 100%; margin: 0 auto;',
      '}',
      '.tp-memory-card {',
      '  position: relative; min-height: 92px; border-radius: 16px; cursor: pointer;',
      '  border: 3px solid #F8BBD0; background: linear-gradient(145deg, #FF80AB, #F06292);',
      '  display: flex; flex-direction: column; align-items: center; justify-content: center;',
      '  padding: 6px; box-sizing: border-box; transition: transform 0.2s, box-shadow 0.2s, background 0.2s;',
      '  box-shadow: 0 4px 10px rgba(233, 30, 99, 0.2); touch-action: manipulation;',
      '}',
      '.tp-memory-card.is-face-up {',
      '  background: #FFFFFF; border-color: #FFB74D;',
      '  box-shadow: 0 4px 12px rgba(255, 167, 38, 0.28);',
      '}',
      '.tp-memory-card.is-matched {',
      '  background: linear-gradient(145deg, #FFF0F5, #FCE4EC);',
      '  border-color: #FF4081;',
      '  box-shadow: 0 0 16px rgba(255, 64, 129, 0.55);',
      '}',
      '.tp-memory-card.is-hinting {',
      '  background: linear-gradient(145deg, #FFFDE7, #FFF59D);',
      '  border-color: #FFD600;',
      '  box-shadow: 0 0 20px rgba(255, 214, 0, 0.9);',
      '  animation: tpCardHintPulse 0.45s ease-in-out infinite alternate;',
      '}',
      '@keyframes tpCardHintPulse {',
      '  0% { transform: scale(1); }',
      '  100% { transform: scale(1.06); }',
      '}',
      '.tp-memory-card-back {',
      '  font-size: 28px; color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.15);',
      '}',
      '.tp-memory-card-name {',
      '  font-size: 12px; font-weight: 900; color: #37474F; margin-top: 4px;',
      '  text-align: center; word-break: keep-all;',
      '}',
      '.tp-memory-hero-tag {',
      '  font-size: 10px; font-weight: 800; color: #D81B60;',
      '  background: #FCE4EC; padding: 1px 5px; border-radius: 999px; margin-top: 2px;',
      '}'
    ].join('\n');
    document.head.appendChild(styleEl);
  }

  function safeRenderAvatar(helpers, tp, sizeClass) {
    if (helpers && typeof helpers.renderAvatarHtml === 'function') {
      try {
        var html = helpers.renderAvatarHtml(tp, sizeClass || 'sm');
        if (html) return html;
      } catch (_e) {
        // fallback below
      }
    }
    var name = (tp && tp.name) ? tp.name : '하츄핑';
    var img = (tp && tp.image) ? tp.image : '';
    var emoji = (tp && tp.seasonEmoji) ? tp.seasonEmoji : '💖';
    if (img) {
      return '<img src="' + img + '" alt="' + name + '" style="width:42px;height:42px;object-fit:contain;pointer-events:none;" />';
    }
    return '<span style="font-size:28px;line-height:1;">' + emoji + '</span>';
  }

  function shuffleArray(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  var gameDef = {
    id: GAME_ID,
    title: '숨바꼭질! 내 티니핑 짝꿍 찾기',
    subtitle: '같은 티니핑 친구 카드 두 장을 찾아봐요!',
    icon: '🃏',
    badgeColor: '#FFA726',

    mount: function (stageEl, charCtx, helpers) {
      if (!stageEl) {
        return function () {};
      }

      injectMemoryStyles();

      var ctx = Object.assign({
        name: '하츄핑',
        nameEn: 'Heartsping',
        image: '',
        color: '#FF80AB',
        grade: '로열',
        emotion: '사랑',
        gender: '여',
        mainSeason: 1,
        seasonTheme: '로열 티니핑',
        seasonEmoji: '💖',
        pool: DEFAULT_FRIENDS
      }, charCtx || {});

      var rawPool = Array.isArray(ctx.pool) ? ctx.pool : [];
      var uniqueFriends = [];
      var seenNames = {};
      seenNames[ctx.name] = true;

      for (var pIdx = 0; pIdx < rawPool.length; pIdx++) {
        var item = rawPool[pIdx];
        if (item && item.name && !seenNames[item.name]) {
          seenNames[item.name] = true;
          uniqueFriends.push(item);
        }
      }
      for (var dIdx = 0; dIdx < DEFAULT_FRIENDS.length; dIdx++) {
        var defItem = DEFAULT_FRIENDS[dIdx];
        if (!seenNames[defItem.name]) {
          seenNames[defItem.name] = true;
          uniqueFriends.push(defItem);
        }
      }

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
        stage: 1,
        score: 0,
        highScore: Number(h.getHighScore(GAME_ID)) || 0,
        matchedPairs: 0,
        totalPairs: 4,
        totalMatchedAllStages: 0,
        comboCount: 0,
        maxCombo: 0,
        hintCount: 0,
        isPreviewing: true,
        isGameOver: false,
        bannerMessage: '👀 잘 보고 기억해봐요~! ✨'
      };

      var cards = [];
      var flippedIndices = [];
      var previewTimerId = null;
      var mismatchTimerId = null;
      var hintTimerId = null;
      var stageTransitionTimerId = null;

      stageEl.innerHTML = [
        '<div class="tp-memory-wrap">',
        '  <div class="tp-memory-hud">',
        '    <div class="tp-memory-info">',
        '      <span class="tp-memory-stage-badge" data-role="stage-badge">1단계 (4쌍)</span>',
        '      <span class="tp-memory-pairs-badge" data-role="pairs-badge">0 / 4쌍 성공</span>',
        '      <span class="tp-memory-score-badge" data-role="score-badge">0점</span>',
        '    </div>',
        '    <button type="button" class="tp-memory-hint-btn" data-role="hint-btn">🔮 마법 힌트 보기!</button>',
        '  </div>',
        '  <div class="tp-memory-banner" data-role="banner">👀 잘 보고 기억해봐요~! ✨</div>',
        '  <div class="tp-memory-grid" data-role="grid"></div>',
        '</div>'
      ].join('');

      var stageBadgeEl = stageEl.querySelector ? stageEl.querySelector('[data-role="stage-badge"]') : null;
      var pairsBadgeEl = stageEl.querySelector ? stageEl.querySelector('[data-role="pairs-badge"]') : null;
      var scoreBadgeEl = stageEl.querySelector ? stageEl.querySelector('[data-role="score-badge"]') : null;
      var bannerEl = stageEl.querySelector ? stageEl.querySelector('[data-role="banner"]') : null;
      var gridEl = stageEl.querySelector ? stageEl.querySelector('[data-role="grid"]') : null;
      var hintBtnEl = stageEl.querySelector ? stageEl.querySelector('[data-role="hint-btn"]') : null;

      function clearAllTimers() {
        if (previewTimerId) {
          clearTimeout(previewTimerId);
          previewTimerId = null;
        }
        if (mismatchTimerId) {
          clearTimeout(mismatchTimerId);
          mismatchTimerId = null;
        }
        if (hintTimerId) {
          clearTimeout(hintTimerId);
          hintTimerId = null;
        }
        if (stageTransitionTimerId) {
          clearTimeout(stageTransitionTimerId);
          stageTransitionTimerId = null;
        }
      }

      function buildStageDeck(stageNum) {
        var pairCount = stageNum === 1 ? 4 : 6;
        var friendCount = pairCount - 1;
        var pickedFriends = shuffleArray(uniqueFriends).slice(0, friendCount);

        // 첫 번째 쌍은 반드시 내가 고른 주인공 티니핑(charCtx)
        var chosenChars = [
          Object.assign({}, ctx, { isHero: true, charKey: 'hero:' + ctx.name })
        ];
        for (var i = 0; i < pickedFriends.length; i++) {
          var f = pickedFriends[i];
          chosenChars.push(Object.assign({}, f, { isHero: false, charKey: 'friend:' + f.name }));
        }

        var rawDeck = [];
        for (var c = 0; c < chosenChars.length; c++) {
          var ch = chosenChars[c];
          rawDeck.push({
            charKey: ch.charKey,
            name: ch.name,
            image: ch.image || '',
            seasonEmoji: ch.seasonEmoji || '💖',
            color: ch.color || '#FF80AB',
            isHero: Boolean(ch.isHero),
            charObj: ch
          });
          rawDeck.push({
            charKey: ch.charKey,
            name: ch.name,
            image: ch.image || '',
            seasonEmoji: ch.seasonEmoji || '💖',
            color: ch.color || '#FF80AB',
            isHero: Boolean(ch.isHero),
            charObj: ch
          });
        }

        var shuffled = shuffleArray(rawDeck);
        return shuffled.map(function (item, idx) {
          return {
            index: idx,
            charKey: item.charKey,
            name: item.name,
            image: item.image,
            seasonEmoji: item.seasonEmoji,
            color: item.color,
            isHero: item.isHero,
            charObj: item.charObj,
            isFlipped: true, // 시작 전 2.5초 앞면 미리보기
            isMatched: false,
            isHinting: false,
            el: null
          };
        });
      }

      function updateHud() {
        if (stageBadgeEl) {
          stageBadgeEl.textContent = state.stage + '단계 (' + state.totalPairs + '쌍)';
        }
        if (pairsBadgeEl) {
          pairsBadgeEl.textContent = state.matchedPairs + ' / ' + state.totalPairs + '쌍 성공';
        }
        if (scoreBadgeEl) {
          scoreBadgeEl.textContent = state.score + '점';
        }
        if (bannerEl) {
          bannerEl.textContent = state.bannerMessage;
        }
      }

      function renderCards() {
        updateHud();
        if (!gridEl) return;

        gridEl.innerHTML = '';
        for (var i = 0; i < cards.length; i++) {
          (function (card) {
            if (typeof document === 'undefined' || !document.createElement) return;
            var cardBtn = document.createElement('button');
            cardBtn.type = 'button';
            var showFace = state.isPreviewing || card.isFlipped || card.isMatched || card.isHinting;
            var classes = ['tp-memory-card'];
            if (showFace) classes.push('is-face-up');
            if (card.isMatched) classes.push('is-matched');
            if (card.isHinting) classes.push('is-hinting');
            cardBtn.className = classes.join(' ');
            cardBtn.setAttribute('data-card-index', String(card.index));
            cardBtn.setAttribute('data-char-name', card.name);

            if (showFace) {
              var heroBadge = card.isHero ? '<span class="tp-memory-hero-tag">👑 내 짝꿍</span>' : '';
              cardBtn.innerHTML =
                safeRenderAvatar(h, card.charObj, 'sm') +
                '<span class="tp-memory-card-name">' + card.name + '</span>' +
                heroBadge;
            } else {
              cardBtn.innerHTML = '<span class="tp-memory-card-back">💖</span>';
            }

            if (cardBtn.addEventListener) {
              cardBtn.addEventListener('click', function () {
                flipCard(card.index);
              });
            }

            card.el = cardBtn;
            if (gridEl.appendChild) {
              gridEl.appendChild(cardBtn);
            }
          })(cards[i]);
        }
      }

      function skipPreview() {
        if (previewTimerId) {
          clearTimeout(previewTimerId);
          previewTimerId = null;
        }
        if (!state.isPreviewing) return;

        state.isPreviewing = false;
        for (var i = 0; i < cards.length; i++) {
          if (!cards[i].isMatched) {
            cards[i].isFlipped = false;
          }
        }
        flippedIndices = [];
        state.bannerMessage = '카드를 두 장씩 뒤집어 같은 티니핑 짝꿍을 찾아봐요! 🃏';
        renderCards();
      }

      function startStage(stageNum) {
        clearAllTimers();
        state.stage = stageNum;
        state.totalPairs = stageNum === 1 ? 4 : 6;
        state.matchedPairs = 0;
        state.isPreviewing = true;
        state.bannerMessage = '👀 ' + stageNum + '단계 시작! 잘 보고 기억해봐요~! ✨';
        flippedIndices = [];
        cards = buildStageDeck(stageNum);
        renderCards();

        previewTimerId = setTimeout(function () {
          previewTimerId = null;
          skipPreview();
        }, PREVIEW_DURATION_MS);
      }

      function resolvePendingMismatchImmediately() {
        if (!mismatchTimerId) return;
        clearTimeout(mismatchTimerId);
        mismatchTimerId = null;
        for (var i = 0; i < flippedIndices.length; i++) {
          var idx = flippedIndices[i];
          if (cards[idx] && !cards[idx].isMatched) {
            cards[idx].isFlipped = false;
          }
        }
        flippedIndices = [];
      }

      function flipCard(index) {
        if (state.isGameOver) return false;

        // 미리보기 중 호출되면 즉시 미리보기를 건너뛰고 뒤집기 진행
        if (state.isPreviewing) {
          skipPreview();
        }

        // 불일치 카드가 0.8초 대기 중일 때 새 카드를 누르면 즉시 이전 두 카드를 닫고 진행
        if (mismatchTimerId) {
          resolvePendingMismatchImmediately();
        }

        var idx = Number(index);
        if (isNaN(idx) || idx < 0 || idx >= cards.length) return false;

        var card = cards[idx];
        if (!card || card.isMatched || card.isFlipped) return false;
        if (flippedIndices.length >= 2) return false;

        card.isFlipped = true;
        card.isHinting = false;
        flippedIndices.push(idx);

        if (flippedIndices.length === 1) {
          h.playSfx('flip');
          renderCards();
          return true;
        }

        // 두 번째 카드를 뒤집은 경우 매칭 판정
        var firstIdx = flippedIndices[0];
        var secondIdx = flippedIndices[1];
        var cardA = cards[firstIdx];
        var cardB = cards[secondIdx];

        if (cardA.charKey === cardB.charKey) {
          cardA.isMatched = true;
          cardB.isMatched = true;
          flippedIndices = [];

          state.matchedPairs += 1;
          state.totalMatchedAllStages += 1;
          state.comboCount += 1;
          if (state.comboCount > state.maxCombo) {
            state.maxCombo = state.comboCount;
          }

          h.playSfx('note', state.matchedPairs - 1);

          var gained = 50;
          if (state.comboCount >= 2) {
            gained += 20;
          }

          if (cardA.isHero) {
            gained += 100;
            state.score += gained;
            h.createHeartExplosion(50, 50);
            state.bannerMessage = '💖 내 짝꿍을 찾았어! 보너스 +100점!! (총 +' + gained + '점)';
          } else {
            state.score += gained;
            state.bannerMessage = '✨ 짝꿍 성공! ' + cardA.name + ' 친구를 찾았어요! (+' + gained + '점)';
          }

          renderCards();

          // 스테이지 클리어 확인
          if (state.matchedPairs >= state.totalPairs) {
            if (state.stage === 1) {
              state.bannerMessage = '🎉 1단계 클리어! 더 신나는 2단계(6쌍)로 출발해요! ✨';
              updateHud();
              stageTransitionTimerId = setTimeout(function () {
                stageTransitionTimerId = null;
                startStage(2);
              }, 1100);
            } else {
              finishGame('all_stages_cleared');
            }
          }
          return true;
        }

        // 짝이 다른 경우: 감점 전혀 없음! 0.8초 동안 얼굴을 충분히 보여준 뒤 다시 뒤집힘
        state.comboCount = 0;
        state.bannerMessage = '괜찮아요~ 얼굴을 기억해뒀다가 다시 찾아봐요! 💖';
        renderCards();

        mismatchTimerId = setTimeout(function () {
          mismatchTimerId = null;
          cardA.isFlipped = false;
          cardB.isFlipped = false;
          flippedIndices = [];
          renderCards();
        }, MISMATCH_HOLD_MS);

        return true;
      }

      function useHint() {
        if (state.isGameOver) return null;
        if (state.isPreviewing) {
          skipPreview();
        }

        // 아직 맞추지 못한 짝꿍 한 쌍 탐색 (내 주인공 티니핑 우선)
        var unmatchedByKey = {};
        var targetKey = null;

        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          if (!c.isMatched) {
            if (!unmatchedByKey[c.charKey]) {
              unmatchedByKey[c.charKey] = [];
            }
            unmatchedByKey[c.charKey].push(c.index);
            if (c.isHero && unmatchedByKey[c.charKey].length === 2) {
              targetKey = c.charKey;
            }
          }
        }

        if (!targetKey) {
          var keys = Object.keys(unmatchedByKey);
          for (var k = 0; k < keys.length; k++) {
            if (unmatchedByKey[keys[k]].length >= 2) {
              targetKey = keys[k];
              break;
            }
          }
        }

        if (!targetKey) return null;

        var pairIndices = unmatchedByKey[targetKey].slice(0, 2);
        state.hintCount += 1;
        for (var p = 0; p < pairIndices.length; p++) {
          cards[pairIndices[p]].isHinting = true;
        }

        var hintedName = cards[pairIndices[0]].name;
        state.bannerMessage = '🔮 하츄핑의 마법 힌트! 황금빛으로 반짝이는 [' + hintedName + '] 짝꿍을 봐요! ✨';
        h.playSfx('note', 0);
        renderCards();

        if (hintTimerId) {
          clearTimeout(hintTimerId);
        }
        hintTimerId = setTimeout(function () {
          hintTimerId = null;
          for (var idx = 0; idx < cards.length; idx++) {
            cards[idx].isHinting = false;
          }
          renderCards();
        }, HINT_DURATION_MS);

        return pairIndices;
      }

      function finishGame(reason) {
        if (state.isGameOver) return;
        state.isGameOver = true;
        clearAllTimers();

        if (state.score > state.highScore) {
          state.highScore = state.score;
        }
        h.saveHighScore(GAME_ID, state.score);
        h.rewardCharacter();

        h.showResultOverlay(stageEl, {
          gameId: GAME_ID,
          title: '숨바꼭질 짝꿍 찾기 대성공! 🃏💖',
          score: state.score,
          highScore: state.highScore,
          summary: '1·2단계 티니핑 짝꿍을 모두 찾았어요! (최대 ' + state.maxCombo + '연속 성공)',
          reason: reason || 'cleared',
          charCtx: ctx,
          onRestart: function () {
            cleanup();
            gameDef.mount(stageEl, charCtx, helpers);
          }
        });
      }

      if (hintBtnEl && hintBtnEl.addEventListener) {
        hintBtnEl.addEventListener('click', function () {
          useHint();
        });
      }

      // 1스테이지 시작
      startStage(1);

      var api = {
        skipPreview: skipPreview,
        flipCard: flipCard,
        useHint: useHint,
        nextStage: function () {
          startStage(2);
        },
        finishGame: finishGame,
        getState: function () {
          return {
            stage: state.stage,
            score: state.score,
            highScore: state.highScore,
            matchedPairs: state.matchedPairs,
            totalPairs: state.totalPairs,
            totalMatchedAllStages: state.totalMatchedAllStages,
            combo: state.comboCount,
            comboCount: state.comboCount,
            maxCombo: state.maxCombo,
            hintCount: state.hintCount,
            isPreviewing: state.isPreviewing,
            isGameOver: state.isGameOver,
            bannerMessage: state.bannerMessage,
            flippedIndices: flippedIndices.slice(),
            cards: cards.map(function (c) {
              return {
                index: c.index,
                charKey: c.charKey,
                name: c.name,
                isHero: c.isHero,
                isFlipped: c.isFlipped,
                isMatched: c.isMatched,
                isHinting: c.isHinting
              };
            })
          };
        }
      };

      stageEl._memoryGame = api;

      function cleanup() {
        state.isGameOver = true;
        clearAllTimers();
        cards = [];
        flippedIndices = [];
        if (stageEl._memoryGame === api) {
          delete stageEl._memoryGame;
        }
      }

      return cleanup;
    }
  };

  global.TpGameMemory = gameDef;
  if (global.TpMiniGames && typeof global.TpMiniGames.register === 'function') {
    global.TpMiniGames.register(gameDef.id, gameDef);
  }
})(typeof window !== 'undefined' ? window : globalThis);
