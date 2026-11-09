/**
 * 티니핑 미니게임 T1(runner) & T2(parfait) 단위 테스트
 * - 가벼운 DOM 모킹 헬퍼 기반 검증
 * - 1) TpMiniGames.register 등록 확인 ('runner', 'parfait')
 * - 2) runner 마운트 후 jump() -> isJumping === true, duck(true) -> isDucking === true, cleanup() 확인
 * - 3) parfait 마운트 후 selectIngredient(0) 3회 + feedTiniping() 호출 시 점수 증가·그릇 카운트 진행 및 cleanup() 확인
 */
import test from 'node:test';
import assert from 'node:assert/strict';

function createMockCanvasContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    clearRect() {},
    fillRect() {},
    beginPath() {},
    arc() {},
    fill() {},
    stroke() {},
    save() {},
    restore() {},
    fillText() {}
  };
}

function createMockElement(tagOrSelector = 'div') {
  const listeners = new Map();
  const classes = new Set();
  const childMap = new Map();

  const el = {
    tagName: String(tagOrSelector).toUpperCase(),
    innerHTML: '',
    textContent: '',
    style: {},
    dataset: {},
    classList: {
      add(...tokens) {
        tokens.forEach((t) => classes.add(t));
      },
      remove(...tokens) {
        tokens.forEach((t) => classes.delete(t));
      },
      contains(token) {
        return classes.has(token);
      },
      toggle(token, force) {
        if (force === undefined) {
          if (classes.has(token)) {
            classes.delete(token);
            return false;
          }
          classes.add(token);
          return true;
        }
        if (force) classes.add(token);
        else classes.delete(token);
        return Boolean(force);
      }
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      if (listeners.has(type)) listeners.get(type).delete(fn);
    },
    getListenerCount(type) {
      return listeners.has(type) ? listeners.get(type).size : 0;
    },
    getContext(kind) {
      if (kind === '2d') return createMockCanvasContext();
      return null;
    },
    querySelector(selector) {
      if (!childMap.has(selector)) {
        childMap.set(selector, createMockElement(selector));
      }
      return childMap.get(selector);
    },
    querySelectorAll(selector) {
      if (selector === '.tp-parfait-ing-btn') {
        return [0, 1, 2, 3].map((i) => createMockElement(`button-${i}`));
      }
      return [];
    }
  };

  return el;
}

function setupGlobalDomMocks() {
  const registeredGames = {};

  globalThis.window = globalThis;
  globalThis.addEventListener = globalThis.addEventListener || function () {};
  globalThis.removeEventListener = globalThis.removeEventListener || function () {};
  globalThis.requestAnimationFrame = function () {
    return 101;
  };
  globalThis.cancelAnimationFrame = function () {};

  globalThis.TpMiniGames = {
    registered: registeredGames,
    register(id, gameDef) {
      registeredGames[id] = gameDef;
    },
    get(id) {
      return registeredGames[id];
    }
  };

  return { registeredGames };
}

function createSampleCharCtx() {
  return {
    name: '하츄핑',
    nameEn: 'Heartsping',
    image: 'images/heartsping.png',
    color: '#FF69B4',
    grade: '로열',
    emotion: '사랑',
    gender: '여',
    mainSeason: 1,
    seasonTheme: '샤랄라 하트',
    seasonEmoji: '🍓',
    pool: []
  };
}

function createMockHelpers() {
  const highScores = {};
  const sfxCalls = [];
  let rewarded = 0;
  let explosions = 0;
  let resultOverlayOpts = null;

  return {
    sfxCalls,
    highScores,
    getRewardedCount: () => rewarded,
    getExplosionCount: () => explosions,
    getLastOverlay: () => resultOverlayOpts,
    playSfx(type, noteIdx) {
      sfxCalls.push({ type, noteIdx });
    },
    playCry() {
      sfxCalls.push({ type: 'cry' });
    },
    computeRunTransform(state, tick) {
      const y = Number(state?.yOffset) || 0;
      return {
        transform: `translateY(${y}px) scale(${state?.isDucking ? 1.2 : 1}, ${state?.isDucking ? 0.65 : 1})`,
        filter: state?.isHit ? 'brightness(1.4)' : 'none',
        leftWingTransform: `rotate(${-15 - (tick % 10)}deg)`,
        rightWingTransform: `scaleX(-1) rotate(${-15 - (tick % 10)}deg)`
      };
    },
    getHighScore(gameId) {
      return highScores[gameId] || 0;
    },
    saveHighScore(gameId, score) {
      highScores[gameId] = Math.max(highScores[gameId] || 0, score);
    },
    rewardCharacter() {
      rewarded += 1;
    },
    createHeartExplosion() {
      explosions += 1;
    },
    renderAvatarHtml(tp) {
      return `<div>${tp?.name || '하츄핑'}</div>`;
    },
    showResultOverlay(stageEl, opts) {
      resultOverlayOpts = opts;
    }
  };
}

