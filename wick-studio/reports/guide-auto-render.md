# 자동 렌더 설정 (명재 PC, Windows)

그록봇이 Drive `wick/queue/<날짜>/`에 `card.json`이나 `script.md`를 쓰면, PC가 정해진 시각(매일 17:12·17:38·18:10·18:40·21:10)에 확인해서 `card.png`·`render.mp4`를 자동으로 만듭니다. 결과는 Drive 동기화로 바로 올라갑니다.

## 한 번만 하면 되는 준비

1. 설치: [Git for Windows](https://git-scm.com/download/win), Node.js 18 이상, Python 3.10 이상, ffmpeg (PATH에 추가)
2. Google Drive 데스크톱 앱에서 `wick` 폴더가 **"오프라인 사용 가능"**(미러링)으로 동기화되게 설정
3. Git Bash에서 `wick-studio` 폴더로 가서 `./setup.sh` 실행
4. `wick-studio/.env`의 `WICK_DIR`를 Drive `wick` 폴더 경로로 수정 (예: `WICK_DIR="G:/내 드라이브/wick"`)
5. 시험: `./render.sh --pending` → `pending: N rendered, 0 failed`가 나오면 성공
6. `wick-studio/scripts/windows/install-task.cmd`를 더블클릭 → 작업 스케줄러에 "WeeklyWick Render"가 위 시각으로 등록됨(창 없이 실행)

## 동작 규칙

- 최근 10일 안의 `queue/<날짜>/`만 봅니다.
- `card.json` 또는 `script.md`(차트 스냅샷·패킷 포함)가 결과물보다 새로우면 다시 렌더합니다. 이미 최신이면 건너뜁니다.
- 점검에 실패하면 `error.md`를 남기고, **입력이 바뀔 때까지 다시 시도하지 않습니다.** 그록봇이 고치면 다음 실행에서 자동으로 렌더됩니다.
- 기록: `wick-studio/out/pending.log`
- 영상은 렌더에 1~2분 걸리고 PC가 깨어 있어야 합니다. 절전 중이면 아래 "절전과 자동 깨우기"의 시각에 PC가 스스로 깹니다.

## 실행 시각과 절전

시각은 Drive 패킷 저장(17:05·18:05)과 그록봇 일정(초안 17:30, 게시 패키지 18:15, 재확인 18:45)에 맞췄습니다.

| 시각 | 하는 일 |
|---|---|
| 17:12 | 첫 패킷을 앱으로 |
| 17:38 | 17:30 초안의 카드·영상 렌더 |
| 18:10 | 두 번째 패킷 + 18:00 전후 차트 스냅샷 반영 (18:15 패키지 전) |
| 18:40 | 늦게 들어온 것 (18:45 재확인 전) |
| 21:10 | 저녁 마무리 |

- 창이 뜨지 않고 뒤에서 돕니다. 기록은 `out/pending.log`.
- PC가 절전 중이면 그 시각에 스스로 깨어나고, 끝날 때까지 깨워 둡니다. 놓친 시각은 깨어나는 즉시 한 번 돕니다.
- 이 PC는 최신 대기 모드(S0)라 전원 연결 시 절전 안 함(`powercfg /change standby-timeout-ac 0`)을 함께 쓰는 것이 가장 확실합니다.
- PC 시계가 한국 시간이어야 합니다. 완전히 종료하거나 재부팅 후 로그인하지 않은 상태에서는 돌지 않습니다.
- 등록 중 오류가 나면 `install-task.cmd`를 마우스 오른쪽 → "관리자 권한으로 실행"합니다.

## 멤버십 앱으로 데이터 보내기

렌더가 끝나면 같은 작업이 `scripts/members-sync.sh`를 돌립니다. Drive `wick/packets`와 `wick/members`에 새 파일이 있으면 `weekly-wick-members` 저장소로 복사해 커밋·푸시하고, Vercel이 앱을 다시 배포합니다. 바뀐 게 없으면 아무것도 하지 않습니다.

- 한 번만: `weekly-wick-members`를 `balance` 옆에 클론하고, `wick-studio/.env`에 `MEMBERS_DIR="C:/Users/<나>/weekly-wick-members"`를 추가합니다.
- `MEMBERS_DIR`이 없으면 이 단계는 건너뜁니다.
- 기록은 `out/pending.log`에 `members: data pushed` / `members: no new data`로 남습니다.

## 코드 업데이트

클로드코드가 렌더 코드를 고쳤다고 하면 `wick-studio/scripts/windows/update.cmd`를 더블클릭합니다. 최신 코드를 받아 오고, 자동 렌더는 다음 실행부터 새 코드로 돕니다.

## 끄기

명령 프롬프트에서 `schtasks /Delete /TN "WeeklyWick Render" /F`
