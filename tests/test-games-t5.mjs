/**
 * 티니핑 미니게임 T5(샤랄라! 마법 판 뒤집기! - tp-flipbattle.js) 단위 테스트
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
    },
    addEventListener() {},
    removeEventListener() {}
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

  const flipBattleCode = fs.readFileSync(path.join(ROOT_DIR, 'js', 'games', 'tp-flipbattle.js'), 'utf8');
  vm.runInNewContext(flipBattleCode, sandbox, { filename: 'tp-flipbattle.js' });

  return { sandbox, registeredGames };
}

function createMockCharCtx() {
  return {
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

test('1. T5(flipbattle) 게임이 TpMiniGames.register에 정상 등록된다', () => {
  const { sandbox, registeredGames } = createTestEnv();

  assert.equal(registeredGames.has('flipbattle'), true, 'flipbattle 게임이 등록되어야 함');
  const gameDef = registeredGames.get('flipbattle');

  assert.equal(gameDef.id, 'flipbattle');
  assert.equal(gameDef.title, '샤랄라! 마법 판 뒤집기!');
  assert.equal(gameDef.subtitle, '악동핑보다 먼저 카드를 내 티니핑 빛깔로 뒤집어요!');
  assert.equal(gameDef.icon, '⚡');
  assert.equal(gameDef.badge, '스피드 판 뒤집기');
  assert.equal(gameDef.badgeColor, '#EC4899');
  assert.equal(typeof gameDef.mount, 'function');
  assert.equal(sandbox.TpGameFlipBattle, gameDef);
});

test('2. 마운트 후 4x4(16장) 보드가 8:8로 시작하며 flipTile() 호출 시 hero 전환·+15점·실로폰 콤보가 증가한다', () => {
  const { registeredGames } = createTestEnv();
  const gameDef = registeredGames.get('flipbattle');
  const stageEl = createMockElement('div');
  const charCtx = createMockCharCtx();
  const { calls, helpers } = createMockHelpers();

  const cleanup = gameDef.mount(stageEl, charCtx, helpers);
  assert.equal(typeof cleanup, 'function', 'mount는 cleanup 함수를 반환해야 함');
  assert.ok(stageEl._tpFlipBattleGame, 'stageEl._tpFlipBattleGame 테스트 훅이 노출되어야 함');

  const init = stageEl._tpFlipBattleGame.getState();
  assert.equal(init.tiles.length, 16, '4x4 총 16장의 타일이 있어야 함');
  assert.equal(init.heroCount, 8, '초기 내 티니핑 타일은 8장이어야 함');
  assert.equal(init.villainCount, 8, '초기 심술핑 타일은 8장이어야 함');
  assert.equal(init.timeLeft, 25, '초기 제한 시간은 25초여야 함');
  assert.equal(init.score, 0);

  // 심술핑 타일(0번) 뒤집기 (3D 양면 DOM이 재구축되지 않고 유지되는지 함께 검증)
  const gridEl = stageEl.querySelector('[data-role="grid"]');
  const villainTileIdx = init.tiles.find((t) => t.owner === 'villain').index;
  const tileElBefore = gridEl.children[villainTileIdx];
  assert.ok(
    tileElBefore.innerHTML.includes('tp-flipbattle-tile-card') &&
      tileElBefore.innerHTML.includes('tp-tile-hero') &&
      tileElBefore.innerHTML.includes('tp-tile-villain'),
    '각 타일은 hero/villain 양면 3D 구조를 동시에 포함해야 함'
  );
  stageEl._tpFlipBattleGame.flipTile(villainTileIdx);
  assert.equal(gridEl.children[villainTileIdx], tileElBefore, '타일 뒤집기 시 버튼 DOM이 유지되어야 함');

  const afterFlip = stageEl._tpFlipBattleGame.getState();
  assert.equal(afterFlip.tiles[villainTileIdx].owner, 'hero', '뒤집은 타일이 hero 소유로 바뀌어야 함');
  assert.equal(afterFlip.heroCount, 9, '내 티니핑 타일 수가 9장으로 증가해야 함');
  assert.equal(afterFlip.villainCount, 7, '심술핑 타일 수가 7장으로 감소해야 함');
  assert.equal(afterFlip.score, 15, '타일 1장 뒤집기 시 +15점 증가');
  assert.equal(afterFlip.combo, 1, '콤보가 1 증가해야 함');
  assert.ok(
    calls.sfx.some((s) => s.type === 'note' && s.noteIdx === 0),
    '실로폰 계이름 도(note, 0) 효과음이 연주되어야 함'
  );

  // 심술핑 AI 방해(villainFlip) 동작 확인
  const flippedByVillainIdx = stageEl._tpFlipBattleGame.villainFlip();
  assert.ok(flippedByVillainIdx >= 0, '심술핑이 타일 하나를 뒤집어야 함');
  const afterVillain = stageEl._tpFlipBattleGame.getState();
  assert.equal(afterVillain.tiles[flippedByVillainIdx].owner, 'villain');

  cleanup();
  assert.equal(stageEl._tpFlipBattleGame, undefined, 'cleanup 호출 후 _tpFlipBattleGame 훅이 해제되어야 함');
});

test('3. triggerMagicWand(5) 호출 시 십자(+) 방향 타일들이 일괄 hero로 뒤집히고 +80점 보너스 및 finishGame 보상이 동작한다', () => {
  const { registeredGames } = createTestEnv();
  const gameDef = registeredGames.get('flipbattle');
  const stageEl = createMockElement('div');
  const charCtx = createMockCharCtx();
  const { calls, helpers } = createMockHelpers();

  const cleanup = gameDef.mount(stageEl, charCtx, helpers);

  // 5번 타일(row=1, col=1)에서 로열 마법봉 필살기 발동
  const affected = stageEl._tpFlipBattleGame.triggerMagicWand(5);
  assert.ok(Array.isArray(affected) && affected.length >= 5, '십자(+) 방향 타일들이 변신해야 함');

  const afterWand = stageEl._tpFlipBattleGame.getState();
  // 5번 기준 상하좌우(1, 4, 5, 6, 9) 및 가로·세로줄 타일이 모두 hero인지 확인
  for (const idx of [1, 4, 5, 6, 9]) {
    assert.equal(afterWand.tiles[idx].owner, 'hero', `${idx}번 십자 방향 타일이 hero로 뒤집혀야 함`);
  }
  assert.equal(afterWand.score, 80, '마법봉 발동 시 +80점 보너스 획득');
  assert.equal(calls.explosions, 1, '하트 대폭발 연출이 호출되어야 함');

  // 1초 타이머 진행 확인
  stageEl._tpFlipBattleGame.stepSecond();
  assert.equal(stageEl._tpFlipBattleGame.getState().timeLeft, 24);

  // 게임 종료 및 승리 보너스(+100점) 확인
  stageEl._tpFlipBattleGame.finishGame();
  const finalState = stageEl._tpFlipBattleGame.getState();
  assert.equal(finalState.isGameOver, true);
  assert.equal(finalState.score, 180, '내 티니핑 타일이 더 많으므로 +100점 승리 보너스가 더해져 180점이 되어야 함');
  assert.equal(calls.savedScores.length, 1);
  assert.equal(calls.savedScores[0].gameId, 'flipbattle');
  assert.equal(calls.savedScores[0].score, 180);
  assert.equal(calls.rewards, 1);
  assert.equal(calls.overlays.length, 1);

  cleanup();
});
