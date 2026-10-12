# 공용 상시 서버 계획 — 카페24 가상서버 (2026-10-12 초안)

> 여러 저장소에 걸친 운영 문서라 시민법정 저장소 `docs/ops/`에 둔다. K-VOTE·election 저장소에는 이 문서로 가는 링크만 둔다.
> 데스크탑 `C:\Users\lacoi\Desktop\_ops\PROJECTS.md`(git 밖)의 내용은 확인되는 대로 이 문서에 합친다.
> **상태: 초안 — 아래 「결정할 것」이 닫히기 전에는 서버에 아무것도 설치하지 않는다.**

## 0. 왜 서버인가
- K-VOTE(`k-vote.ai.kr`)와 election 백엔드(`api.election.re.kr`)는 지금 **사용자 PC에서** Cloudflare 터널로 공개 중이다. PC가 꺼지면 둘 다 내려간다. 7월 AWS 무료 티어 종료로 EC2가 사라진 뒤 임시로 버텨 온 상태다(K-VOTE `SESSION_HANDOFF.md` §0·§2.12).
- Firebase 함수는 9분·1시간 간격 제한이 있어 상시 프로세스(긴 렌더링·감시 봇)를 못 돌린다.
- 그래서 **서버 프로세스가 상시 떠 있어야 하는 것**만 한 서버에 모은다. 정적 사이트·Firebase·Vercel에서 잘 도는 것은 옮기지 않는다 — 옮겨서 얻는 것이 없고 깨뜨릴 것만 생긴다.

## 1. 서버
| 항목 | 값 |
|---|---|
| 상품 | 카페24 SSD 가상서버 퍼스트클래스 (아이디 `coiffure`) |
| 사양 | RAM 3G · SSD 50G · 트래픽 800G/월 |
| IP | 175.118.124.190 (고정) |
| 계정 | root (초기) → 설치 때 비root 운영 계정으로 바꾼다 |
| 기간 | 2026-10-12 ~ 11-11, **자동연장 미사용** → 자동연장 설정하거나 11-05 알림을 건다. 연장을 놓치면 서버와 데이터가 함께 사라진다 |
| OS | 확인 필요(Ubuntu 22.04/24.04 기대) |

## 2. 사이트별 현황과 결정 (2026-10-12 저장소 기준)
| 사이트 | 저장소 | 기술 | 지금 어디서 | 서버로? | 비고 |
|---|---|---|---|---|---|
| **K-VOTE** | k-vote-demo | Python `run_demo.py` + SQLite + jinja2 | **PC**(127.0.0.1:8090) + Cloudflare 터널 → k-vote.ai.kr | **예 (1순위)** | 재오픈 전 필수 수정(`docs/THREAT_MODEL.md`) #4 ◐. DB·키 파일은 PC에 있어 이전은 K-VOTE 세션에서. `deploy.yml`(SSH 배포) 준비돼 있음 |
| **election 백엔드** | election | FastAPI + uvicorn + SQLite, NEC API 수집 | **PC**(8000) + Cloudflare 터널 → api.election.re.kr | **예 (2순위)** | 프런트는 Vercel(election.re.kr) — 그대로 두고 `VITE_API_URL`만 서버 주소로 |
| election 프런트 | election/frontend | React+Vite | Vercel | 아니오(유지) | 원하면 서버 nginx 정적으로도 가능 |
| worldforum2 | worldforum2 | React 프런트(개발 상태) + Python ETL + 정적 뷰어 | 공개 호스팅 없음 | **보류** | 정적 뷰어는 nginx에 폴더 하나로 올릴 수 있음. ETL은 수동 실행 |
| **시민법정** | hybrid-jury-system | React+Vite + Firebase(호스팅·함수·Firestore) | Firebase | **아니오(유지)** | 카카오 공유·SSR·텔레그램 봇이 Firebase에 묶여 있음. 긴 작업(영상 렌더·상시 수집)만 선택적으로 서버에 |
| 기본권 학습터 | fundamentalrights | Astro 정적 | GitHub Pages → fundamentalrights.kr | 아니오(유지) | 서버 불필요 |
| 마을살림/나라살림 | budget | Next.js 16 + Neon DB + Gemini | Vercel(Hobby) | 아니오(유지) | Vercel 한도에 걸리면 그때 서버 검토 |
| 단체교섭 | lprc | 정적 + Actions 데이터 갱신 | GitHub Pages → 단체교섭.kr | 아니오(유지) | 브라우저 전용, 서버 없음이 설계 |
| ai-finance(내부) | ai-finance | Python 크론 40여 개 + Pages 대시보드 + 텔레그램 | GitHub Actions | 아니오(유지) | Actions 분 한도에 걸리면 서버 크론으로 이전 검토 |
| 모두의 법(전) | easylaw | React + Firebase | Firebase(출시 전) | 아니오(유지) | — |

**요약: 서버에 올리는 것은 K-VOTE와 election 백엔드 둘이다.** 나머지는 그대로. 이 둘만 옮겨도 「PC를 켜 두어야 사이트가 산다」는 상태가 끝난다.

