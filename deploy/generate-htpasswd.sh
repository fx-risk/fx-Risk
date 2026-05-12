#!/usr/bin/env bash
# 사내 사용자 3명을 위한 htpasswd 파일 생성 스크립트.
#
# 사용법:
#   bash deploy/generate-htpasswd.sh
# 또는 (Windows PowerShell에서도 Docker만 있으면 동일하게 실행 가능):
#   docker run --rm httpd:alpine htpasswd -nbB user1 'pw1' >> deploy/htpasswd
#
# 이 스크립트는 사용자 이름과 비밀번호를 한 줄씩 입력받아
# deploy/htpasswd 파일을 생성한다. bcrypt 해시를 사용 (강력함).

set -e

OUT="deploy/htpasswd"
> "$OUT"  # 비우기

echo "사내 사용자 3명의 ID/PW를 입력하세요."
echo "예: 경영자, 외환담당자, 관리자"
echo

for i in 1 2 3; do
    read -p "사용자 ${i} ID: " uname
    read -s -p "사용자 ${i} 비밀번호: " upass
    echo
    docker run --rm httpd:alpine htpasswd -nbB "$uname" "$upass" >> "$OUT"
done

echo
echo "✅ 생성 완료: $OUT"
echo "내용 (해시는 가려져 안전합니다):"
cat "$OUT"