const { registeredGames } = setupGlobalDomMocks();

await import('../js/games/tp-runner.js');
await import('../js/games/tp-parfait.js');

test('1. tp-runner.js와 tp-parfait.js가 TpMiniGames.register에 정상 등록된다', () => {
  assert.ok(registeredGames.runner, 'runner 게임이 등록되어야 합니다');
  assert.ok(registeredGames.parfait, 'parfait 게임이 등록되어야 합니다');

  assert.equal(registeredGames.runner.id, 'runner');
  assert.equal(registeredGames.runner.title, '샤랄라 구름길 점프런');
  assert.equal(registeredGames.runner.icon, '🌈');
  assert.equal(typeof registeredGames.runner.mount, 'function');

  assert.equal(registeredGames.parfait.id, 'parfait');
  assert.equal(registeredGames.parfait.title, '새콤달콤 마법 파르페');
  assert.equal(registeredGames.parfait.icon, '🍰');
  assert.equal(typeof registeredGames.parfait.mount, 'function');

  assert.equal(globalThis.TpGameRunner, registeredGames.runner);
  assert.equal(globalThis.TpGameParfait, registeredGames.parfait);
});

test('2. runner 게임 마운트 후 jump(), duck(true), stepFrame() 동작 및 cleanup() 해제 확인', () => {
  const stageEl = createMockElement('div');
  const charCtx = createSampleCharCtx();
  const helpers = createMockHelpers();

  const cleanup = registeredGames.runner.mount(stageEl, charCtx, helpers);
  assert.equal(typeof cleanup, 'function', 'mount는 cleanup 함수를 반환해야 합니다');
  assert.ok(stageEl._tpRunnerGame, 'stageEl._tpRunnerGame 테스트 훅이 노출되어야 합니다');

  const initialState = stageEl._tpRunnerGame.getState();
  assert.equal(initialState.lives, 3, '초기 하트 목숨은 3개여야 합니다');
  assert.equal(initialState.isJumping, false);
  assert.equal(initialState.isDucking, false);

  // 점프 테스트 (1단 점프 & 2단 마법 점프)
  stageEl._tpRunnerGame.jump();
  const afterJumpState = stageEl._tpRunnerGame.getState();
  assert.equal(afterJumpState.isJumping, true, 'jump() 호출 후 isJumping === true 여야 합니다');
  assert.equal(afterJumpState.jumpCount, 1);

  stageEl._tpRunnerGame.stepFrame();
  stageEl._tpRunnerGame.jump();
  assert.equal(stageEl._tpRunnerGame.getState().jumpCount, 2, '공중에서 한 번 더 누르면 2단 점프가 가능해야 합니다');

  // 숙이기 테스트 (누르는 동안만 유지, 떼면 즉시 해제)
  stageEl._tpRunnerGame.duck(true);
  const afterDuckState = stageEl._tpRunnerGame.getState();
  assert.equal(afterDuckState.isDucking, true, 'duck(true) 호출 후 isDucking === true 여야 합니다');

  stageEl._tpRunnerGame.duck(false);
  assert.equal(stageEl._tpRunnerGame.getState().isDucking, false, 'duck(false) 호출 후 isDucking === false 여야 합니다');

  // 장애물 충돌 시 뒤로 팅팅 튕기는 넉백 바운스 확인
  stageEl._tpRunnerGame.triggerObstacleHit();
  stageEl._tpRunnerGame.stepFrame();
  const hitState = stageEl._tpRunnerGame.getState();
  assert.equal(hitState.lives, 2, '장애물 충돌 후 하트가 1 감소해야 합니다');
  assert.ok(hitState.knockbackTimer > 0, '충돌 직후 knockbackTimer가 활성화되어야 합니다');
  assert.ok(hitState.knockbackX < 0, '충돌 직후 뒤로 밀려나는 knockbackX < 0 이어야 합니다');
  assert.ok(hitState.knockbackBounceY < 0, '충돌 직후 위로 튀어오르는 knockbackBounceY < 0 이어야 합니다');

  // 빠른 연속 2단 점프 시 1단 점프보다 확실히 더 높이 올라가야 함
  for (let i = 0; i < 40; i++) {
    stageEl._tpRunnerGame.stepFrame();
  }
  stageEl._tpRunnerGame.jump();
  stageEl._tpRunnerGame.stepFrame();
  stageEl._tpRunnerGame.jump();
  let minDoubleJumpY = 0;
  for (let i = 0; i < 60; i++) {
    const st = stageEl._tpRunnerGame.stepFrame();
    if (st.y < minDoubleJumpY) minDoubleJumpY = st.y;
  }
  assert.ok(
    minDoubleJumpY <= -150,
    `빠른 2단 점프 정점 높이(minY=${minDoubleJumpY})는 1단 점프보다 훨씬 높아야 합니다 (<= -150)`
  );
  assert.equal(stageEl._tpRunnerGame.getState().isJumping, false, '60프레임 후 착지 상태여야 합니다');

  // 전체화면 뷰포트(예: 960x640)에서 점프 변위(yOffset)가 화면 스케일에 맞춰 증폭되어야 함
  const viewportEl = stageEl.querySelector('.tp-runner-viewport');
  viewportEl.clientWidth = 960;
  viewportEl.clientHeight = 640;
  stageEl._tpRunnerGame.jump();
  for (let i = 0; i < 12; i++) {
    stageEl._tpRunnerGame.stepFrame();
  }
  const scaledState = stageEl._tpRunnerGame.getState();
  assert.ok(
    scaledState.renderScaleY > 1.1,
    `전체화면(960x640)에서 renderScaleY(${scaledState.renderScaleY})가 1.1보다 커야 합니다`
  );
  const heroEl = stageEl.querySelector('.tp-runner-hero');
  const translateMatch = heroEl.style.transform.match(/translateY\((-?\d+(?:\.\d+)?)px\)/);
  assert.ok(translateMatch, 'heroEl transform에 translateY(px)가 포함되어야 합니다');
  const renderedTranslateY = Number(translateMatch[1]);
  assert.ok(
    Math.abs(renderedTranslateY) > Math.abs(scaledState.y) * 1.1,
    `DOM 점프 높이(${renderedTranslateY}px)가 논리 좌표(${scaledState.y})에 화면 스케일(${scaledState.renderScaleY})을 곱한 값과 일치해야 합니다`
  );

  // cleanup 호출 확인
  cleanup();
  assert.equal(stageEl._tpRunnerGame.getState().isCleanedUp, true);
});