## 3. 서버 구조 (제안)
```
인터넷 → Cloudflare(DNS·프록시, 기존 계정) → 175.118.124.190
          nginx (80/443, Let's Encrypt)  ─┬─ k-vote.ai.kr        → 127.0.0.1:8090  (systemd k-vote)
                                           ├─ api.election.re.kr  → 127.0.0.1:8000  (systemd election-api)
                                           └─ (worldforum2 뷰어)  → /srv/worldforum2/viewer (정적)
```
- **역프록시 nginx**: K-VOTE DEPLOY.md가 nginx 기준이고 옛 EC2 설정 기록(`SESSION_HANDOFF.md` §2.10 B의 `try_files @named` 함정)이 있어 그대로 재사용. 인증서는 certbot.
- **Cloudflare 프록시 유지**: 지금 두 도메인 다 Cloudflare에 있으므로 터널 CNAME을 **A 레코드(서버 IP, 프록시 켬)** 로 바꾸기만 하면 된다. 서버 IP가 숨겨지고 DDoS 완충이 된다. 다만 K-VOTE `KVOTE_ALLOWED_HOSTS`·election CORS 는 도메인 기준이라 그대로.
- **앱마다 systemd 서비스 + 전용 리눅스 계정** (`kvote`, `election`). 서로의 파일을 못 읽게.
- **포트**: K-VOTE 8090(PC 공개용과 같은 번호로 혼선 방지), election 8000. 모두 127.0.0.1 바인딩.
- **배포**: GitHub Actions → SSH(`appleboy/ssh-action`) → `git fetch && reset --hard origin/main && systemctl restart`. K-VOTE `deploy.yml`이 이미 이 모양이다(Secrets `SSH_HOST`·`SSH_USER`·`SSH_PRIVATE_KEY`만 넣고 push 트리거 주석 해제). election도 같은 워크플로를 복제.
- **데이터 위치**: `/srv/<앱>/data/`(DB) · `/etc/<앱>/`(키·비밀값, 0600). 코드 폴더와 분리해 `reset --hard`에 쓸리지 않게.

## 4. 보안 기본 (설치 첫 30분에 끝낼 것)
1. 비root 계정 만들고 `sudo` 부여 → **SSH 키 로그인만** 허용(`PasswordAuthentication no`, `PermitRootLogin no`).
2. `ufw`: 22·80·443만. (Cloudflare 프록시를 쓰면 80·443도 Cloudflare IP 대역만 허용 가능 — 2단계에서)
3. `fail2ban` + `unattended-upgrades`.
4. 카페24 「서버원격 관리」 콘솔 비밀번호도 바꾼다(초기값 메일로 왔을 것).
5. 비밀번호·키는 **어디에도 적지 않는다**(채팅·git·메모 파일). 서버 안 `/etc/<앱>/`과 사용자 PC의 비밀번호 관리자에만.

## 5. 백업
- 매일 새벽: `/srv/*/data` + `/etc/<앱>` → 압축 → **서버 밖**(사용자 PC로 `rsync` 당겨 오기, 또는 GitHub 비공개 저장소는 금지 — DB에 개인정보) 보관. K-VOTE 키 파일은 DB와 **다른 곳**에(THREAT_MODEL A7).
- 카페24 스냅샷 옵션이 있으면 주 1회.
- 복구 리허설을 한 번은 한다(복구 안 해 본 백업은 백업이 아니다).

## 6. 설치 순서
| 단계 | 할 일 | 어느 세션에서 | 전제 |
|---|---|---|---|
| 0 | §4 보안 기본, nginx·certbot·python3·git 설치 | 아무 세션(서버 SSH) | OS 확인 |
| 1 | K-VOTE: `/srv/k-vote` 클론, 계정·systemd·nginx, **PC의 공개용 DB(`public.db`)·키 파일 이전**, `KVOTE_ALLOWED_HOSTS` | **K-VOTE 세션(데스크탑)** — DB·키가 그 PC에 있음 | THREAT_MODEL 「재오픈 전 필수 수정」 판단, 운영 비번 새로 |
| 2 | Cloudflare DNS: k-vote.ai.kr 터널 CNAME → A 175.118.124.190(프록시) → 확인 뒤 PC 터널 끄기 | 사용자 | 1 완료 |
| 3 | election 백엔드: 같은 방식(계정·systemd·nginx), SQLite·`.env` 이전, Vercel `VITE_API_URL` 변경 | **election 세션(데스크탑)** | — |
| 4 | DNS: api.election.re.kr → 서버. PC의 「Election Public Server」 예약 작업 해제 | 사용자 | 3 완료 |
| 5 | GitHub Actions SSH 배포 연결(두 저장소), Secrets 등록 | 각 저장소 세션 | 1·3 |
| 6 | 백업(§5)·감시(업타임 체크 → 텔레그램) | 아무 세션 | — |
| 7 | (선택) worldforum2 뷰어, 시민법정 긴 작업 | 해당 세션 | — |

## 7. 결정할 것 (사용자)
- [ ] 서버 OS 확인(카페24 콘솔) — Ubuntu이면 이 문서 그대로, CentOS/Rocky이면 패키지 명령만 바뀜.
- [ ] **자동연장** 켤지(권장) — 꺼 두면 매달 11일 전에 직접 연장.
- [ ] worldforum2를 지금 올릴지 보류할지.
- [ ] 시민법정의 어떤 긴 작업을 서버로 보낼지(지금은 없음 — 필요할 때).
- [ ] 역프록시: nginx(기존 기록 재사용) vs Caddy(인증서 자동, 설정 짧음). **제안: nginx** — K-VOTE 문서가 nginx 기준.
- [ ] `_ops/PROJECTS.md` 내용 합치기.

## 8. 이 문서가 생긴 경위
- 2026-10-11 K-VOTE 세션에서 「하나의 서버에 여러 프로젝트」 결정 → 사용자가 10-12 카페24 가상서버 신청. 그 대화는 저장소에 남지 않아 10-12 시민법정 세션이 저장소 7개를 읽고 이 초안을 썼다(Oracle Cloud 대신 카페24를 고른 이유는 K-VOTE 세션에 물어 적을 것).
