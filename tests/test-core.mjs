import assert from 'node:assert/strict';
import '../js/minigames-core.js';

const TpMiniGames = globalThis.TpMiniGames;
assert.ok(TpMiniGames, 'TpMiniGames 전역 객체가 정의되어야 합니다.');

// 1. TpMiniGames.register 게임 등록 및 조회 확인
let mountedWith = null;
const dummyGame = {
    title: '테스트 구름 달리기',
    icon: '🌈',
    mount(stageEl, charCtx, helpers) {
        mountedWith = { stageEl, charCtx, helpers };
        return () => {};
    }
};

TpMiniGames.register('runner', dummyGame);
assert.equal(TpMiniGames.games.has('runner'), true, 'runner 게임이 Map에 등록되어야 합니다.');
assert.equal(TpMiniGames.games.get('runner').title, '테스트 구름 달리기', '등록된 게임 정보를 조회할 수 있어야 합니다.');

// buildCharContext 검증
const ctx = TpMiniGames.buildCharContext({
    name: '하츄핑',
    nameEn: 'Heartsping',
    color: '#FF69B4',
    grade: '로열',
    emotion: '사랑',
    gender: '여',
    mainSeason: 1
});
assert.equal(ctx.name, '하츄핑');
assert.equal(ctx.seasonTheme, '큐브');
assert.equal(ctx.seasonEmoji, '💖');
assert.ok(Array.isArray(ctx.pool) && ctx.pool.length >= 8, '캐릭터 풀은 최소 8마리 이상이어야 합니다.');
assert.equal(ctx.pool[0].name, '하츄핑', '풀의 첫 번째 요소는 선택한 티니핑이어야 합니다.');

// 2. computeRunTransform 기본 달리기 바운스, 점프 스핀, 숙이기(scaleY < 0.7), 마법 날개 transform 확인
const runFrame = TpMiniGames.computeRunTransform({ isJumping: false, isDucking: false }, 4);
assert.ok(runFrame.transform.includes('translateY('), '기본 달리기 transform에 translateY가 포함되어야 합니다.');
assert.ok(runFrame.transform.includes('rotate('), '기본 달리기 transform에 rotate가 포함되어야 합니다.');
assert.ok(runFrame.wingLeftTransform.includes('rotate('), '왼쪽 마법 날개 transform이 생성되어야 합니다.');
assert.ok(runFrame.wingRightTransform.includes('scaleX(-1)'), '오른쪽 마법 날개 transform에 scaleX(-1)이 포함되어야 합니다.');

const jumpFrame = TpMiniGames.computeRunTransform({ isJumping: true, yOffset: -65, jumpProgress: 0.5 }, 10);
assert.ok(jumpFrame.transform.includes('translateY(-65px)'), '점프 시 yOffset이 반영되어야 합니다.');
assert.ok(jumpFrame.transform.includes('rotate(180.0deg)'), '점프 진행률에 따른 공중 마법 스핀 각도가 반영되어야 합니다.');

const duckFrame = TpMiniGames.computeRunTransform({ isDucking: true }, 6);
assert.ok(duckFrame.scaleY < 0.7, `숙이기 상태일 때 scaleY(${duckFrame.scaleY})는 0.7 미만이어야 합니다.`);
assert.ok(duckFrame.wingLeftTransform.includes('scale(0.7)'), '숙이기 상태일 때 날개 스케일이 0.7로 축소되어야 합니다.');

// helpers.computeRunTransform 동일 동작 확인
const helperDuckFrame = TpMiniGames.helpers.computeRunTransform({ isDucking: true }, 6);
assert.equal(helperDuckFrame.scaleY, duckFrame.scaleY);

// 3. helpers.saveHighScore 및 helpers.getHighScore 동작 확인
assert.equal(TpMiniGames.helpers.getHighScore('runner_test'), 0, '초기 최고 점수는 0이어야 합니다.');
TpMiniGames.helpers.saveHighScore('runner_test', 150);
assert.equal(TpMiniGames.helpers.getHighScore('runner_test'), 150, '저장한 최고 점수 150이 조회되어야 합니다.');
TpMiniGames.helpers.saveHighScore('runner_test', 90);
assert.equal(TpMiniGames.helpers.getHighScore('runner_test'), 150, '기존 최고 점수보다 낮은 점수는 덮어쓰지 않아야 합니다.');
TpMiniGames.helpers.saveHighScore('runner_test', 280);
assert.equal(TpMiniGames.helpers.getHighScore('runner_test'), 280, '더 높은 점수 280으로 갱신되어야 합니다.');

console.log('✅ test-core.mjs: 모든 코어 허브 및 퍼펫 모션·하이스코어 테스트 통과!');