test('3. parfait 게임 마운트 후 3단계 재료 선택(selectIngredient(0) 3회) 및 feedTiniping() 호출 시 점수·그릇 카운트 진행 및 cleanup() 확인', () => {
  const stageEl = createMockElement('div');
  const charCtx = createSampleCharCtx();
  const helpers = createMockHelpers();

  const cleanup = registeredGames.parfait.mount(stageEl, charCtx, helpers);
  assert.equal(typeof cleanup, 'function', 'mount는 cleanup 함수를 반환해야 합니다');
  assert.ok(stageEl._parfaitGame, 'stageEl._parfaitGame 테스트 훅이 노출되어야 합니다');

  const initState = stageEl._parfaitGame.getState();
  assert.equal(initState.score, 0);
  assert.equal(initState.bowlsCompleted, 0);
  assert.equal(initState.step, 0);

  // 1번째 그릇: 3단계 재료 선택 후 먹여주기
  stageEl._parfaitGame.selectIngredient(0);
  assert.equal(stageEl._parfaitGame.getState().step, 1);
  stageEl._parfaitGame.selectIngredient(0);
  assert.equal(stageEl._parfaitGame.getState().step, 2);
  stageEl._parfaitGame.selectIngredient(0);
  assert.equal(stageEl._parfaitGame.getState().step, 3);
  assert.equal(stageEl._parfaitGame.getState().selectedLayers.length, 3);

  stageEl._parfaitGame.feedTiniping();
  const afterFirstBowl = stageEl._parfaitGame.getState();
  assert.ok(afterFirstBowl.score >= 100, '먹여주기 후 점수가 증가해야 합니다 (+100점 또는 +120점)');
  assert.equal(afterFirstBowl.bowlsCompleted, 1, '1그릇 완료 후 bowlsCompleted가 1이어야 합니다');
  assert.ok(helpers.getExplosionCount() >= 1, '먹여주기 시 하트 폭발 연출이 호출되어야 합니다');

  // 2번째, 3번째 그릇까지 완성하여 게임 클리어 확인
  for (let round = 2; round <= 3; round++) {
    stageEl._parfaitGame.selectIngredient(0);
    stageEl._parfaitGame.selectIngredient(0);
    stageEl._parfaitGame.selectIngredient(0);
    stageEl._parfaitGame.feedTiniping();
  }

  const finalState = stageEl._parfaitGame.getState();
  assert.equal(finalState.bowlsCompleted, 3, '3그릇 완료 시 bowlsCompleted === 3 이어야 합니다');
  assert.equal(finalState.isCompleted, true, '3그릇 완료 시 게임이 완료 상태여야 합니다');
  assert.ok(finalState.score >= 300, '3그릇 완료 시 총점이 300점 이상이어야 합니다');
  assert.equal(helpers.getRewardedCount(), 1, '3그릇 완료 시 rewardCharacter()가 호출되어야 합니다');
  assert.ok(helpers.getLastOverlay(), '3그릇 완료 시 showResultOverlay()가 호출되어야 합니다');

  cleanup();
  assert.equal(stageEl._parfaitGame.getState().isCleanedUp, true);
});
