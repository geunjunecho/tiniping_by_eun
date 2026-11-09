/**
 * 티니핑 미니게임 T3(비눗방울 톡톡!) & T4(내 티니핑 짝꿍 찾기) 단위 테스트
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function createMockElement(tagName = 'div') {
  const children = [];
  const attributes = new Map();
  const listeners = new Map();
  let innerHTMLValue = '';

  const el = {
    tagName: String(tagName).toUpperCase(),
    className: '',
    id: '',
    type: '',
    textContent: '',
    style: {},
    parentNode: null,
    children,
    get innerHTML() {
      return innerHTMLValue;
    },
    set innerHTML(val) {
      innerHTMLValue = String(val || '');
      children.length = 0;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    appendChild(child) {
      if (child) {
        child.parentNode = el;
        children.push(child);
      }
      return child;
    },
    removeChild(child) {
      const idx = children.indexOf(child);
      if (idx !== -1) {
        children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      if (!listeners.has(type)) return;
      const arr = listeners.get(type);
      const idx = arr.indexOf(fn);
      if (idx !== -1) arr.splice(idx, 1);
    },
    querySelector(selector) {
      // 가벼운 역할별 가상 요소 반환으로 HUD/그리드 업데이트 지원
      if (!el._virtualRoles) el._virtualRoles = new Map();
      if (!el._virtualRoles.has(selector)) {
        el._virtualRoles.set(selector, createMockElement('div'));
      }
      return el._virtualRoles.get(selector);
    },
    querySelectorAll() {
      return [];
    }
  };
  return el;
}

function createTestEnv() {
  const registeredGames = new Map();
  const mockHead = createMockElement('head');
  const mockBody = createMockElement('body');

  const mockDocument = {
    head: mockHead,
    body: mockBody,
    getElementById() {
      return null;
    },
    createElement(tag) {
      return createMockElement(tag);
    },
    querySelector() {
      return null;
    }
  };

  const sandbox = {
    window: null,
    globalThis: null,
    document: mockDocument,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    TpMiniGames: {
      register(id, def) {
        registeredGames.set(id, def);
      },
      get(id) {
        return registeredGames.get(id);
      }
    }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;

  const bubbleCode = fs.readFileSync(path.join(ROOT_DIR, 'js', 'games', 'tp-bubble.js'), 'utf8');
  const memoryCode = fs.readFileSync(path.join(ROOT_DIR, 'js', 'games', 'tp-memory.js'), 'utf8');

  vm.runInNewContext(bubbleCode, sandbox, { filename: 'tp-bubble.js' });
  vm.runInNewContext(memoryCode, sandbox, { filename: 'tp-memory.js' });

  return { sandbox, registeredGames };
}

function createMockCharCtx() {
  return {
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
    pool: [
      { name: '방글핑', color: '#BA68C8', seasonEmoji: '✨' },
      { name: '조아핑', color: '#FFB74D', seasonEmoji: '💛' },
      { name: '믿어핑', color: '#4FC3F7', seasonEmoji: '💙' },
      { name: '차차핑', color: '#81C784', seasonEmoji: '🍀' },
      { name: '라라핑', color: '#F06292', seasonEmoji: '🎵' }
    ]
  };
}

function createMockHelpers() {
  const calls = {
    sfx: [],
    savedScores: [],
    rewards: 0,
    explosions: 0,
    overlays: []
  };

  return {
    calls,
    helpers: {
      playSfx(type, noteIdx) {
        calls.sfx.push({ type, noteIdx });
      },
      playCry() {},
      computeRunTransform() {
        return '';
      },
      getHighScore() {
        return 0;
      },
      saveHighScore(gameId, score) {
        calls.savedScores.push({ gameId, score });
      },
      rewardCharacter() {
        calls.rewards += 1;
      },
      createHeartExplosion() {
        calls.explosions += 1;
      },
      renderAvatarHtml(tp) {
        return `<span>${tp?.name || '티니핑'}</span>`;
      },
      showResultOverlay(_stageEl, opts) {
        calls.overlays.push(opts);
      }
    }
  };
}

test('1. T3(bubble) & T4(memory) 게임이 TpMiniGames.register에 정상 등록된다', () => {
  const { sandbox, registeredGames } = createTestEnv();

  assert.equal(registeredGames.has('bubble'), true, 'bubble 게임이 등록되어야 함');
  assert.equal(registeredGames.has('memory'), true, 'memory 게임이 등록되어야 함');

  const bubbleDef = registeredGames.get('bubble');
  const memoryDef = registeredGames.get('memory');

  assert.equal(bubbleDef.id, 'bubble');
  assert.equal(bubbleDef.title, '반짝반짝 비눗방울 톡톡!');
  assert.equal(bubbleDef.icon, '🫧');
  assert.equal(bubbleDef.badgeColor, '#26C6DA');
  assert.equal(typeof bubbleDef.mount, 'function');
  assert.equal(sandbox.TpGameBubble, bubbleDef);

  assert.equal(memoryDef.id, 'memory');
  assert.equal(memoryDef.title, '숨바꼭질! 내 티니핑 짝꿍 찾기');
  assert.equal(memoryDef.icon, '🃏');
  assert.equal(memoryDef.badgeColor, '#FFA726');
  assert.equal(typeof memoryDef.mount, 'function');
  assert.equal(sandbox.TpGameMemory, memoryDef);
});

test('2. T3(bubble) 마운트 후 주인공 방울 팝 시 +30점·콤보 증가, 심술 방울 팝 시 하트 감소 및 cleanup 동작', () => {
  const { registeredGames } = createTestEnv();
  const bubbleDef = registeredGames.get('bubble');
  const stageEl = createMockElement('div');
  const charCtx = createMockCharCtx();
  const { calls, helpers } = createMockHelpers();

  const cleanup = bubbleDef.mount(stageEl, charCtx, helpers);
  assert.equal(typeof cleanup, 'function', 'mount는 cleanup 함수를 반환해야 함');
  assert.ok(stageEl._bubbleGame, 'stageEl._bubbleGame 테스트 훅이 노출되어야 함');

  const initialState = stageEl._bubbleGame.getState();
  assert.equal(initialState.score, 0);
  assert.equal(initialState.lives, 3);
  assert.equal(initialState.combo, 0);

  // 주인공(hero) 방울 생성 및 터뜨리기 -> +30점, 콤보 1, 하트 폭발, 실로폰 계이름(note, 0) 호출
  const heroBubble = stageEl._bubbleGame.spawnBubble('hero');
  assert.ok(heroBubble && heroBubble.id, '주인공 방울이 생성되어야 함');
  stageEl._bubbleGame.popBubble(heroBubble.id);

  const afterHeroState = stageEl._bubbleGame.getState();
  assert.equal(afterHeroState.score, 30, '주인공 방울 구출 시 +30점 증가');
  assert.equal(afterHeroState.combo, 1, '좋은 방울 팝 시 콤보 1 증가');
  assert.equal(afterHeroState.rescuedInWave, 1, '구출 게이지 1 증가');
  assert.equal(calls.explosions, 1, '주인공 방울 구출 시 하트 폭발 연출 호출');
  assert.ok(
    calls.sfx.some((s) => s.type === 'note' && s.noteIdx === 0),
    '실로폰 도(noteIdx=0) 효과음 호출 확인'
  );

  // 심술 먹구름(villain) 방울 생성 및 터뜨리기 -> 하트 1 감소, 콤보 0 초기화
  const villainBubble = stageEl._bubbleGame.spawnBubble('villain');
  assert.ok(villainBubble && villainBubble.id, '심술 방울이 생성되어야 함');
  stageEl._bubbleGame.popBubble(villainBubble.id);

  const afterVillainState = stageEl._bubbleGame.getState();
  assert.equal(afterVillainState.lives, 2, '심술 방울 터치 시 하트가 3에서 2로 감소');
  assert.equal(afterVillainState.combo, 0, '심술 방울 터치 시 콤보 초기화');
  assert.ok(
    calls.sfx.some((s) => s.type === 'hit'),
    '심술 방울 터치 시 hit 효과음 호출 확인'
  );

  cleanup();
  assert.equal(stageEl._bubbleGame, undefined, 'cleanup 호출 후 _bubbleGame 훅 해제');
});

test('3. T4(memory) 마운트 후 skipPreview(), 같은 캐릭터 카드 2장 flipCard 호출 시 matchedPairs 및 점수 증가, useHint 동작 확인', () => {
  const { registeredGames } = createTestEnv();
  const memoryDef = registeredGames.get('memory');
  const stageEl = createMockElement('div');
  const charCtx = createMockCharCtx();
  const { calls, helpers } = createMockHelpers();

  const cleanup = memoryDef.mount(stageEl, charCtx, helpers);
  assert.equal(typeof cleanup, 'function', 'mount는 cleanup 함수를 반환해야 함');
  assert.ok(stageEl._memoryGame, 'stageEl._memoryGame 테스트 훅이 노출되어야 함');

  // 시작 직후 2.5초 앞면 미리보기 상태 확인
  const previewState = stageEl._memoryGame.getState();
  assert.equal(previewState.stage, 1);
  assert.equal(previewState.totalPairs, 4);
  assert.equal(previewState.cards.length, 8, '1스테이지는 4쌍(8장)이어야 함');
  assert.equal(previewState.isPreviewing, true, '초기에는 미리보기 상태여야 함');

  // 미리보기 즉시 건너뛰기 (DOM 노드가 재생성되지 않고 in-place 클래스만 갱신되는지 검증)
  const gridEl = stageEl.querySelector('[data-role="grid"]');
  const initialCardEls = [...gridEl.children];
  assert.equal(initialCardEls.length, 8, '1스테이지 8장의 카드 버튼 DOM이 생성되어야 함');
  assert.ok(
    initialCardEls[0].innerHTML.includes('tp-memory-card-inner') &&
      initialCardEls[0].innerHTML.includes('tp-memory-card-back') &&
      initialCardEls[0].innerHTML.includes('tp-memory-card-front'),
    '각 카드는 앞면과 뒷면을 모두 포함한 3D inner 래퍼를 가져야 함'
  );

  stageEl._memoryGame.skipPreview();
  const readyState = stageEl._memoryGame.getState();
  assert.equal(readyState.isPreviewing, false, 'skipPreview 후 isPreviewing이 false여야 함');
  assert.equal(gridEl.children[0], initialCardEls[0], 'skipPreview 시 카드 DOM을 재구축하지 않고 유지해야 함');

  // 마법 힌트 호출 검증
  const hintPair = stageEl._memoryGame.useHint();
  assert.ok(Array.isArray(hintPair) && hintPair.length === 2, 'useHint는 짝꿍 인덱스 2개를 반환해야 함');

  // 주인공 티니핑(하츄핑) 카드 2장의 인덱스 찾기
  const heroIndices = readyState.cards
    .filter((c) => c.name === charCtx.name)
    .map((c) => c.index);
  assert.equal(heroIndices.length, 2, '내가 고른 주인공 티니핑 카드 한 쌍이 반드시 포함되어야 함');

  const [idxA, idxB] = heroIndices;
  stageEl._memoryGame.flipCard(idxA);
  stageEl._memoryGame.flipCard(idxB);

  const afterMatchState = stageEl._memoryGame.getState();
  assert.equal(afterMatchState.matchedPairs, 1, '같은 카드 2장을 뒤집으면 matchedPairs가 1 증가해야 함');
  assert.ok(afterMatchState.score >= 150, '주인공 짝 맞추기 시 기본(+50) + 주인공 보너스(+100) 이상 점수 획득');
  assert.equal(calls.explosions, 1, '주인공 짝 맞추기 시 하트 폭발 연출 호출');

  // 일반 친구 카드 한 쌍 더 맞추기 검증
  const friendName = afterMatchState.cards.find((c) => !c.isMatched).name;
  const friendIndices = afterMatchState.cards
    .filter((c) => c.name === friendName)
    .map((c) => c.index);
  assert.equal(friendIndices.length, 2);

  stageEl._memoryGame.flipCard(friendIndices[0]);
  stageEl._memoryGame.flipCard(friendIndices[1]);

  const afterSecondMatch = stageEl._memoryGame.getState();
  assert.equal(afterSecondMatch.matchedPairs, 2, '두 번째 쌍 매칭 후 matchedPairs가 2가 되어야 함');
  assert.ok(afterSecondMatch.score > afterMatchState.score, '점수가 추가로 증가해야 함');

  cleanup();
  assert.equal(stageEl._memoryGame, undefined, 'cleanup 호출 후 _memoryGame 훅 해제');
});
